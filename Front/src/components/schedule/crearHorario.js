document.addEventListener('DOMContentLoaded', () => {
<<<<<<< HEAD
    const form = document.getElementById('createHorarioForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const inicio = document.getElementById('horaInicio').value;
        const fin = document.getElementById('horaFin').value;
        const dia = document.getElementById('diaSemana').value.toLowerCase(); // backend espera en minúsculas
        
        let isValid = true;
        
        // Validación de campos vacíos
        if (inicio === "" || fin === "" || dia === "") {
            alertPlaceholder('Por favor, selecciona un día, hora de inicio y hora de fin.', 'warning');
            isValid = false;
        } 
        
        // Validación de lógica: La hora de inicio debe ser estrictamente anterior a la hora de fin.
        if (isValid && inicio >= fin) {
            console.error("Error: La hora de inicio debe ser anterior a la hora de fin.");
            alertPlaceholder('Error: La hora de inicio debe ser anterior a la hora de fin.', 'danger');
            isValid = false;
        }

        if (isValid) {
            try {
                // 🚀 Enviar al backend
                const response = await fetch("http://localhost:3000/schedules", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        day: dia,
                        start: inicio,
                        end: fin
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    alertPlaceholder("❌ Error al crear horario: " + errorData.error, "danger");
                    return;
                }

                const data = await response.json();
                alertPlaceholder("✅ Horario creado con éxito: " + dia + ", de " + inicio + " a " + fin, "success");
                console.log("Horario guardado en backend:", data);
                form.reset();

            } catch (err) {
                console.error("Error de conexión:", err);
                alertPlaceholder("❌ No se pudo conectar con el servidor", "danger");
            }
        }
    });

    // Función para mostrar un mensaje temporal (reemplaza alert())
    function alertPlaceholder(message, type) {
        let alertDiv = document.getElementById('tempAlert');
        
        if (alertDiv) {
            alertDiv.remove();
        }

        alertDiv = document.createElement('div');
        alertDiv.id = 'tempAlert';
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 w-75 w-md-50`;
        alertDiv.role = 'alert';
        alertDiv.style.zIndex = '1050'; 

        alertDiv.innerHTML = `<strong>${message}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            const currentAlert = document.getElementById('tempAlert');
            if(currentAlert) {
                new bootstrap.Alert(currentAlert).close();
            }
        }, 4000);
    }
=======
  const form = document.getElementById('createHorarioForm');
  const dia = document.getElementById('diaSemana');
  const inicio = document.getElementById('horaInicio');
  const fin = document.getElementById('horaFin');

  const MAX_MINUTES = 120;
  const MIN_MINUTES = 20;

  const log = (...args) => console.log('[crearHorario]', ...args);

  const timeToMinutes = (t) => {
    if (!t) return NaN;
    const parts = String(t).split(':').map(Number);
    if (parts.length !== 2 || parts.some(v => Number.isNaN(v))) return NaN;
    return parts[0] * 60 + parts[1];
  };

  function showFormMessage(text, type = 'info') {
    let container = document.getElementById('crearHorarioMsg');
    if (!container) {
      container = document.createElement('div');
      container.id = 'crearHorarioMsg';
      container.setAttribute('role', 'status');
      container.style.marginTop = '12px';
      container.style.fontWeight = '600';
      form.appendChild(container);
    }
    container.textContent = text;
    container.style.color = type === 'error' ? '#b72b2b' : type === 'success' ? '#0b7a3b' : '#334155';
  }

  function validateTimes() {
    const s = timeToMinutes(inicio.value);
    const e = timeToMinutes(fin.value);
    if (!Number.isFinite(s) || !Number.isFinite(e)) {
      return { ok: false, msg: 'Selecciona hora de inicio y hora de fin válidas.' };
    }
    if (e <= s) return { ok: false, msg: 'La hora de fin debe ser posterior a la hora de inicio.' };
    const diff = e - s;
    if (diff < MIN_MINUTES) return { ok: false, msg: `La duración mínima es ${MIN_MINUTES} minutos.` };
    if (diff > MAX_MINUTES) return { ok: false, msg: 'La diferencia entre inicio y fin no puede ser mayor a 2 horas.' };
    return { ok: true, duration: diff };
  }

  async function horarioDuplicado(slot, tutorId) {
    try {
      const res = await fetch(`/horarios?tutorId=${encodeURIComponent(tutorId)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'same-origin'
      });
      if (!res.ok) return false;
      const existentes = await res.json();
      return existentes.some(h =>
        h.day === slot.day &&
        h.horaInicio === slot.horaInicio &&
        h.horaFin === slot.horaFin
      );
    } catch (err) {
      log('error checking duplicates', err);
      return false;
    }
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    log('submit fired');

    const v = validateTimes();
    if (!v.ok) {
      log('validation failed', v.msg);
      return showFormMessage(v.msg, 'error');
    }

    let usuario = null;
    try {
      usuario = JSON.parse(localStorage.getItem('usuario')) || null;
    } catch (e) {
      log('error parsing usuario from localStorage', e);
    }
    if (!usuario) {
      showFormMessage('Debes iniciar sesión como tutor para crear horarios.', 'error');
      return;
    }
    if (String((usuario.rol || '')).toLowerCase() !== 'tutor') {
      showFormMessage('Debes tener el rol tutor para crear horarios.', 'error');
      return;
    }

    const tutorId = usuario.id || usuario.userId || usuario.tutorId;
    if (!tutorId) {
      showFormMessage('No se encontró identificador de tutor en sesión.', 'error');
      return;
    }

    const slot = { day: dia.value, horaInicio: inicio.value, horaFin: fin.value };
    const payloadBase = {
      role: 'tutor',
      tutorId,
      slots: [slot]
    };

    log('payload base', payloadBase);
    showFormMessage('Validando horario...', 'info');

    // Verificar si ya existe un horario idéntico
    if (await horarioDuplicado(slot, tutorId)) {
      showFormMessage('Ya existe un horario idéntico. No se puede duplicar.', 'error');
      return;
    }

    try {
      const previewRes = await fetch('/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBase)
      });
      const previewJson = await previewRes.json().catch(() => ({}));
      log('preview response', previewRes.status, previewJson);

      if (!previewRes.ok) {
        const err = previewJson?.error || previewJson?.message || `Error ${previewRes.status}`;
        showFormMessage(err, 'error');
        return;
      }

      if (previewJson.message === "Confirma para continuar") {
        showFormMessage(previewJson.message, 'info');

        // Mostrar botones de confirmación
        const confirmBox = document.getElementById("confirmMessage");
        confirmBox.innerHTML = "";

        const confirmYesBtn = document.createElement("button");
        confirmYesBtn.textContent = "Sí, crear el horario";
        confirmYesBtn.className = "btn btn-success btn-sm me-2";

        const confirmNoBtn = document.createElement("button");
        confirmNoBtn.textContent = "No, descartar la creación";
        confirmNoBtn.className = "btn btn-danger btn-sm";

        confirmBox.appendChild(confirmYesBtn);
        confirmBox.appendChild(confirmNoBtn);

        // Si el usuario confirma
        confirmYesBtn.addEventListener("click", async () => {
          const res2 = await fetch('/horarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payloadBase, confirm: "yes" })
          });

          let data2 = {};
          try {
            data2 = await res2.json();
          } catch (e) {
            // Si no hay body JSON, seguimos con objeto vacío
          }

          if (res2.ok || res2.status === 201) {
            showFormMessage(data2.message || "Horario creado correctamente", 'success');
            setTimeout(() => { window.location.href = '/gestion.html'; }, 900);
          } else {
            showFormMessage(data2.message || `Error ${res2.status}`, 'error');
          }
        });

        // Si el usuario cancela
        confirmNoBtn.addEventListener("click", async () => {
          const res2 = await fetch('/horarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payloadBase, confirm: "no" })
          });

          let data2 = {};
          try {
            data2 = await res2.json();
          } catch (e) {}

          showFormMessage(data2.message || "Horario no creado", 'warning');
          setTimeout(() => { window.location.href = '/gestion.html'; }, 900);
        });

      } else {
        showFormMessage(previewJson.message, 'secondary');
      }

    } catch (err) {
      log('network error', err);
      showFormMessage('Error de red creando el horario', 'error');
    }
  });

  inicio.addEventListener('change', () => {
    const s = timeToMinutes(inicio.value);
    if (!Number.isFinite(s)) return;
    const opts = Array.from(fin.options);
    opts.forEach(opt => {
      if (!opt.value) return;
      const v = timeToMinutes(opt.value);
      opt.disabled = !(v > s && (v - s) <= MAX_MINUTES);
    });
    if (timeToMinutes(fin.value) <= s || (timeToMinutes(fin.value) - s) > MAX_MINUTES) {
      fin.value = '';
    }
  });
>>>>>>> origin/mauricio
});
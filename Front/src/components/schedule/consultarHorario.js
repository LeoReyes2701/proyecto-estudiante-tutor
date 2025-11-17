// ../src/components/schedule/consultarHorario.js
document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('.page-content-wrapper');
  const log = (...args) => console.log('[consultarHorario]', ...args);

  function showMessage(text, type = 'info') {
    let el = document.getElementById('consultarHorarioMsg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'consultarHorarioMsg';
      el.style.margin = '18px 0';
      el.style.fontWeight = '600';
      wrapper.parentNode.insertBefore(el, wrapper);
    }
    el.textContent = text;
    el.style.color = type === 'error' ? '#b72b2b' : '#0b7a3b';
  }

  function clearMessage() {
    const el = document.getElementById('consultarHorarioMsg');
    if (el) el.textContent = '';
  }

  function timeDisplay(hhmm) {
    if (!hhmm) return '';
    const [hh, mm] = hhmm.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return hhmm;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = ((hh + 11) % 12) + 1;
    return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
  }

  function buildCard(tutorId, day, slots, isTutor, allSchedules) {
    const card = document.createElement('div');
    card.className = 'card shadow-sm schedule-card';

    const h5 = document.createElement('h5');
    h5.className = 'day-title fw-bold mb-3';
    h5.textContent = day;
    card.appendChild(h5);

    // Para cada slot, crear una fila con radio button y horario
    slots.forEach((slot, index) => {
      const slotDiv = document.createElement('div');
      slotDiv.className = 'd-flex justify-content-between align-items-center mb-2';

      const left = document.createElement('div');
      left.className = 'd-flex align-items-center';

      // Radio button para selección (solo para tutores)
      if (isTutor) {
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'scheduleSelection';
        radio.className = 'me-2';
        radio.value = JSON.stringify({
          day,
          slot: {
            ...slot,
            horaInicio: slot.horaInicio || slot.start,
            horaFin: slot.horaFin || slot.end
          },
          scheduleId: slot.scheduleId
        });
        left.appendChild(radio);
      }

      const timeText = document.createElement('span');
      timeText.textContent = `${timeDisplay(slot.horaInicio || slot.start)} - ${timeDisplay(slot.horaFin || slot.end)}`;
      left.appendChild(timeText);

      slotDiv.appendChild(left);
      card.appendChild(slotDiv);
    });

    return card;
  }

  function groupSlotsByDay(slots = []) {
    const map = {};
    (slots || []).forEach(s => {
      const day = (s.day || 'Sin día').trim();
      if (!map[day]) map[day] = [];
      map[day].push(s);
    });
    Object.keys(map).forEach(day => {
      map[day].sort((a, b) => {
        const toMin = t => {
          const hhmm = t.horaInicio || t.start || '';
          const [h, m] = String(hhmm).split(':').map(Number);
          if (Number.isNaN(h)) return 0;
          return h * 60 + (Number.isNaN(m) ? 0 : m);
        };
        return toMin(a) - toMin(b);
      });
    });
    return map;
  }

  async function loadAndRender() {
    clearMessage();
    wrapper.innerHTML = '';

    const usuarioRaw = localStorage.getItem('usuario');
    if (!usuarioRaw) {
      showMessage('No hay sesión activa. Inicia sesión para ver tus horarios.', 'error');
      return;
    }

    let usuario;
    try {
      usuario = JSON.parse(usuarioRaw);
    } catch (e) {
      log('error parsing usuario', e);
      showMessage('Error leyendo la sesión. Vuelve a iniciar sesión.', 'error');
      return;
    }

    const usuarioId = usuario.id || usuario.userId || usuario._id || null;
    const role = String(usuario.role || usuario.rol || (usuario.isTutor ? 'tutor' : '') || usuario.tipo || '').toLowerCase();
    const isTutor = ['tutor', 'teacher', 'profesor', 'admin'].includes(role);

    if (!usuarioId) {
      showMessage('Identificador de usuario no encontrado en sesión.', 'error');
      return;
    }

    showMessage('Cargando horarios...', 'info');

    try {
      const [tutoriasRes, horariosRes] = await Promise.all([
        fetch('/tutorias', { credentials: 'include' }),
        fetch('/horarios', { credentials: 'include' })
      ]);

      if (!tutoriasRes.ok) {
        const body = await tutoriasRes.json().catch(() => ({}));
        showMessage(body.error || `Error ${tutoriasRes.status} al cargar tutorías`, 'error');
        return;
      }
      if (!horariosRes.ok) {
        const body = await horariosRes.json().catch(() => ({}));
        showMessage(body.error || `Error ${horariosRes.status} al cargar horarios`, 'error');
        return;
      }

      const allTutorias = await tutoriasRes.json();
      const allHorarios = await horariosRes.json();

      // Solo lógica para tutores: mostrar TODOS los horarios creados por el tutor
      const mineSchedules = allHorarios.filter(s => String(s.tutorId || s.userId || s.creadorId) === String(usuarioId));

      if (!mineSchedules.length) {
        showMessage('No has creado ningún horario.', 'info');
        return;
      }

      clearMessage();

      const allSlots = [];
      mineSchedules.forEach(sch => {
        (sch.slots || []).forEach(slot => {
          allSlots.push(Object.assign({}, slot, {
            scheduleId: sch.id || sch._id || null,
            tutorId: sch.tutorId || sch.userId || null
          }));
        });
      });

      const byDay = groupSlotsByDay(allSlots);
      const order = ['Lunes','Martes','Miércoles','Miercoles','Jueves','Viernes','Sábado','Sabado','Domingo'];
      const days = Object.keys(byDay).sort((a,b) => {
        const ia = order.findIndex(x => x.toLowerCase() === a.toLowerCase());
        const ib = order.findIndex(x => x.toLowerCase() === b.toLowerCase());
        if (ia === -1 && ib === -1) return a.localeCompare(b);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });

      days.forEach(day => {
        const card = buildCard(usuarioId, day, byDay[day], isTutor, mineSchedules);
        wrapper.appendChild(card);
      });

      // Agregar botones de acción para tutores
      if (isTutor && mineSchedules.length > 0) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'mt-4 d-flex justify-content-center gap-3';
        actionsDiv.innerHTML = `
          <button id="modifyBtn" class="btn btn-primary" disabled>Modificar</button>
          <button id="deleteBtn" class="btn btn-danger" disabled>Eliminar</button>
        `;
        wrapper.appendChild(actionsDiv);

        // Habilitar/deshabilitar botones según selección
        const radios = document.querySelectorAll('input[name="scheduleSelection"]');
        radios.forEach(radio => {
          radio.addEventListener('change', () => {
            document.getElementById('modifyBtn').disabled = false;
            document.getElementById('deleteBtn').disabled = false;
          });
        });

        // Evento para modificar
        document.getElementById('modifyBtn').addEventListener('click', () => {
          const selectedRadio = document.querySelector('input[name="scheduleSelection"]:checked');
          if (!selectedRadio) return;
          const selectedData = JSON.parse(selectedRadio.value);
          const slot = selectedData.slot;
          const scheduleId = selectedData.scheduleId;
          if (!scheduleId) {
            showMessage('No se puede modificar este horario: falta ID', 'error');
            return;
          }
          // Redirect to crearHorario.html with edit params
          const params = new URLSearchParams({
            edit: 'true',
            id: scheduleId,
            day: slot.day,
            horaInicio: slot.horaInicio,
            horaFin: slot.horaFin
          });
          window.location.href = `/crearHorario.html?${params.toString()}`;
        });

        // Evento para eliminar
        document.getElementById('deleteBtn').addEventListener('click', () => {
          const selectedRadio = document.querySelector('input[name="scheduleSelection"]:checked');
          if (!selectedRadio) return;
          const selectedData = JSON.parse(selectedRadio.value);
          const scheduleId = selectedData.scheduleId;
          if (!scheduleId) {
            showMessage('No se puede eliminar este horario: falta ID', 'error');
            return;
          }
          if (confirm(`¿Estás seguro de que quieres eliminar el horario de ${selectedData.day}?`)) {
            deleteSchedule(scheduleId);
          }
        });
      }
    } catch (err) {
      log('network error', err);
      showMessage('Error de red al cargar horarios.', 'error');
    }
  }

  async function deleteSchedule(scheduleId) {
    try {
      const response = await fetch(`/horarios/${scheduleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();
      if (response.ok) {
        showMessage('Horario eliminado exitosamente', 'success');
        loadAndRender(); // Recargar la página
      } else {
        showMessage(result.error || 'Error al eliminar horario', 'error');
      }
    } catch (err) {
      log('error deleting schedule', err);
      showMessage('Error de red al eliminar horario', 'error');
    }
  }

  loadAndRender();
});

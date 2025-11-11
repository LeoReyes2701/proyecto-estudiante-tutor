// Importar modales
import '/src/utils/modals.js';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.row');
  const btnInscribirse = document.querySelector('.btn-ucab-primary');
  
  // Obtener usuario actual desde cookie
  function getCurrentUser() {
    try {
      const cookieHeader = document.cookie;
      const usuarioCookie = cookieHeader.split(';').find(c => c.trim().startsWith('usuario='));
      if (!usuarioCookie) return null;
      const userData = JSON.parse(atob(usuarioCookie.split('=')[1]));
      return userData;
    } catch (e) {
      console.error('Error obteniendo usuario de cookie:', e);
      return null;
    }
  }

  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = '/logIn.html';
    return;
  }

  const message = document.createElement('div');
  message.className = 'text-center mt-4 text-muted fs-5';
  container.parentElement.appendChild(message);

  message.textContent = 'Cargando tutorías...';

  try {
    // Cargar datos usando credentials para autenticación por cookie
    const [tutoriasRes, inscripcionesRes, horariosRes] = await Promise.all([
      fetch('/tutorias', { credentials: 'include' }),
      fetch('/inscripciones/me', { credentials: 'include' }),
      fetch('/horarios', { credentials: 'include' })
    ]);

    if (!tutoriasRes.ok) {
      const errorText = await tutoriasRes.text();
      console.error('Error en tutorías:', errorText);
      message.textContent = `Error al cargar tutorías: ${tutoriasRes.status}`;
      return;
    }

    const tutorias = await tutoriasRes.json();
    let inscripciones = [];
    let horarios = [];
    
    if (inscripcionesRes.ok) {
      inscripciones = await inscripcionesRes.json();
    }

    if (horariosRes.ok) {
      horarios = await horariosRes.json();
    }

    // Tutorías donde el usuario YA está inscrito
    const tutoriasInscritas = inscripciones.map(i => String(i.tutoriaId));

    // Crear mapa de horarios por ID
    const horariosMap = new Map();
    horarios.forEach(h => horariosMap.set(h.id, h));

    // Enriquecer tutorías con sus horarios
    const tutoriasConHorarios = tutorias.map(t => ({
      ...t,
      horario: t.horarioId ? horariosMap.get(t.horarioId) : null
    }));

    // Mostrar todas las tutorías disponibles que no sean del usuario actual y donde no esté inscrito
    const disponibles = tutoriasConHorarios.filter(t => {
      const esPropia = String(t.creadorId) === String(currentUser.id);
      const yaInscrito = tutoriasInscritas.includes(String(t.id));
      return !esPropia && !yaInscrito;
    });

  // Horarios ya ocupados por inscripciones previas del usuario
  const initialOccupiedHorarios = new Set(inscripciones.filter(i => i.horarioId).map(i => String(i.horarioId)));

  renderTutorias(disponibles, horariosMap, initialOccupiedHorarios);

    if (disponibles.length === 0) {
      message.textContent = 'No hay tutorías disponibles para inscribirse.';
      return;
    }

    message.textContent = '';
  } catch (error) {
    console.error('Error al cargar datos:', error);
    message.textContent = 'Error al conectar con el servidor: ' + error.message;
  }

  function renderTutorias(tutorias, horariosMap, initialOccupiedHorarios = new Set()) {
    container.innerHTML = '';
    
    // Estado dinámico de horarios ocupados (incluye seleccionados en la UI)
    const occupied = new Set(initialOccupiedHorarios);

    // Helper: refrescar estado disabled de inputs según 'occupied'
    function refreshDisabledState() {
      // Para cada radio/hidden input de horario, deshabilitar si su horario está en 'occupied' y
      // no es el horario actualmente seleccionado para su propia tutoría
      document.querySelectorAll('[name^="horario-"]').forEach(input => {
        const name = input.name; // horario-<tutoriaId>
        const tutoriaId = name.replace('horario-', '');
        const selectedForThis = (document.querySelector(`input[name="${name}"]:checked`) || document.querySelector(`input[name="${name}"]`));
        const selectedValue = selectedForThis ? String(selectedForThis.value) : null;
        const val = String(input.value);
        // allow if this is the selected value for this tutoria
        if (selectedValue && val === selectedValue) {
          input.disabled = false;
          input.closest && input.closest('label') && input.closest('label').classList && input.closest('label').classList.remove('text-muted');
          input.title = '';
        } else if (occupied.has(val)) {
          input.disabled = true;
          input.title = 'Horario ya ocupado por otra inscripción (no puedes elegirlo)';
        } else {
          input.disabled = false;
          input.title = '';
        }
      });

      // Para cada checkbox (tutoria), deshabilitar si todas sus opciones de horario están deshabilitadas
      document.querySelectorAll('.form-check-input[type="checkbox"]').forEach(chk => {
        const tutoriaId = chk.value;
        const horarioInputs = Array.from(document.querySelectorAll(`[name="horario-${tutoriaId}"]`));
        if (horarioInputs.length === 0) return; // no change
        const anyAvailable = horarioInputs.some(i => !i.disabled);
        chk.disabled = !anyAvailable;
        const label = document.querySelector(`label[for="check-${tutoriaId}"]`);
        if (chk.disabled && label) {
          label.title = 'No hay horarios disponibles sin conflicto para esta tutoría';
        } else if (label) {
          label.title = '';
        }
      });
    }
    tutorias.forEach(tutoria => {
      const card = document.createElement('div');
      card.className = 'col';
      
      // Renderizar horarios disponibles para esta tutoría
      const horarioHtml = renderHorarioSelector(tutoria, horariosMap);
      
      card.innerHTML = `
        <div class="card tutoria-card p-4 border rounded-3 shadow-sm h-100 d-flex flex-column">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h3 class="tutoria-title fs-5 mb-0 flex-grow-1">${tutoria.titulo || tutoria.nombre || 'Tutoria'}</h3>
            <div class="form-check ms-2">
              <input class="form-check-input" type="checkbox" value="${tutoria.id}" id="check-${tutoria.id}" style="width: 18px; height: 18px;">
            </div>
          </div>
          
          <p class="tutoria-description mb-2 flex-grow-1">${tutoria.descripcion || 'Sin descripción disponible'}</p>
          
          ${horarioHtml}
          
          <div class="mt-auto">
            <small class="tutoria-creator">Tutor: ${tutoria.creadorNombre || 'No especificado'}</small>
            <br>
            <small class="text-muted">Creada: ${new Date(tutoria.createdAt).toLocaleDateString('es-ES')}</small>
          </div>
          
          <label class="form-check-label mt-2 btn btn-outline-primary btn-sm" for="check-${tutoria.id}" style="cursor: pointer;">
            <span class="select-text">Seleccionar</span>
            <span class="selected-text d-none">✓ Seleccionada</span>
          </label>
        </div>
      `;
      
      // Agregar event listener para el efecto visual
      const checkbox = card.querySelector('.form-check-input');
      const cardElement = card.querySelector('.tutoria-card');
      const label = card.querySelector('.form-check-label');
      const selectText = label.querySelector('.select-text');
      const selectedText = label.querySelector('.selected-text');
      
      // Mantener el horario seleccionado actualmente para esta tutoría
      let selectedHorarioForThis = null;

      // Si hay un input hidden (unico horario), setear selectedHorarioForThis
      const hiddenHorario = card.querySelector(`input[name="horario-${tutoria.id}"]`);
      if (hiddenHorario && hiddenHorario.type === 'hidden') {
        selectedHorarioForThis = hiddenHorario.value;
      }

      // Cuando cambie la selección de radio de horario para esta tutoría
      card.querySelectorAll(`input[name="horario-${tutoria.id}"]`).forEach(input => {
        input.addEventListener('change', () => {
          const prev = selectedHorarioForThis;
          selectedHorarioForThis = input.value;
          // Si la tutoria está marcada (checkbox checked), actualizar occupied set
          if (checkbox.checked) {
            if (prev) occupied.delete(String(prev));
            occupied.add(String(selectedHorarioForThis));
          }
          refreshDisabledState();
        });
      });

      // Checkbox change: add/remove selected horario to occupied
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          // obtener horario seleccionado para esta tutoría
          const horarioInput = document.querySelector(`input[name="horario-${tutoria.id}"]:checked`) || document.querySelector(`input[name="horario-${tutoria.id}"]`);
          if (!horarioInput) {
            showWarning('Debes seleccionar un horario válido para esta tutoría', {
              title: 'Horario requerido'
            });
            checkbox.checked = false;
            return;
          }
          const hid = String(horarioInput.value);
          // si el horario ya está ocupado por otra selección, impedir
          if (occupied.has(hid)) {
            showWarning('No puedes seleccionar esta tutoría porque su horario está ocupado por otra inscripción.', {
              title: 'Conflicto de horario',
              confirmText: 'Entendido'
            });
            checkbox.checked = false;
            return;
          }
          selectedHorarioForThis = hid;
          occupied.add(hid);
          cardElement.classList.add('selected');
          label.classList.remove('btn-outline-primary');
          label.classList.add('btn-primary');
          selectText.classList.add('d-none');
          selectedText.classList.remove('d-none');
        } else {
          // quitar de occupied
          if (selectedHorarioForThis) occupied.delete(String(selectedHorarioForThis));
          selectedHorarioForThis = null;
          cardElement.classList.remove('selected');
          label.classList.add('btn-outline-primary');
          label.classList.remove('btn-primary');
          selectText.classList.remove('d-none');
          selectedText.classList.add('d-none');
        }
        refreshDisabledState();
      });
      
      container.appendChild(card);
      // después de añadir la card, refrescar estado global de disabled
      // (necesario porque inputs acaban de añadirse al DOM)
      // ejecutar en next tick para asegurar que todos los inputs están presentes
      setTimeout(refreshDisabledState, 0);
    });
  }

  function renderHorarioSelector(tutoria, horariosMap) {
    // Buscar horarios disponibles para el tutor de esta tutoría
    const horariosDelTutor = Array.from(horariosMap.values())
      .filter(h => h.tutorId === tutoria.creadorId);

    if (horariosDelTutor.length === 0) {
      return '<div class="alert alert-warning alert-sm mb-2"><small>Sin horarios disponibles</small></div>';
    }

    if (horariosDelTutor.length === 1) {
      // Solo un horario disponible, mostrarlo sin selector
      const horario = horariosDelTutor[0];
      const slotsHtml = horario.slots.map(slot => 
        `<small class="d-block text-muted">${slot.day}: ${slot.horaInicio} - ${slot.horaFin}</small>`
      ).join('');
      
      return `
        <div class="mb-2 border rounded p-2 bg-light">
          <div class="fw-bold small text-secondary mb-1">Horario disponible:</div>
          ${slotsHtml}
          <input type="hidden" name="horario-${tutoria.id}" value="${horario.id}">
        </div>
      `;
    }

    // Múltiples horarios disponibles, mostrar selector
    const opcionesHtml = horariosDelTutor.map(horario => {
      const slotsText = horario.slots.map(slot => 
        `${slot.day}: ${slot.horaInicio}-${slot.horaFin}`
      ).join(', ');
      
      return `
        <div class="form-check form-check-inline me-3 mb-1">
          <input class="form-check-input" type="radio" name="horario-${tutoria.id}" 
                 id="horario-${tutoria.id}-${horario.id}" value="${horario.id}">
          <label class="form-check-label small" for="horario-${tutoria.id}-${horario.id}">
            ${slotsText}
          </label>
        </div>
      `;
    }).join('');

    return `
      <div class="mb-2 border rounded p-2 bg-light">
        <div class="fw-bold small text-secondary mb-2">Selecciona horario:</div>
        ${opcionesHtml}
      </div>
    `;
  }

  // Manejar inscripción directa
  if (btnInscribirse) {
    btnInscribirse.addEventListener('click', async () => {
      const tutoriasSeleccionadas = Array.from(document.querySelectorAll('.form-check-input:checked'))
        .filter(chk => chk.id.startsWith('check-'))
        .map(chk => chk.value);

      if (tutoriasSeleccionadas.length === 0) {
        showWarning('Debes seleccionar al menos una tutoría para inscribirte.', {
          title: 'Selección requerida',
          confirmText: 'Entendido'
        });
        return;
      }

      // Validar que se haya seleccionado horario para cada tutoría (si hay múltiples opciones)
      const inscripciones = [];
      let validacionOk = true;

      for (const tutoriaId of tutoriasSeleccionadas) {
        // Buscar horario seleccionado o único para esta tutoría
        const horarioInput = document.querySelector(`input[name="horario-${tutoriaId}"]:checked`) ||
                            document.querySelector(`input[name="horario-${tutoriaId}"]`);
        
        if (!horarioInput) {
          showWarning('Debes seleccionar un horario para la tutoría seleccionada.', {
            title: 'Horario requerido',
            confirmText: 'Entendido'
          });
          validacionOk = false;
          break;
        }

        inscripciones.push({
          tutoriaId: tutoriaId,
          horarioId: horarioInput.value
        });
      }

      if (!validacionOk) return;

      // Realizar inscripción directamente
      try {
        btnInscribirse.disabled = true;
        btnInscribirse.textContent = 'Inscribiendo...';

        const response = await fetch('/inscripciones', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            userId: currentUser.id,
            inscripciones: inscripciones // Nuevo formato con horarioId
          })
        });

        const result = await response.json();

        if (response.ok) {
          showSuccess(`¡Inscripción exitosa! Te has inscrito en ${inscripciones.length} tutoría(s) con horarios específicos.`, {
            title: '¡Éxito!',
            confirmText: 'Continuar',
            onConfirm: () => {
              // Redirigir al dashboard del estudiante
              window.location.href = '/gestion_estudiante.html';
            }
          });
        } else {
          showError(`Error al inscribirse: ${result.error || 'Error desconocido'}`, {
            title: 'Error en la inscripción',
            confirmText: 'Intentar de nuevo'
          });
        }
      } catch (err) {
        console.error('Error al inscribirse:', err);
        showError('Error al conectar con el servidor. Intenta de nuevo.', {
          title: 'Error de conexión',
          confirmText: 'Entendido'
        });
      } finally {
        btnInscribirse.disabled = false;
        btnInscribirse.textContent = 'Inscribirse';
      }
    });
  }
});

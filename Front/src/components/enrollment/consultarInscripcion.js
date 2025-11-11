import '/src/utils/modals.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loadingEl = document.getElementById('loadingMessage');
  const errorEl = document.getElementById('errorMessage');
  const errorTextEl = document.getElementById('errorText');
  const emptyEl = document.getElementById('emptyMessage');
  const containerEl = document.getElementById('inscripcionesContainer');

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

  function showLoading() {
    loadingEl.classList.remove('d-none');
    errorEl.classList.add('d-none');
    emptyEl.classList.add('d-none');
    containerEl.classList.add('d-none');
  }

  function showError(message) {
    loadingEl.classList.add('d-none');
    errorEl.classList.remove('d-none');
    emptyEl.classList.add('d-none');
    containerEl.classList.add('d-none');
    errorTextEl.textContent = message;
  }

  function showEmpty() {
    loadingEl.classList.add('d-none');
    errorEl.classList.add('d-none');
    emptyEl.classList.remove('d-none');
    containerEl.classList.add('d-none');
  }

  function showInscripciones() {
    loadingEl.classList.add('d-none');
    errorEl.classList.add('d-none');
    emptyEl.classList.add('d-none');
    containerEl.classList.remove('d-none');
  }

  async function cancelarInscripcion(inscripcionId, card) {
    const confirmed = await showConfirm('¿Estás seguro de que deseas cancelar esta inscripción?', {
      title: 'Confirmar cancelación',
      confirmText: 'Sí, cancelar',
      cancelText: 'No, mantener',
      type: 'warning'
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/inscripciones/${inscripcionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Eliminar la tarjeta del DOM
        card.remove();
        
        // Verificar si quedan inscripciones
        if (containerEl.children.length === 0) {
          showEmpty();
        }
        
        showSuccess('Inscripción cancelada exitosamente', {
          title: 'Cancelación exitosa',
          confirmText: 'Entendido'
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        showError(`Error al cancelar: ${errorData.error || 'Error desconocido'}`, {
          title: 'Error al cancelar',
          confirmText: 'Entendido'
        });
      }
    } catch (error) {
      console.error('Error cancelando inscripción:', error);
      showError('Error de conexión al cancelar la inscripción', {
        title: 'Error de conexión',
        confirmText: 'Entendido'
      });
    }
  }

  function createInscripcionCard(inscripcion, tutoria, horarioSeleccionado) {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const fechaInscripcion = new Date(inscripcion.fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Indicar si el horario es específico de la inscripción o por defecto de la tutoría
    const esHorarioEspecifico = !!inscripcion.horarioId;
    const tipoHorario = esHorarioEspecifico ? 'Horario seleccionado' : 'Horario por defecto';

    col.innerHTML = `
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <div class="mb-3">
            <h5 class="card-title text-primary mb-2">${tutoria.titulo || 'Tutoría'}</h5>
            <p class="card-text text-muted small mb-2">${tutoria.descripcion || 'Sin descripción'}</p>
          </div>
          
          <div class="mb-3">
            <div class="row text-center">
              <div class="col-6">
                <div class="border-end">
                  <div class="fw-bold text-primary">Tutor</div>
                  <small class="text-muted">${tutoria.creadorNombre || 'No especificado'}</small>
                </div>
              </div>
              <div class="col-6">
                <div class="fw-bold text-success">Inscrito</div>
                <small class="text-muted">${fechaInscripcion}</small>
              </div>
            </div>
          </div>

          ${renderHorarioInfo(horarioSeleccionado, tipoHorario, esHorarioEspecifico)}
          
          <div class="mt-auto">
            <button class="btn btn-outline-danger btn-sm w-100 cancel-btn" data-id="${inscripcion.id}">
              <i class="bi bi-x-circle me-1"></i>Cancelar Inscripción
            </button>
          </div>
        </div>
      </div>
    `;

    // Agregar event listener al botón de cancelar
    const cancelBtn = col.querySelector('.cancel-btn');
    cancelBtn.addEventListener('click', () => cancelarInscripcion(inscripcion.id, col));

    return col;
  }

  // Render HTML para el bloque de horario (si existe)
  function renderHorarioInfo(horario, tipoHorario = 'Horario', esEspecifico = false) {
    if (!horario || !Array.isArray(horario.slots) || horario.slots.length === 0) {
      return `
        <div class="mb-3 border-top pt-3">
          <div class="fw-bold text-secondary small mb-1">Horario</div>
          <div class="small text-muted">Sin horario asignado</div>
        </div>
      `;
    }

    const slotsHtml = horario.slots.map(s => {
      const start = s.horaInicio || '';
      const end = s.horaFin || '';
      const day = s.day || s.dia || '';
      return `<div class="d-flex justify-content-between small text-muted"><span>${day}</span><span>${start} - ${end}</span></div>`;
    }).join('');

    // Indicador visual para horarios específicamente seleccionados
    const tipoIndicator = esEspecifico 
      ? '<i class="bi bi-check-circle-fill text-success me-1" title="Horario específico seleccionado"></i>'
      : '<i class="bi bi-clock text-secondary me-1" title="Horario por defecto"></i>';

    return `
      <div class="mb-3 border-top pt-3">
        <div class="fw-bold text-secondary small mb-1">
          ${tipoIndicator}${tipoHorario}
        </div>
        ${slotsHtml}
      </div>
    `;
  }

  // Verificar autenticación
  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = '/logIn.html';
    return;
  }

  showLoading();

  try {
    // Cargar inscripciones del usuario
    const inscripcionesRes = await fetch('/inscripciones/me', { 
      credentials: 'include' 
    });

    if (!inscripcionesRes.ok) {
      if (inscripcionesRes.status === 401) {
        window.location.href = '/logIn.html';
        return;
      }
      throw new Error(`Error ${inscripcionesRes.status}: No se pudieron cargar las inscripciones`);
    }

    const inscripciones = await inscripcionesRes.json();
    
    if (!Array.isArray(inscripciones) || inscripciones.length === 0) {
      showEmpty();
      return;
    }

    // Cargar todas las tutorías para obtener detalles
    const tutoriasRes = await fetch('/tutorias', { credentials: 'include' });
    const tutorias = tutoriasRes.ok ? await tutoriasRes.json() : [];
    
    // Crear un mapa de tutorías por ID
    const tutoriasMap = new Map();
    tutorias.forEach(t => tutoriasMap.set(t.id, t));

    // Enriquecer cada inscripción con su horario específico seleccionado
    // Recolectar ids de horario que necesitamos consultar (tanto de inscripciones como de tutorías)
    const horarioIds = new Set();
    
    for (const ins of inscripciones) {
      // Priorizar el horario específico de la inscripción si existe
      if (ins.horarioId) {
        horarioIds.add(ins.horarioId);
      } else {
        // Fallback: usar el horario por defecto de la tutoría
        const t = tutoriasMap.get(ins.tutoriaId);
        if (t && t.horarioId) horarioIds.add(t.horarioId);
      }
    }

    // Crear mapa de horarios
    const horariosMap = new Map();
    
    if (horarioIds.size > 0) {
      await Promise.all(Array.from(horarioIds).map(async (hid) => {
        try {
          const r = await fetch(`/horarios/${encodeURIComponent(hid)}`, { credentials: 'include' });
          
          if (r.ok) {
            const horario = await r.json();
            horariosMap.set(hid, horario);
          }
        } catch (e) {
          // no bloquear todo por un horario faltante
          console.warn('No se pudo cargar horario', hid, e);
        }
      }));
    }

    // Renderizar inscripciones
    containerEl.innerHTML = '';
    
    for (const inscripcion of inscripciones) {
      const tutoria = tutoriasMap.get(inscripcion.tutoriaId);
      if (tutoria) {
        // Determinar qué horario usar: el específico de la inscripción o el por defecto de la tutoría
        const horarioId = inscripcion.horarioId || tutoria.horarioId;
        const horarioSeleccionado = horarioId ? horariosMap.get(horarioId) : null;
        
        const card = createInscripcionCard(inscripcion, tutoria, horarioSeleccionado);
        containerEl.appendChild(card);
      }
    }

    if (containerEl.children.length === 0) {
      showEmpty();
    } else {
      showInscripciones();
    }

  } catch (error) {
    console.error('Error cargando inscripciones:', error);
    showError(error.message || 'Error de conexión con el servidor');
  }
});

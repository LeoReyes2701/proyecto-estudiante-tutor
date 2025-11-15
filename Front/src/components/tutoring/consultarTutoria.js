document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('tutoriasContainer');
  const emptyMessage = document.getElementById('emptyMessage');



  const getUsuarioId = () => {
    try {
      const raw = localStorage.getItem('usuario');
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj.id || obj.userId || obj._id || null;
    } catch {
      return null;
    }
  };

  async function fetchTutoriasAndSchedules() {
    try {
      const usuarioId = getUsuarioId();

      const [tRes, sRes] = await Promise.all([
        fetch('/tutorias', { credentials: 'include', headers: { 'Accept': 'application/json' } }),
        fetch('/horarios', { credentials: 'include', headers: { 'Accept': 'application/json' } })
      ]);

      if (!tRes.ok) return showEmpty('Error al cargar tutorías');

      let schedules = [];
      if (sRes && sRes.ok) {
        try { schedules = await sRes.json(); } catch (e) { schedules = []; }
      }

      const allTutorias = await tRes.json();

      // Si no hay usuario (no sesión), mostramos vacío
      if (!usuarioId) {
        return showEmpty('No hay sesión activa');
      }

      // Filtrar tutorías creadas por el tutor
      const tutoriasCreadas = (Array.isArray(allTutorias) ? allTutorias : []).filter(t => {
        const cid = t.creadorId || t.creador || t.userId;
        return String(cid) === String(usuarioId);
      });

      renderTutorias(tutoriasCreadas, schedules);
    } catch (error) {
      showEmpty('No se pudo conectar con el servidor');
    }
  }

  function showEmpty(message) {
    if (container) container.innerHTML = '';
    if (emptyMessage) {
      emptyMessage.classList.remove('d-none');
      emptyMessage.textContent = message || 'No hay tutorías registradas aún.';
    }
  }

  function hideEmpty() {
    if (emptyMessage) emptyMessage.classList.add('d-none');
  }

  function formatCupo(t) {
    const n = Number(t);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }

  function buildSchedulesMap(schedules) {
    const map = new Map();
    (schedules || []).forEach(s => {
      const id = s.id || s._id || s.horarioId || s.idHorario;
      if (id) map.set(String(id), s);
    });
    return map;
  }

  function extractHorarioData(horario) {
    if (!horario || typeof horario !== 'object') return null;

    const day = horario.day || horario.dia || '';
    const start = horario.start || horario.horaInicio || horario.inicio || horario.startTime || horario.start_at || '';
    const end = horario.end || horario.horaFin || horario.fin || horario.endTime || horario.end_at || '';

    if (day || start || end) return { day, start, end };

    if (Array.isArray(horario.slots) && horario.slots.length > 0) {
      const s0 = horario.slots[0];
      return {
        day: s0.day || s0.dia || '',
        start: s0.start || s0.horaInicio || '',
        end: s0.end || s0.horaFin || ''
      };
    }

    return null;
  }

  function timeDisplay(hhmm) {
    if (!hhmm) return '';
    const [hh, mm] = String(hhmm).split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return hhmm;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = ((hh + 11) % 12) + 1;
    return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
  }

  function renderTutorias(tutorias, schedules) {
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(tutorias) || tutorias.length === 0) {
      // mostrar mensaje vacío
      if (emptyMessage) emptyMessage.classList.remove('d-none');
      return;
    }

    hideEmpty();
    const schedulesMap = buildSchedulesMap(schedules);

    tutorias.forEach((tutoria, idx) => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6';

      const card = document.createElement('div');
      card.className = 'card shadow-sm h-100';

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body d-flex flex-column';

      const title = document.createElement('h5');
      title.className = 'card-title mb-2';
      title.textContent = tutoria.titulo || tutoria.nombre || `Tutoria ${idx + 1}`;

      const desc = document.createElement('p');
      desc.className = 'card-text text-muted mb-3';
      desc.textContent = tutoria.descripcion || '';

      const cupos = document.createElement('p');
      cupos.className = 'mb-2';
      const displayCupo = formatCupo(tutoria.cupo ?? tutoria.cupos);
      const inscritos = Array.isArray(tutoria.estudiantesInscritos) ? tutoria.estudiantesInscritos.length : 0;
      cupos.innerHTML = `<strong>Cupos:</strong> ${inscritos} / ${displayCupo}`;

      // Botones de acción para modificar y eliminar
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'd-flex gap-2 mt-3';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-primary btn-sm';
      editBtn.textContent = 'Modificar';
      editBtn.addEventListener('click', () => redirectToCreateTutoria(tutoria));

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-danger btn-sm';
      deleteBtn.textContent = 'Eliminar';
      deleteBtn.addEventListener('click', () => confirmDelete(tutoria));

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);

      const horariosList = document.createElement('ul');
      horariosList.className = 'list-unstyled mb-0';

      if (tutoria.horarioId) {
        const horario = schedulesMap.get(String(tutoria.horarioId));
        if (horario && Array.isArray(horario.slots)) {
          const byDay = {};
          horario.slots.forEach(s => {
            const day = s.day || s.dia || 'Sin día';
            if (!byDay[day]) byDay[day] = [];
            byDay[day].push(s);
          });
          Object.keys(byDay).forEach(day => {
            const ranges = byDay[day].map(s => `${timeDisplay(s.horaInicio || s.start || '')} - ${timeDisplay(s.horaFin || s.end || '')}`).join(', ');
            const row = document.createElement('li');
            row.className = 'value';
            row.textContent = `${day}: ${ranges}`;
            horariosList.appendChild(row);
          });
        } else {
          const data = extractHorarioData(horario);
          const li = document.createElement('li');
          if (data) {
            li.textContent = `Horario: ${data.day || '—'} • ${data.start || '—'} — ${data.end || '—'}`;
          } else {
            li.textContent = `Horario Id: ${tutoria.horarioId}`;
          }
          horariosList.appendChild(li);
        }
      } else if (Array.isArray(tutoria.horarios)) {
        tutoria.horarios.forEach(h => {
          const data = extractHorarioData(h);
          const li = document.createElement('li');
          if (data) {
            li.textContent = `${data.day || '—'} • ${data.start || '—'} — ${data.end || '—'}`;
          } else {
            li.textContent = JSON.stringify(h);
          }
          horariosList.appendChild(li);
        });
      } else {
        const li = document.createElement('li');
        li.textContent = 'No hay horarios registrados';
        horariosList.appendChild(li);
      }

      if (tutoria.createdAt) {
        const created = document.createElement('p');
        created.className = 'text-muted small mt-3 mb-0';
        const d = new Date(tutoria.createdAt);
        created.textContent = `Creada: ${isNaN(d.getTime()) ? tutoria.createdAt : d.toLocaleDateString()}`;
        cardBody.appendChild(created);
      }

      cardBody.appendChild(title);
      cardBody.appendChild(desc);
      cardBody.appendChild(cupos);
      cardBody.appendChild(actionsDiv);
      cardBody.appendChild(horariosList);
      card.appendChild(cardBody);
      col.appendChild(card);
      container.appendChild(col);
    });
  }

  // Función para redirigir a crear tutoría con datos de edición
  function redirectToCreateTutoria(tutoria) {
    // Guardar datos de la tutoría en localStorage para edición
    localStorage.setItem('editTutoria', JSON.stringify(tutoria));
    // Redirigir a la página de crear tutoría
    window.location.href = 'crearTutoria.html';
  }

  // Función para confirmar eliminación
  function confirmDelete(tutoria) {
    if (confirm(`¿Estás seguro de que quieres eliminar la tutoría "${tutoria.titulo}"? Esta acción no se puede deshacer.`)) {
      deleteTutoria(tutoria.id);
    }
  }

  // Función para eliminar tutoría
  async function deleteTutoria(id) {
    try {
      const response = await fetch(`/tutorias/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        alert('Tutoría eliminada exitosamente');
        fetchTutoriasAndSchedules(); // Recargar lista
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error('Error deleting tutoria:', err);
      alert('Error al eliminar la tutoría');
    }
  }

  fetchTutoriasAndSchedules();
});

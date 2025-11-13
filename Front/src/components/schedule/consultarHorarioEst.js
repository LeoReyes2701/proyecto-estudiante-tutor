document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('horariosContainer');
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

  async function fetchHorariosFromTutorias() {
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

      // Filtrar tutorías donde el estudiante está inscrito
      const tutoriasInscritas = (Array.isArray(allTutorias) ? allTutorias : []).filter(t => {
        if (!Array.isArray(t.estudiantesInscritos)) return false;
        return t.estudiantesInscritos.some(e => {
          const id = typeof e === 'string' ? e : e.id || e.userId || e._id;
          return String(id) === String(usuarioId);
        });
      });

      // Extraer horarios únicos de las tutorías inscritas
      const horarioIds = new Set();
      tutoriasInscritas.forEach(t => {
        if (t.horarioId) horarioIds.add(String(t.horarioId));
      });

      const mySchedules = schedules.filter(s => horarioIds.has(String(s.id || s._id || s.horarioId)));

      renderHorarios(mySchedules);
    } catch (error) {
      showEmpty('No se pudo conectar con el servidor');
    }
  }

  function showEmpty(message) {
    if (container) container.innerHTML = '';
    if (emptyMessage) {
      emptyMessage.classList.remove('d-none');
      emptyMessage.textContent = message || 'No hay horarios registrados aún.';
    }
  }

  function hideEmpty() {
    if (emptyMessage) emptyMessage.classList.add('d-none');
  }

  function timeDisplay(hhmm) {
    if (!hhmm) return '';
    const [hh, mm] = String(hhmm).split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return hhmm;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = ((hh + 11) % 12) + 1;
    return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
  }

  function renderHorarios(schedules) {
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(schedules) || schedules.length === 0) {
      if (emptyMessage) emptyMessage.classList.remove('d-none');
      return;
    }

    hideEmpty();

    // Agrupar slots por día
    const byDay = {};
    schedules.forEach(s => {
      if (Array.isArray(s.slots)) {
        s.slots.forEach(slot => {
          const day = slot.day || slot.dia || 'Sin día';
          if (!byDay[day]) byDay[day] = [];
          byDay[day].push({
            start: slot.horaInicio || slot.start || '',
            end: slot.horaFin || slot.end || '',
            tutoriaId: s.tutoriaId || s.id || null
          });
        });
      }
    });

    // Renderizar por día
    Object.keys(byDay).sort().forEach(day => {
      const slots = byDay[day];

      const col = document.createElement('div');
      col.className = 'col-12 col-md-6';

      const card = document.createElement('div');
      card.className = 'card shadow-sm h-100';

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body d-flex flex-column';

      const title = document.createElement('h5');
      title.className = 'card-title mb-3';
      title.textContent = day;

      const list = document.createElement('ul');
      list.className = 'list-unstyled';

      slots.forEach(slot => {
        const li = document.createElement('li');
        li.className = 'mb-2';
        li.textContent = `${timeDisplay(slot.start)} - ${timeDisplay(slot.end)}`;
        list.appendChild(li);
      });

      cardBody.appendChild(title);
      cardBody.appendChild(list);
      card.appendChild(cardBody);
      col.appendChild(card);
      container.appendChild(col);
    });
  }

  fetchHorariosFromTutorias();

  // Ajustar el botón Volver según el rol del usuario
  const btnVolver = document.getElementById('btnVolverRole');
  if (btnVolver) {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      if (usuario && usuario.rol === 'estudiante') {
        btnVolver.href = 'gestion_estudiante.html';
      } else if (usuario && usuario.rol === 'tutor') {
        btnVolver.href = 'gestion.html';
      } else {
        btnVolver.href = 'login.html';
      }
    } catch {
      btnVolver.href = 'login.html';
    }
  }
});

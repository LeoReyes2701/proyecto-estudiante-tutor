document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('tutoriasContainer');
  const emptyMessage = document.getElementById('emptyMessage');

  async function fetchTutoriasAndSchedules() {
    try {
      const [tRes, sRes] = await Promise.all([
        fetch('/tutorias?mine=1', { credentials: 'include', headers: { 'Accept': 'application/json' } }),
        fetch('/horarios', { credentials: 'include', headers: { 'Accept': 'application/json' } })
      ]);

      if (!tRes.ok) return showEmpty('Error al cargar tutorías');

      let schedules = [];
      if (sRes && sRes.ok) {
        try { schedules = await sRes.json(); } catch (e) {}
      }

      const tutorias = await tRes.json();
      renderTutorias(tutorias, schedules);
    } catch (error) {
      showEmpty('No se pudo conectar con el servidor');
    }
  }

  function showEmpty(message) {
    container.innerHTML = '';
    emptyMessage.classList.remove('d-none');
    emptyMessage.textContent = message || 'No hay tutorías registradas aún.';
  }

  function formatCupo(t) {
    const n = Number(t);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }

  function buildSchedulesMap(schedules) {
    const map = new Map();
    schedules.forEach(s => {
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

  function renderTutorias(tutorias, schedules) {
    container.innerHTML = '';
    if (!Array.isArray(tutorias) || tutorias.length === 0) return emptyMessage.classList.remove('d-none');

    emptyMessage.classList.add('d-none');
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
      cupos.innerHTML = `<strong>Cupos:</strong> ${displayCupo}`;

      const horariosList = document.createElement('ul');
      horariosList.className = 'list-unstyled mb-0';

      if (tutoria.horarioId) {
        const horario = schedulesMap.get(String(tutoria.horarioId));
        const data = extractHorarioData(horario);
        const li = document.createElement('li');
        if (data) {
          li.textContent = `Horario: ${data.day || '—'} • ${data.start || '—'} — ${data.end || '—'}`;
        } else {
          li.textContent = `Horario Id: ${tutoria.horarioId}`;
        }
        horariosList.appendChild(li);
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
        created.textContent = `Creada: ${isNaN(d.getTime()) ? tutoria.createdAt : d.toLocaleString()}`;
        cardBody.appendChild(created);
      }

      cardBody.appendChild(title);
      cardBody.appendChild(desc);
      cardBody.appendChild(cupos);
      cardBody.appendChild(horariosList);
      card.appendChild(cardBody);
      col.appendChild(card);
      container.appendChild(col);
    });
  }

  fetchTutoriasAndSchedules();
});

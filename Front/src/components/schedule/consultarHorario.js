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

  function buildCard(tutorId, day, slots) {
    const card = document.createElement('div');
    card.className = 'card shadow-sm schedule-card';

    const h5 = document.createElement('h5');
    h5.className = 'day-title fw-bold mb-3 d-flex justify-content-between align-items-center';

    const left = document.createElement('div');
    left.className = 'd-flex align-items-center';
    const spanDay = document.createElement('span');
    spanDay.textContent = day;
    left.appendChild(spanDay);

    const right = document.createElement('div');
    right.className = 'day-hours';
    right.innerHTML = slots
      .map(s => `${timeDisplay(s.horaInicio || s.start)} - ${timeDisplay(s.horaFin || s.end)}`)
      .join('<br>');

    h5.appendChild(left);
    h5.appendChild(right);

    card.appendChild(h5);

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
    wrapper.innerHTML = ''; // remove sample content

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

    const usuarioId = usuario.id || usuario.userId || null;
    if (!usuarioId) {
      showMessage('Identificador de usuario no encontrado en sesión.', 'error');
      return;
    }

    showMessage('Cargando horarios...', 'info');

    try {
      // Load tutorias and horarios in parallel
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

      // Filtrar tutorías donde el usuario esté inscrito
      const inscritas = (allTutorias || []).filter(t => {
        if (!Array.isArray(t.estudiantesInscritos)) return false;
        return t.estudiantesInscritos.some(e => {
          const id = typeof e === 'string' ? e : e.id;
          return String(id) === String(usuarioId);
        });
      });

      if (!inscritas.length) {
        showMessage('No estás inscrito en ninguna tutoría.', 'info');
        return;
      }

      // Obtener set de horarioIds relevantes desde tutorias inscritas
      const horarioIds = new Set(inscritas.map(t => String(t.horarioId)).filter(Boolean));

      // Filtrar schedules que tengan id en horarioIds
      const mineSchedules = (allHorarios || []).filter(s => horarioIds.has(String(s.id || s._id || s._id)));

      if (!mineSchedules.length) {
        showMessage('No se encontraron horarios asociados a tus inscripciones.', 'info');
        return;
      }

      clearMessage();

      // Aplanar slots de los schedules encontrados y adjuntar info útil
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

      // Orden días con preferencia Lunes..Domingo
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
        const card = buildCard(usuarioId, day, byDay[day]);
        wrapper.appendChild(card);
      });
    } catch (err) {
      log('network error', err);
      showMessage('Error de red al cargar horarios.', 'error');
    }
  }

  loadAndRender();
});

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
    // join multiple slots for the day with commas / line breaks
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
    // optional: sort slots by start time inside each day
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

    if (!usuario || String((usuario.rol || '')).toLowerCase() !== 'tutor') {
      showMessage('Debes iniciar sesión como tutor para ver tus horarios.', 'error');
      return;
    }

    const tutorId = usuario.id || usuario.userId || usuario.tutorId;
    if (!tutorId) {
      showMessage('Identificador de tutor no encontrado en sesión.', 'error');
      return;
    }

    showMessage('Cargando horarios...', 'info');

    try {
      const res = await fetch('/horarios');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showMessage(body.error || `Error ${res.status} al cargar horarios`, 'error');
        return;
      }
      const all = await res.json();

      // Filtrar schedules del mismo tutor (compatibilidad con userId)
      const mine = (all || []).filter(s => String(s.tutorId || s.userId) === String(tutorId));
      if (!mine.length) {
        showMessage('No tienes horarios registrados aún.', 'info');
        return;
      }

      clearMessage();

      // Aplanar slots de todos los schedules del tutor y agrupar por día
      const allSlots = [];
      mine.forEach(sch => {
        (sch.slots || []).forEach(slot => {
          allSlots.push(Object.assign({}, slot, { scheduleId: sch.id || null }));
        });
      });

      const byDay = groupSlotsByDay(allSlots);

      // Crear cards ordenadas por día (lunes..domingo preferencia) else alphabetical
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
        const card = buildCard(tutorId, day, byDay[day]);
        wrapper.appendChild(card);
      });
    } catch (err) {
      log('network error', err);
      showMessage('Error de red al cargar horarios.', 'error');
    }
  }

  loadAndRender();
});
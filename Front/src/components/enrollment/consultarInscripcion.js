document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('inscripcionGrid');
  const msg = document.getElementById('inscripcionMsg');

  /* Añadir botón "Volver" arriba a la derecha (si no existe en el HTML) */
  (function ensureTopRightBackButton() {
    try {
      const headerBar = document.querySelector('.bg-ucab-blue');
      if (!headerBar) return;
      // evita duplicados
      if (headerBar.querySelector('#btnVolverTop')) return;

      const btn = document.createElement('button');
      btn.id = 'btnVolverTop';
      btn.className = 'btn-volver';
      btn.type = 'button';
      btn.style.position = 'absolute';
      btn.style.top = '12px';
      btn.style.right = '16px';
      btn.textContent = 'Volver';
      btn.addEventListener('click', () => { window.location.href = 'gestion_estudiante.html'; });

      // posición relativa del header para que el absolute funcione
      headerBar.style.position = 'relative';
      headerBar.appendChild(btn);
    } catch (e) {
      console.warn('No se pudo insertar botón Volver:', e);
    }
  })();

  const showMessage = (text, type = 'info', timeout = 3000) => {
    if (!msg) return;
    msg.textContent = text;
    msg.className = type === 'error' ? 'text-danger fw-bold' : 'text-success fw-bold';
    if (timeout > 0) setTimeout(() => { msg.textContent = ''; msg.className = ''; }, timeout);
  };

  const getUsuarioId = () => {
    try {
      const raw = localStorage.getItem('usuario');
      console.log('[debug] localStorage.usuario raw:', raw);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      console.log('[debug] localStorage.usuario parsed:', obj);
      return obj.id || obj.userId || null;
    } catch (err) {
      console.error('[debug] error parsing localStorage.usuario', err);
      return null;
    }
  };

  const timeDisplay = (hhmm) => {
    if (!hhmm) return '';
    const [hh, mm] = hhmm.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return hhmm;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = ((hh + 11) % 12) + 1;
    return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
  };

  const groupSlotsByDay = (slots = []) => {
    const map = {};
    slots.forEach(s => {
      const day = (s.day || 'Sin día').trim();
      if (!map[day]) map[day] = [];
      map[day].push(s);
    });
    return map;
  };

  const buildScheduleMap = (schedules = []) => {
    const map = new Map();
    schedules.forEach(s => {
      const id = String(s.id || s._id || '');
      if (id) map.set(id, s);
    });
    return map;
  };

  const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, (m) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]);
  };

  const tutoriaIdFrom = (t) => {
    return t.id || t._id || (t && typeof t === 'object' && t.hasOwnProperty('titulo') ? btoa(t.titulo).slice(0,12) : '');
  };
const renderInscripciones = (tutorias = [], schedules = [], usuarioId = '') => {
  console.log('[debug] renderInscripciones called', { tutoriasCount: (tutorias || []).length, schedulesCount: (schedules || []).length, usuarioId });
  if (!grid) return;
  grid.innerHTML = '';
  const scheduleMap = buildScheduleMap(schedules);

  const inscritas = (tutorias || []).filter(t =>
    Array.isArray(t.estudiantesInscritos) &&
    t.estudiantesInscritos.some(e => (typeof e === 'string' ? e : e.id) === usuarioId)
  );

  console.log('[debug] inscritas count:', inscritas.length);

  if (!inscritas.length) {
    showMessage('No estás inscrito en ninguna tutoría.', 'error', 0);
    return;
  }

  inscritas.forEach(tutoria => {
    const inscripcionObj = Array.isArray(tutoria.estudiantesInscritos)
      ? tutoria.estudiantesInscritos.find(e => (typeof e === 'string' ? e : e.id) === usuarioId)
      : null;
    const fechaIns = inscripcionObj?.fecha || 'Fecha no disponible';

    const horario = scheduleMap.get(String(tutoria.horarioId));
    const slots = Array.isArray(horario?.slots) ? horario.slots : [];
    const byDay = groupSlotsByDay(slots);

    const card = document.createElement('div');
    card.className = 'card shadow-sm details-card mb-4';

    const header = document.createElement('div');
    header.className = 'd-flex justify-content-end mb-4';
    header.innerHTML = `
      <div class="status-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-check-circle-fill me-1" viewBox="0 0 16 16">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.92 11.5a.75.75 0 0 0 1.08-.022l4.331-4.332a.75.75 0 0 0-.022-1.08z"/>
        </svg>
        Activa
      </div>
    `;
    card.appendChild(header);

    const info = document.createElement('div');
    info.className = 'mb-4 pb-4 border-bottom';
    info.innerHTML = `
      <h5 class="section-title">Información de la Tutoría</h5>
      <div class="data-pair"><span class="label">Nombre de la Tutoría</span><span class="value fs-5 fw-bold">${escapeHtml(tutoria.titulo || '')}</span></div>
      <div class="data-pair"><span class="label">Descripción</span><span class="value">${escapeHtml(tutoria.descripcion || '')}</span></div>
      <div class="tutor-info-row">
        <div class="tutor-info-col">
          <div class="data-pair"><span class="label">Tutor</span><span class="value">${escapeHtml(tutoria.creadorNombre || '')}</span></div>
        </div>
      </div>
    `;
    card.appendChild(info);

    const horarioBlock = document.createElement('div');
    horarioBlock.className = 'mb-4 pb-4 border-bottom';
    horarioBlock.innerHTML = `<h5 class="section-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-clock me-1" viewBox="0 0 16 16">
        <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0"/>
      </svg>
      Horario
    </h5>`;
    const horarioList = document.createElement('div');
    horarioList.className = 'data-pair';
    if (slots.length > 0) {
      Object.keys(byDay).forEach(day => {
        const ranges = byDay[day].map(s => `${timeDisplay(s.horaInicio)} - ${timeDisplay(s.horaFin)}`).join(', ');
        const line = document.createElement('div');
        line.className = 'value';
        line.textContent = `${day}: ${ranges}`;
        horarioList.appendChild(line);
      });
    } else {
      const line = document.createElement('div');
      line.className = 'value';
      line.textContent = 'No hay horario registrado';
      horarioList.appendChild(line);
    }
    horarioBlock.appendChild(horarioList);
    card.appendChild(horarioBlock);

    const insBlock = document.createElement('div');
    insBlock.className = 'mb-4';
    insBlock.innerHTML = `<h5 class="section-title">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-calendar-check me-1" viewBox="0 0 16 16">
        <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
        <path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2m-1 3H3V1h10zM1 14V5h14v9a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1"/>
      </svg>
      Detalles de Inscripción
    </h5>`;
    const fechaPair = document.createElement('div');
    fechaPair.className = 'data-pair';
    const fechaLabel = document.createElement('span');
    fechaLabel.className = 'label';
    fechaLabel.textContent = 'Fecha de Inscripción';
    const fechaValue = document.createElement('span');
    fechaValue.className = 'value';
    fechaValue.textContent = fechaIns;
    fechaPair.appendChild(fechaLabel);
    fechaPair.appendChild(fechaValue);
    insBlock.appendChild(fechaPair);
    card.appendChild(insBlock);

    grid.appendChild(card);
  });
};


  // Depurado: fetch tolerante, logs claros
  const loadInscripciones = async () => {
    try {
      const usuarioId = getUsuarioId();
      console.log('[debug] loadInscripciones start, usuarioId=', usuarioId);
      if (!usuarioId) {
        showMessage('No hay sesión activa. Inicia sesión.', 'error', 0);
        return;
      }

      console.log('[debug] iniciando peticiones a /tutorias, /horarios, /usuarios');

      const fetchJson = async (url) => {
        try {
          const res = await fetch(url, { credentials: 'include' });
          console.log('[debug] fetch', url, 'status', res.status);
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            return { ok: res.ok, status: res.status, json };
          } catch (parseErr) {
            console.warn('[debug] parse error for', url, 'body:', text);
            return { ok: res.ok, status: res.status, json: null, raw: text };
          }
        } catch (err) {
          return { ok: false, err };
        }
      };

      const [tRes, sRes, uRes] = await Promise.all([
        fetchJson('/tutorias'),
        fetchJson('/horarios'),
        fetchJson('/usuarios')
      ]);

      if (!tRes.ok) {
        console.error('[debug] /tutorias failed', tRes.err ?? { status: tRes.status, body: tRes.raw });
        showMessage('Error cargando tutorías.', 'error', 0);
        return;
      }
      if (!sRes.ok) {
        console.error('[debug] /horarios failed', sRes.err ?? { status: sRes.status, body: sRes.raw });
        showMessage('Error cargando horarios.', 'error', 0);
        return;
      }

      const tutorias = Array.isArray(tRes.json) ? tRes.json : [];
      const schedules = Array.isArray(sRes.json) ? sRes.json : [];

      if (!uRes.ok) {
        console.warn('[debug] /usuarios failed, continuamos sin emails', uRes.err ?? { status: uRes.status, body: uRes.raw });
        renderInscripciones(tutorias, schedules, usuarioId);
        return;
      }

      const users = Array.isArray(uRes.json) ? uRes.json : [];
      console.log('[debug] datos cargados', { tutorias: tutorias.length, schedules: schedules.length, users: users.length });
      // Si tu renderInscripciones acepta users como tercer argumento, pásalo; aquí lo mantiene sin users por compatibilidad
      // Si quieres que renderInscripciones use users para resolver emails, modifica la firma y la llamada.
      renderInscripciones(tutorias, schedules, users, usuarioId);
    } catch (err) {
      console.error('[debug] loadInscripciones unexpected error', err);
      showMessage('No se pudieron cargar tus inscripciones.', 'error', 0);
    }
  };

  loadInscripciones();
});

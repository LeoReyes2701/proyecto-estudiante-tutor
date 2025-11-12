document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('cursoGrid');
  const btn = document.getElementById('btnInscribirse');
  const msg = document.getElementById('inscripcionMsg');

  document.getElementById('btnVolver')?.addEventListener('click', () => {
    window.location.href = 'gestion_estudiante.html';
  });

  const showMessage = (text, type = 'info') => {
    if (!msg) return;
    msg.textContent = text || '';
    msg.className = '';
    if (type === 'error') msg.classList.add('text-danger', 'fw-bold');
    else msg.classList.add('text-success', 'fw-bold');
  };

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

  const inscribir = async (tutoriaId, estudianteId) => {
    const res = await fetch('/inscripcion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tutoriaId, estudianteId }),
      credentials: 'include'
    });
    const text = await res.text().catch(() => '');
    try { return JSON.parse(text); } catch { return { ok: res.ok, raw: text }; }
  };

  const timeDisplay = (hhmm) => {
    if (!hhmm) return '';
    const parts = String(hhmm).split(':');
    if (parts.length < 2) return hhmm;
    const hh = Number(parts[0]);
    const mm = Number(parts[1]);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return hhmm;
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const h12 = ((hh + 11) % 12) + 1;
    return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
  };

  const groupSlotsByDay = (slots = []) => {
    const map = {};
    (slots || []).forEach(s => {
      const day = (s.day || s.dia || 'Sin día').trim();
      if (!map[day]) map[day] = [];
      map[day].push(s);
    });
    return map;
  };

  const buildScheduleMap = (schedules = []) => {
    const map = new Map();
    (schedules || []).forEach(s => {
      const id = String(s.id || s._id || s.horarioId || '');
      if (id) map.set(id, s);
    });
    return map;
  };

  const buildUserMap = (users = []) => {
    const map = new Map();
    (users || []).forEach(u => {
      const id = String(u.id || u._id || u.userId || '');
      if (id) map.set(id, u);
    });
    return map;
  };

  const getTutoriaId = (t) => {
    return String(t?.id ?? t?._id ?? t?.tutoriaId ?? '');
  };

  const countInscritos = (t) => {
    if (!Array.isArray(t?.estudiantesInscritos)) return 0;
    return t.estudiantesInscritos.length;
  };

  const renderCursos = (tutorias = [], schedules = [], users = [], usuarioId = '') => {
    if (!grid) return;
    grid.innerHTML = '';

    const scheduleMap = buildScheduleMap(schedules);
    const userMap = buildUserMap(users);

    const disponibles = (tutorias || []).filter(t => {
      const inscritos = Array.isArray(t.estudiantesInscritos)
        ? t.estudiantesInscritos.map(e => (typeof e === 'string' ? e : (e && (e.id || e.userId || e._id))).toString())
        : [];
      return !inscritos.includes(String(usuarioId));
    });

    if (!disponibles.length) {
      showMessage('No hay tutorías disponibles para inscribirte.', 'error');
      return;
    }

    disponibles.forEach(tutoria => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6 col-lg-4';

      const card = document.createElement('div');
      card.className = 'card p-3 border rounded-3 shadow-sm h-100 d-flex flex-column';

      const h3 = document.createElement('h3');
      h3.className = 'fw-medium fs-5 mb-1 text-center';
      h3.textContent = tutoria.titulo ?? tutoria.nombre ?? '';

      const pTutor = document.createElement('p');
      pTutor.className = 'text-muted mt-1 mb-1 text-center';
      pTutor.style.fontSize = '0.9rem';
      pTutor.textContent = `Tutor: ${tutoria.creadorNombre ?? tutoria.creador ?? 'Desconocido'}`;

      const inscritosCount = countInscritos(tutoria);
      const capacity = Number.isFinite(Number(tutoria.cupo)) ? Number(tutoria.cupo) : (tutoria.cupos ?? '');
      const pCupo = document.createElement('p');
      pCupo.className = 'text-muted mb-2 text-center';
      pCupo.style.fontSize = '0.9rem';
      pCupo.textContent = `Cupo: ${inscritosCount} / ${capacity}`;

      const horarioDiv = document.createElement('div');
      horarioDiv.className = 'text-muted small mb-2';
      horarioDiv.innerHTML = '<strong>Horario:</strong><br>';

      const horario = scheduleMap.get(String(tutoria.horarioId ?? tutoria.horario ?? ''));
      const slots = Array.isArray(horario?.slots) ? horario.slots : (Array.isArray(tutoria.horarios) ? tutoria.horarios : []);
      const byDay = groupSlotsByDay(slots);

      if ((slots || []).length > 0) {
        Object.keys(byDay).forEach(day => {
          const line = document.createElement('div');
          const ranges = byDay[day]
            .map(s => `${timeDisplay(s.horaInicio ?? s.start ?? s.inicio ?? '')} - ${timeDisplay(s.horaFin ?? s.end ?? s.fin ?? '')}`)
            .join(', ');
          line.textContent = `${day}: ${ranges}`;
          horarioDiv.appendChild(line);
        });
      } else {
        const line = document.createElement('div');
        line.textContent = 'No hay horario registrado';
        horarioDiv.appendChild(line);
      }

      const checkDiv = document.createElement('div');
      checkDiv.className = 'form-check mt-3 d-flex justify-content-center';

      const tid = getTutoriaId(tutoria) || `tmp-${Math.random().toString(36).slice(2,8)}`;
      const input = document.createElement('input');
      input.className = 'form-check-input';
      input.type = 'checkbox';
      input.id = `check-${tid}`;
      input.dataset.tutoriaId = tid;

      const label = document.createElement('label');
      label.className = 'form-check-label ms-2';
      label.htmlFor = input.id;
      label.textContent = 'Seleccionar';

      checkDiv.appendChild(input);
      checkDiv.appendChild(label);

      card.appendChild(h3);
      card.appendChild(pTutor);
      card.appendChild(pCupo);
      card.appendChild(horarioDiv);
      card.appendChild(checkDiv);

      col.appendChild(card);
      grid.appendChild(col);
    });
  };

  const loadTutorias = async () => {
    try {
      const usuarioId = getUsuarioId();
      if (!usuarioId) {
        showMessage('No hay sesión activa. Inicia sesión.', 'error');
        return;
      }

      const [tRes, sRes, uRes] = await Promise.all([
        fetch('/tutorias', { credentials: 'include' }),
        fetch('/horarios', { credentials: 'include' }),
        fetch('/usuarios', { credentials: 'include' })
      ]);

      const tutorias = tRes.ok ? await safeJson(tRes) : [];
      const schedules = sRes.ok ? await safeJson(sRes) : [];
      const users = uRes && uRes.ok ? await safeJson(uRes) : [];

      renderCursos(tutorias, schedules, users, usuarioId);
    } catch (err) {
      console.error('[loadTutorias]', err);
      showMessage('No se pudieron cargar las tutorías.', 'error');
    }
  };

  async function safeJson(response) {
    const text = await response.text().catch(() => '');
    try { return JSON.parse(text); } catch { return []; }
  }

  if (btn) {
    btn.addEventListener('click', async () => {
      showMessage('');
      const estudianteId = getUsuarioId();
            if (!estudianteId) {
        showMessage('No hay sesión activa. Inicia sesión como estudiante.', 'error');
        return;
      }

      const seleccionados = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
      if (!seleccionados.length) {
        showMessage('Selecciona al menos un curso para inscribirte.', 'error');
        return;
      }

      let successCount = 0;
      for (const input of seleccionados) {
        const tutoriaId = input.dataset.tutoriaId;
        try {
          const result = await inscribir(tutoriaId, estudianteId);
          if (result && (result.error || result.ok === false)) {
            console.warn(`[inscribir ${tutoriaId}]`, result);
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`[inscribir ${tutoriaId}]`, err);
        }
      }

      if (successCount > 0) {
        showMessage(`Inscripción completada en ${successCount} curso(s).`);
        setTimeout(() => {
          window.location.href = 'gestion_estudiante.html';
        }, 1200);
      } else {
        showMessage('No se pudo completar la inscripción.', 'error');
      }
    });
  } else {
    console.warn('Botón btnInscribirse no encontrado en el DOM.');
  }

  loadTutorias();
});
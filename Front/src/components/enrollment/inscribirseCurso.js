document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('cursoGrid');
  const btn = document.getElementById('btnInscribirse');
  const msg = document.getElementById('inscripcionMsg');

  // Botón volver (ya está en el HTML)
  document.getElementById('btnVolver')?.addEventListener('click', () => {
    window.location.href = 'gestion_estudiante.html';
  });

  const showMessage = (text, type = 'info') => {
    msg.textContent = text;
    msg.className = type === 'error' ? 'error' : '';
  };

  const getUsuarioId = () => {
    try {
      const raw = localStorage.getItem('usuario');
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj.id || obj.userId || null;
    } catch {
      return null;
    }
  };

  const inscribir = async (tutoriaId, estudianteId) => {
    const res = await fetch('/inscripcion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tutoriaId, estudianteId })
    });
    return res.json();
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

  const renderCursos = (tutorias = [], schedules = [], usuarioId = '') => {
    grid.innerHTML = '';
    const scheduleMap = buildScheduleMap(schedules);

    const disponibles = tutorias.filter(t => {
      const inscritos = Array.isArray(t.estudiantesInscritos)
        ? t.estudiantesInscritos.map(e => typeof e === 'string' ? e : e.id)
        : [];
      return !inscritos.includes(usuarioId);
    });

    if (!disponibles.length) {
      showMessage('No hay tutorías disponibles para inscribirte.', 'error');
      return;
    }

    disponibles.forEach(tutoria => {
      const col = document.createElement('div');
      col.className = 'col';

      const card = document.createElement('div');
      card.className = 'card p-4 border rounded-3 shadow-sm h-100 d-flex flex-column justify-content-start';

      const h3 = document.createElement('h3');
      h3.className = 'fw-medium fs-4 mb-0 text-center';
      h3.textContent = tutoria.titulo;

      const pTutor = document.createElement('p');
      pTutor.className = 'text-muted mt-2 mb-1 text-center';
      pTutor.style.fontSize = '0.9rem';
      pTutor.textContent = `Tutor: ${tutoria.creadorNombre || 'Desconocido'}`;

      const pCupo = document.createElement('p');
      pCupo.className = 'text-muted mb-2 text-center';
      pCupo.style.fontSize = '0.9rem';
      pCupo.textContent = `Cupo: ${tutoria.estudiantesInscritos?.length || 0} / ${tutoria.cupo}`;

      const horarioDiv = document.createElement('div');
      horarioDiv.className = 'text-muted small';
      horarioDiv.innerHTML = '<strong>Horario:</strong><br>';

      const horario = scheduleMap.get(String(tutoria.horarioId));
      const slots = Array.isArray(horario?.slots) ? horario.slots : [];
      const byDay = groupSlotsByDay(slots);

      if (slots.length > 0) {
        Object.keys(byDay).forEach(day => {
          const line = document.createElement('div');
          const ranges = byDay[day]
            .map(s => `${timeDisplay(s.horaInicio)} - ${timeDisplay(s.horaFin)}`)
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

      const input = document.createElement('input');
      input.className = 'form-check-input';
      input.type = 'checkbox';
      input.id = `check-${tutoria.id}`;
      input.dataset.tutoriaId = tutoria.id;

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
      if (!usuarioId) throw new Error('Usuario no autenticado');

      const [tRes, sRes] = await Promise.all([
        fetch('/tutorias'),
        fetch('/horarios')
      ]);

      if (!tRes.ok || !sRes.ok) throw new Error('Error al cargar datos');

      const tutorias = await tRes.json();
      const schedules = await sRes.json();

      renderCursos(tutorias, schedules, usuarioId);
    } catch (err) {
      console.error('[loadTutorias]', err);
      showMessage('No se pudieron cargar las tutorías.', 'error');
    }
  };

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
        if (result.error) {
          console.warn(`[${tutoriaId}]`, result.error);
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`[${tutoriaId}]`, err);
      }
    }

    if (successCount > 0) {
      showMessage(`Inscripción completada en ${successCount} curso(s).`);
      setTimeout(() => {
        window.location.href = 'gestion_estudiante.html';
      }, 1500);
    } else {
      showMessage('No se pudo completar la inscripción.', 'error');
    }
  });

  loadTutorias();
});

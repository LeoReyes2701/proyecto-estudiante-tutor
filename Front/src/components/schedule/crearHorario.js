// /src/components/schedule/crearHorario.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createHorarioForm');
  const dia = document.getElementById('diaSemana');
  const inicio = document.getElementById('horaInicio');
  const fin = document.getElementById('horaFin');

  const MAX_MINUTES = 120; // 2 horas
  const MIN_MINUTES = 20;  // 20 minutos

  const log = (...args) => console.log('[crearHorario]', ...args);

  const timeToMinutes = (t) => {
    if (!t) return NaN;
    const parts = String(t).split(':').map(Number);
    if (parts.length !== 2 || parts.some(v => Number.isNaN(v))) return NaN;
    return parts[0] * 60 + parts[1];
  };

  function showFormMessage(text, type = 'info') {
    let container = document.getElementById('crearHorarioMsg');
    if (!container) {
      container = document.createElement('div');
      container.id = 'crearHorarioMsg';
      container.setAttribute('role', 'status');
      container.style.marginTop = '12px';
      container.style.fontWeight = '600';
      form.appendChild(container);
    }
    container.textContent = text;
    container.style.color = type === 'error' ? '#b72b2b' : type === 'success' ? '#0b7a3b' : '#334155';
  }

  function validateTimes() {
    const s = timeToMinutes(inicio.value);
    const e = timeToMinutes(fin.value);
    if (!Number.isFinite(s) || !Number.isFinite(e)) {
      return { ok: false, msg: 'Selecciona hora de inicio y hora de fin válidas.' };
    }
    if (e <= s) return { ok: false, msg: 'La hora de fin debe ser posterior a la hora de inicio.' };
    const diff = e - s;
    if (diff < MIN_MINUTES) return { ok: false, msg: `La duración mínima es ${MIN_MINUTES} minutos.` };
    if (diff > MAX_MINUTES) return { ok: false, msg: 'La diferencia entre inicio y fin no puede ser mayor a 2 horas.' };
    return { ok: true, duration: diff };
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    log('submit fired');

    const v = validateTimes();
    if (!v.ok) {
      log('validation failed', v.msg);
      return showFormMessage(v.msg, 'error');
    }

    // Obtener usuario desde localStorage (cookie alternativa no contemplada aquí)
    let usuario = null;
    try {
      usuario = JSON.parse(localStorage.getItem('usuario')) || null;
    } catch (e) {
      log('error parsing usuario from localStorage', e);
    }
    if (!usuario) {
      showFormMessage('Debes iniciar sesión como tutor para crear horarios.', 'error');
      return;
    }
    if (String((usuario.rol || '')).toLowerCase() !== 'tutor') {
      showFormMessage('Debes tener el rol tutor para crear horarios.', 'error');
      return;
    }

    const tutorId = usuario.id || usuario.userId || usuario.tutorId;
    if (!tutorId) {
      showFormMessage('No se encontró identificador de tutor en sesión.', 'error');
      return;
    }

    const slot = { day: dia.value, horaInicio: inicio.value, horaFin: fin.value };
    const payloadBase = {
      role: 'tutor',
      tutorId,
      slots: [slot]
    };

    log('payload base', payloadBase);
    showFormMessage('Validando horario...', 'info');

    try {
      // 1) Preview request (sin confirm) para que el backend valide y devuelva preview o errores
      const previewRes = await fetch('/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBase)
      });
      const previewJson = await previewRes.json().catch(() => ({}));
      log('preview response', previewRes.status, previewJson);

      if (!previewRes.ok) {
        const err = previewJson && (previewJson.error || previewJson.message) ? (previewJson.error || previewJson.message) : `Error ${previewRes.status}`;
        showFormMessage(err, 'error');
        return;
      }

      // 2) Confirmar creación
      const payloadCreate = { ...payloadBase, confirm: 'yes' };
      showFormMessage('Creando horario...', 'info');
      const createRes = await fetch('/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadCreate)
      });
      const createJson = await createRes.json().catch(() => ({}));
      log('create response', createRes.status, createJson);

      if (createRes.ok || createRes.status === 201) {
        showFormMessage('Horario creado correctamente', 'success');
        setTimeout(() => { window.location.href = '/gestion.html'; }, 900);
        return;
      }

      const errMsg = createJson && (createJson.error || createJson.message) ? (createJson.error || createJson.message) : `Error ${createRes.status}`;
      showFormMessage(errMsg, 'error');
    } catch (err) {
      log('network error', err);
      showFormMessage('Error de red creando el horario', 'error');
    }
  });

  // Mejora UX: ajustar opciones de horaFin según horaInicio seleccionada
  inicio.addEventListener('change', () => {
    const s = timeToMinutes(inicio.value);
    if (!Number.isFinite(s)) return;
    const opts = Array.from(fin.options);
    opts.forEach(opt => {
      if (!opt.value) return;
      const v = timeToMinutes(opt.value);
      opt.disabled = !(v > s && (v - s) <= MAX_MINUTES);
    });
    if (timeToMinutes(fin.value) <= s || (timeToMinutes(fin.value) - s) > MAX_MINUTES) {
      fin.value = '';
    }
  });
});
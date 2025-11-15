// crearTutoria.js (actualizado: muestra mensaje y redirige a /gestion.html 900ms después si la creación responde ok o 201)
// No se cambió la lógica de validación ni de carga de horarios, solo se ajustó el manejo del POST para aplicar la condición solicitada.
const HORARIOS_ENDPOINT = '/horarios';
const TUTORIAS_MINE = '/tutorias?mine=1';
const POST_TUTORIAS = '/tutorias';

document.addEventListener('DOMContentLoaded', () => {
  const horariosList = document.getElementById('horariosList');
  const form = document.getElementById('crearTutoriaForm');
  const inputTitulo = document.getElementById('titulo');
  const inputDescripcion = document.getElementById('descripcion');
  const inputCupo = document.getElementById('cupo');
  const submitBtn = form && form.querySelector('button[type="submit"]');
  const feedback = document.getElementById('formFeedback');

  // Verificar si hay datos de edición en localStorage
  const editData = localStorage.getItem('editTutoria');
  let isEditing = false;
  let editTutoria = null;
  if (editData) {
    try {
      editTutoria = JSON.parse(editData);
      isEditing = true;
      localStorage.removeItem('editTutoria'); // Limpiar después de usar
    } catch (e) {
      console.warn('Error parsing editTutoria:', e);
    }
  }

  let horarios = []; // normalizados: { id, day, start, end, raw }
  let selectedIdx = new Set();

  function pick(...vals){ for (const v of vals) if (v !== undefined && v !== null && String(v).trim() !== '') return v; return ''; }
  function toHHMM(v){ if (!v) return ''; const s = String(v).trim(); const m = s.match(/^(\d{1,2}):(\d{2})$/); if (m) return `${m[1].padStart(2,'0')}:${m[2]}`; const d = new Date(s); if (!isNaN(d.getTime())) return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; return s; }
  function setFeedback(msg, type='danger'){ if (!feedback) { if (msg) console.warn(msg); return; } feedback.textContent = msg||''; feedback.className=''; feedback.classList.add(type==='success' ? 'alert-success' : 'alert-danger'); feedback.style.marginBottom='12px'; }
  function clearFeedback(){ if (!feedback) return; feedback.textContent=''; feedback.className=''; }

  // Normaliza un raw schedule según la estructura real que mostraste
  function normalizeRaw(raw){
    if (!raw || typeof raw !== 'object') return { id: null, day: '', start: '', end: '', raw };
    const id = raw.id || raw._id || raw.horarioId || null;

    // prioridad: slots[0] si existe (según tu ejemplo)
    if (Array.isArray(raw.slots) && raw.slots.length > 0) {
      const s0 = raw.slots[0] || {};
      const day = pick(s0.day, s0.dia, raw.day, raw.dia);
      const start = pick(s0.horaInicio, s0.hora_inicio, s0.start, s0.from);
      const end = pick(s0.horaFin, s0.hora_fin, s0.end, s0.to);
      return { id, day: String(day||'').trim(), start: toHHMM(start), end: toHHMM(end), raw };
    }

    // fallback: buscar en root aliases
    const day = pick(raw.day, raw.dia, raw.label, raw.name);
    const start = pick(raw.start, raw.horaInicio, raw.hora_inicio, raw.from, raw.begin);
    const end = pick(raw.end, raw.horaFin, raw.hora_fin, raw.to, raw.finish);
    return { id, day: String(day||'').trim(), start: toHHMM(start), end: toHHMM(end), raw };
  }

  function extractHorarioIdsFromTutorias(tutorias){
    const ids = new Set();
    (Array.isArray(tutorias)?tutorias:[]).forEach(t => {
      if (Array.isArray(t.slots)) t.slots.forEach(s => { if (s && (s.horarioId || s.id)) ids.add(String(s.horarioId || s.id)); });
      if (Array.isArray(t.horarios)) t.horarios.forEach(h => { if (h && (h.id || h._id)) ids.add(String(h.id || h._id)); });
      if (t.horarioId) ids.add(String(t.horarioId));
    });
    return ids;
  }

  function filterFree(rawHorarios, tutorias){
    const occupied = extractHorarioIdsFromTutorias(tutorias);
    const normalized = (Array.isArray(rawHorarios)?rawHorarios:[]).map(normalizeRaw);
    return normalized.filter(h => { if (!h.id) return true; return !occupied.has(String(h.id)); });
  }

  function render(){
    horariosList.innerHTML = '';
    if (!Array.isArray(horarios) || horarios.length === 0) {
      const n = document.createElement('div'); n.className = 'no-horarios'; n.textContent = 'No hay horarios libres.'; horariosList.appendChild(n); return;
    }

    horarios.forEach((h, idx) => {
      const item = document.createElement('div'); item.className='horario-item'; item.dataset.idx = idx;

      const left = document.createElement('div'); left.className='horario-left';
      const cb = document.createElement('input'); cb.type='checkbox'; cb.dataset.idx = idx; cb.checked = selectedIdx.has(idx); cb.setAttribute('aria-label','Seleccionar horario');

      const meta = document.createElement('div'); meta.style.marginLeft='8px';
      const dayEl = document.createElement('div'); dayEl.className='horario-day'; dayEl.textContent = h.day ? `${h.day}:` : (h.id ? `Horario ${h.id}:` : '—:');
      const timeEl = document.createElement('div'); timeEl.className='horario-time'; timeEl.textContent = `${h.start || '--:--'} - ${h.end || '--:--'}`;

      meta.appendChild(dayEl); meta.appendChild(timeEl);
      left.appendChild(cb); left.appendChild(meta);

      const actions = document.createElement('div'); actions.className='horario-actions';
      const note = document.createElement('div'); note.className='horario-note'; note.textContent = (h.raw && (h.raw.note || h.raw.descripcion)) || '';
      const btn = document.createElement('button'); btn.type='button'; btn.className='btn btn-sm btn-outline-primary'; btn.textContent = selectedIdx.has(idx) ? 'Deseleccionar' : 'Seleccionar';

      cb.addEventListener('change', e => {
        const i = Number(e.target.dataset.idx);
        if (e.target.checked) selectedIdx.add(i); else selectedIdx.delete(i);
      });
      btn.addEventListener('click', () => {
        if (selectedIdx.has(idx)) selectedIdx.delete(idx); else selectedIdx.add(idx);
        render();
      });

      actions.appendChild(note); actions.appendChild(btn);
      item.appendChild(left); item.appendChild(actions);
      horariosList.appendChild(item);
    });
  }

  async function loadHorarios(){
    horariosList.innerHTML = '<div class="no-horarios">Cargando horarios...</div>';
    clearFeedback();
    try {
      // Obtener tutorId desde localStorage
      let tutorId = null;
      try {
        const raw = localStorage.getItem('usuario');
        if (raw) {
          const u = JSON.parse(raw);
          tutorId = u.id || u.userId || u._id;
        }
      } catch(e){ tutorId = null; }

      const url = tutorId ? `${HORARIOS_ENDPOINT}/tutor/${encodeURIComponent(tutorId)}` : HORARIOS_ENDPOINT;
      const [hRes, tRes] = await Promise.all([
        fetch(url, { credentials:'include', headers:{ 'Accept':'application/json' }}),
        fetch(TUTORIAS_MINE, { credentials:'include', headers:{ 'Accept':'application/json' }}).catch(()=>null)
      ]);

      if (!hRes.ok) throw new Error('Error al cargar horarios');
      const rawH = await hRes.json().catch(()=>[]);
      const rawT = (tRes && tRes.ok) ? await tRes.json().catch(()=>[]) : [];

      horarios = filterFree(rawH, rawT);
      selectedIdx = new Set();
      render();
    } catch (err) {
      console.error(err);
      horariosList.innerHTML = '<div class="no-horarios">No se pudieron cargar los horarios.</div>';
      setFeedback('Error al cargar horarios', 'danger');
    }
  }

  async function validateAndPost(e){
    e && e.preventDefault();
    clearFeedback();
    const titulo = (inputTitulo && inputTitulo.value || '').trim();
    if (!titulo) return setFeedback('El título es requerido.', 'danger');
    const cupo = Number(inputCupo && inputCupo.value) || 0;
    if (!Number.isFinite(cupo) || cupo < 1) return setFeedback('Cupo inválido.', 'danger');

    try {
      const r = await fetch(TUTORIAS_MINE, { credentials:'include', headers:{ 'Accept':'application/json' }});
      if (!r.ok) return setFeedback('No se pudo validar disponibilidad.', 'danger');
      const tutorias = await r.json().catch(()=>[]);
      const occupied = extractHorarioIdsFromTutorias(tutorias);

      const selected = Array.from(selectedIdx).map(i => horarios[i]).filter(Boolean);
      for (const s of selected) {
        if (s.id && occupied.has(String(s.id))) return setFeedback('Error: algún horario seleccionado ya está ocupado.', 'danger');
      }

      const slots = selected.map(s => ({ horarioId: s.id, day: s.day, start: s.start, end: s.end }));
      const payload = { titulo, descripcion: (inputDescripcion && inputDescripcion.value || '').trim(), cupo, slots };

      submitBtn && (submitBtn.disabled = true, submitBtn.textContent = isEditing ? 'Actualizando...' : 'Creando...');

      let method = 'POST';
      let url = POST_TUTORIAS;
      if (isEditing && editTutoria && editTutoria.id) {
        method = 'PUT';
        url = `${POST_TUTORIAS}/${editTutoria.id}`;
      }

      const post = await fetch(url, { method, credentials:'include', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });

      // ---------- Cambiado: comprobar createRes.ok || createRes.status === 201 ----------
      if (post && (post.ok || post.status === 201)) {
        setFeedback(isEditing ? 'Tutoría actualizada.' : 'Tutoría creada.', 'success');
        // redirigir tras 900 ms
        setTimeout(() => { window.location.href = '/gestion.html'; }, 900);
        form.reset();
        selectedIdx.clear();
        await loadHorarios();
        return;
      }

      // si no fue ok, intentar extraer body y mostrar error
      if (!post.ok) {
        const body = await post.json().catch(()=>null);
        return setFeedback(body && body.error ? `Error: ${body.error}` : `Error servidor (${post.status})`, 'danger');
      }

      // fallback (si post no tiene ok y no entró en la condición anterior)
      setFeedback('Respuesta inesperada del servidor.', 'danger');

    } catch (err) {
      console.error(err);
      setFeedback(isEditing ? 'Error actualizando la tutoría' : 'Error creando la tutoría', 'danger');
    } finally {
      submitBtn && (submitBtn.disabled = false, submitBtn.textContent = isEditing ? 'Actualizar tutoría' : 'Publicar tutoría');
    }
  }

  form && form.addEventListener('submit', validateAndPost);

  // Si estamos editando, cargar datos de la tutoría
  if (isEditing && editTutoria) {
    // Cambiar título de la página
    const titleElement = document.querySelector('h3');
    if (titleElement) titleElement.textContent = 'Modificar Tutoría';

    // Cambiar texto del botón
    if (submitBtn) submitBtn.textContent = 'Actualizar tutoría';

    // Llenar formulario con datos existentes
    if (inputTitulo) inputTitulo.value = editTutoria.titulo || '';
    if (inputDescripcion) inputDescripcion.value = editTutoria.descripcion || '';
    if (inputCupo) inputCupo.value = editTutoria.cupo || 10;

    // Seleccionar horarios actuales si existen
    if (editTutoria.horarioId) {
      // Buscar el horario en la lista y seleccionarlo
      setTimeout(() => {
        const horarioIndex = horarios.findIndex(h => String(h.id) === String(editTutoria.horarioId));
        if (horarioIndex !== -1) {
          selectedIdx.add(horarioIndex);
          render();
        }
      }, 1000); // Esperar a que se carguen los horarios
    }
  }

  // inicializar
  loadHorarios();
});

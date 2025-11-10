// Módulo para página crearTutoria.html
// Valida campos y obliga que cupo esté entre 10 y 20 (inclusive)
// Debe cargarse como module desde la página

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('crearTutoriaForm');
  const inputTitulo = document.getElementById('titulo');
  const inputDescripcion = document.getElementById('descripcion');
  const inputCupo = document.getElementById('cupo');
  const submitBtn = document.getElementById('crearTutoriaSubmit');
  const feedback = document.getElementById('formFeedback');

  // Reglas de cupo
  const MIN_CUPO = 10;
  const MAX_CUPO = 20;

  function setFeedback(msg, type = 'danger') {
    if (!feedback) return;
    feedback.textContent = msg;
    feedback.className = ''; // reset classes
    feedback.classList.add('mt-3', 'small');
    if (type === 'success') feedback.classList.add('text-success');
    else feedback.classList.add('text-danger');
  }

  function clearFeedback() {
    if (!feedback) return;
    feedback.textContent = '';
    feedback.className = '';
  }

  function parseCupoValue() {
    if (!inputCupo) return NaN;
    const v = inputCupo.value;
    if (v === null || v === undefined || String(v).trim() === '') return NaN;
    return Number(v);
  }

  function validateCupo() {
    const n = parseCupoValue();
    if (!Number.isFinite(n)) {
      setFeedback(`Cupo inválido. Debe ser un número entre ${MIN_CUPO} y ${MAX_CUPO}.`);
      return false;
    }
    const ni = Math.floor(n);
    if (ni < MIN_CUPO) {
      setFeedback(`El cupo mínimo permitido es ${MIN_CUPO}.`);
      return false;
    }
    if (ni > MAX_CUPO) {
      setFeedback(`El cupo máximo permitido es ${MAX_CUPO}.`);
      return false;
    }
    clearFeedback();
    return true;
  }

  function validateTitle() {
    if (!inputTitulo) return false;
    if (String(inputTitulo.value || '').trim() === '') {
      setFeedback('El título es requerido.');
      return false;
    }
    return true;
  }

  function updateSubmitState() {
    const ok = validateTitle() && validateCupo();
    if (submitBtn) submitBtn.disabled = !ok;
    return ok;
  }

  // Live validation on cupo and title
  if (inputCupo) {
    inputCupo.addEventListener('input', () => {
      validateCupo();
      updateSubmitState();
    });
  }

  if (inputTitulo) {
    inputTitulo.addEventListener('input', () => {
      clearFeedback();
      updateSubmitState();
    });
  }

  // Form submit handler
  if (form) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      clearFeedback();

      if (!updateSubmitState()) return;

      const titulo = String(inputTitulo.value || '').trim();
      const descripcion = String((inputDescripcion && inputDescripcion.value) || '').trim();
      const cupoVal = Math.floor(parseCupoValue());

      const payload = { titulo, descripcion, cupo: cupoVal };

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Creando...';
        }

        const resp = await fetch('/tutorias', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!resp.ok) {
          const body = await resp.json().catch(() => null);
          setFeedback(body && body.error ? `Error: ${body.error}` : `Error en servidor (${resp.status})`);
          return;
        }

        const data = await resp.json().catch(() => null);
        setFeedback('Tutoría creada correctamente.', 'success');

        // Opcional: redirigir a gestión o limpiar formulario
        form.reset();
        updateSubmitState();
      } catch (err) {
        console.error('Error creando tutoria', err);
        setFeedback('No se pudo conectar con el servidor.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Crear tutoría';
        }
      }
    });
  }

  // Inicializar estado
  updateSubmitState();
});
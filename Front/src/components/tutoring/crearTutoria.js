
// crearTutoria.js (version sin alert, muestra mensajes en página)
document.addEventListener('DOMContentLoaded', () => {
  const scheduleCards = Array.from(document.querySelectorAll('.schedule-card'));
  const form = document.getElementById('createTutoriaForm');
  const horarioError = document.getElementById('horarioError');
  const messagesContainer = document.getElementById('appMessages');
  const submitBtn = document.getElementById('submitBtn');

  function showMessage({ title = '', text = '', type = 'success', timeout = 3500 }) {
    if (!messagesContainer) return;
    // Bootstrap toast si está disponible
    if (window.bootstrap && typeof window.bootstrap.Toast === 'function') {
      const toastEl = document.createElement('div');
      toastEl.className = 'toast align-items-center text-bg-' + (type === 'success' ? 'success' : 'danger') + ' border-0';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      toastEl.setAttribute('aria-atomic', 'true');
      toastEl.style.minWidth = '220px';
      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">
            <strong class="d-block mb-1">${title}</strong>
            <div>${text}</div>
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      `;
      messagesContainer.appendChild(toastEl);
      const toast = new bootstrap.Toast(toastEl, { delay: timeout });
      toast.show();
      toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
      return;
    }

    // Fallback simple
    const msg = document.createElement('div');
    msg.className = `app-message ${type === 'success' ? 'success' : 'error'}`;
    msg.style.marginBottom = '8px';
    msg.style.padding = '10px 14px';
    msg.style.borderRadius = '8px';
    msg.style.color = '#fff';
    msg.style.background = type === 'success' ? '#198754' : '#dc3545';
    msg.innerHTML = `<div style="font-weight:600;margin-bottom:4px;">${title}</div><div style="font-size:0.95rem;">${text}</div>`;
    messagesContainer.appendChild(msg);
    setTimeout(() => {
      msg.style.transition = 'opacity 200ms';
      msg.style.opacity = '0';
      setTimeout(() => msg.remove(), 220);
    }, timeout);
  }

  // Toggle visual selección de horarios
  scheduleCards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('selected');
      const selectedCount = document.querySelectorAll('.schedule-card.selected').length;
      if (horarioError) horarioError.classList.toggle('d-none', selectedCount > 0);
    });
  });

  // Helper para desactivar temporalmente botón submit
  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.setAttribute('aria-busy', isSubmitting ? 'true' : 'false');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let isValid = true;
      const nombre = document.getElementById('nombreTutoria').value.trim();
      const descripcion = document.getElementById('descripcionTutoria').value.trim();
      const numCuposInput = document.getElementById('numeroCupos');
      const numCupos = parseInt(numCuposInput.value, 10);
      const selectedSchedules = Array.from(document.querySelectorAll('.schedule-card.selected'));

      if (!nombre || !descripcion) isValid = false;
      if (Number.isNaN(numCupos) || numCupos < 10 || numCupos > 20) isValid = false;

      if (selectedSchedules.length === 0) {
        if (horarioError) horarioError.classList.remove('d-none');
        isValid = false;
      } else {
        if (horarioError) horarioError.classList.add('d-none');
      }

      if (!isValid) {
        showMessage({ title: 'Datos inválidos', text: 'Revisa los campos del formulario.', type: 'error', timeout: 4500 });
        setSubmitting(false);
        return;
      }

      const horariosSeleccionados = selectedSchedules.map(card => ({
        dia: card.getAttribute('data-dia'),
        hora: card.getAttribute('data-hora')
      }));

      const body = { nombre, cupos: numCupos, descripcion, horarios: horariosSeleccionados };

      const res = await fetch('/tutorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showMessage({ title: 'Tutoría creada', text: data.message || 'La tutoría se creó correctamente.', type: 'success', timeout: 3500 });
        form.reset();
        document.querySelectorAll('.schedule-card.selected').forEach(c => c.classList.remove('selected'));
      } else {
        const errText = data.error || (Array.isArray(data.details) ? data.details.map(d => d.msg).join('; ') : 'Error al crear la tutoría.');
        showMessage({ title: 'Error', text: errText, type: 'error', timeout: 6000 });
      }
    } catch (err) {
      console.error('Error al enviar:', err);
      showMessage({ title: 'Conexión fallida', text: 'No se pudo conectar con el servidor.', type: 'error', timeout: 6000 });
    } finally {
      setSubmitting(false);
    }
  });
});


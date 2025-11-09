// Front/src/components/auth/createAccount.js
(() => {
  const form = document.getElementById('createAccountForm');
  if (!form) return;

  const nombre = document.getElementById('nombre');
  const apellido = document.getElementById('apellido');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const rol = document.getElementById('rol');
  const submitBtn = document.getElementById('submitBtn');
  const resetBtn = document.getElementById('resetBtn');
  const formError = document.getElementById('formError');
  const messages = document.getElementById('messages');

  function pushToast(message, type = 'info') {
    const wrapper = document.createElement('div');
    const bg = type === 'error' ? 'danger' : (type === 'success' ? 'success' : 'info');
    wrapper.innerHTML = `
      <div class="toast align-items-center text-bg-${bg} border-0 show" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;
    messages.appendChild(wrapper);
    setTimeout(() => { try { wrapper.remove(); } catch(e) {} }, 4500);
  }

  function showError(text) {
    formError.textContent = text;
    formError.classList.remove('d-none');
    pushToast(text, 'error');
    setTimeout(() => formError.classList.add('d-none'), 4000);
  }

  function setSaving(active, label = '') {
    if (active) {
      submitBtn.setAttribute('disabled', 'disabled');
      submitBtn.textContent = label || 'Procesando...';
    } else {
      submitBtn.removeAttribute('disabled');
      submitBtn.textContent = 'Crear cuenta';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const n = nombre.value.trim();
    const a = apellido.value.trim();
    const em = email.value.trim();
    const pw = password.value;
    const r = rol.value;

    if (!n || !a || !em || !pw || !r) return showError('Todos los campos son obligatorios');
    if (!em.endsWith('@est.ucab.edu.ve')) return showError('El correo debe terminar en @est.ucab.edu.ve');
    if (pw.length < 6) return showError('La contraseña debe tener al menos 6 caracteres');

    const payload = { nombre: n, apellido: a, email: em, password: pw, rol: r };

    try {
      setSaving(true, 'Creando cuenta...');
      const res = await fetch('/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => null);
      setSaving(false);

      if (res.status === 201) {
        pushToast('Cuenta creada correctamente', 'success');
        form.reset();
        return;
      }

      const msg = (json && (json.error || json.mensaje)) || `Error ${res.status}`;
      showError(msg);
    } catch (err) {
      console.error('Error creando cuenta', err);
      setSaving(false);
      showError('Error de red al crear cuenta');
    }
  });

  resetBtn.addEventListener('click', () => form.reset());
})();

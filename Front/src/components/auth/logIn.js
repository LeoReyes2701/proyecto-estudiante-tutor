// Front/src/components/auth/login.js
(() => {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const email = document.getElementById('emailInput');
  const password = document.getElementById('passwordInput');
  const toggle = document.getElementById('togglePassword');
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
    (messages || document.body).appendChild(wrapper);
    setTimeout(() => { try { wrapper.remove(); } catch (e) {} }, 4500);
  }

  function showError(text) {
    if (formError) {
      formError.textContent = text;
      formError.classList.remove('visually-hidden');
      setTimeout(() => formError.classList.add('visually-hidden'), 4000);
    }
    pushToast(text, 'error');
  }

  function setSaving(active, label = '') {
    if (active) {
      submitBtn.setAttribute('disabled', 'disabled');
      submitBtn.textContent = label || 'Procesando...';
    } else {
      submitBtn.removeAttribute('disabled');
      submitBtn.textContent = 'Iniciar Sesión';
    }
  }

  // Toggle password visibility
  if (toggle && password) {
    toggle.addEventListener('click', () => {
      const t = password.getAttribute('type') === 'password' ? 'text' : 'password';
      password.setAttribute('type', t);
      toggle.textContent = t === 'password' ? '👁️' : '🙈';
    });
  }

  // Reset handler
  if (resetBtn) resetBtn.addEventListener('click', () => form.reset());

  // Submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const em = (email.value || '').trim();
    const pw = password.value || '';

    if (!em || !pw) return showError('Correo y contraseña son obligatorios');
    if (!em.endsWith('@est.ucab.edu.ve')) return showError('Usa tu correo institucional (@est.ucab.edu.ve)');

    const payload = { email: em, password: pw };

    try {
      setSaving(true, 'Iniciando sesión...');
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      const json = await res.json().catch(() => null);
      setSaving(false);

      if (res.status === 200) {
        pushToast('Inicio de sesión exitoso', 'success');

        // Si el backend devuelve { redirect: '/ruta' } úsalo; si no, por defecto a gestion.html
        const redirect = json && json.redirect ? json.redirect : '/gestion.html';

        // Guardar token si viene
        if (json && json.token) {
          try { localStorage.setItem('authToken', json.token); } catch (e) { /* ignore */ }
        }

        window.location.href = redirect;
        return;
      }

      const msg = (json && (json.error || json.message)) || `Error ${res.status}`;
      showError(msg);
    } catch (err) {
      console.error('Error en login', err);
      setSaving(false);
      showError('Error de red al iniciar sesión');
    }
  });
})();

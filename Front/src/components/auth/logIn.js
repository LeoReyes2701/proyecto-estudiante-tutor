// Front/src/components/auth/login.js
(() => {
  // Elementos
  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const toggle = document.getElementById('togglePassword');
  const submitBtn = document.getElementById('submitBtn');
  const resetBtn = document.getElementById('resetBtn');
  const formError = document.getElementById('formError');
  const messages = document.getElementById('messages');

  // Utilidades
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
    } else {
      pushToast(text, 'error');
    }
    pushToast(text, 'error');
  }

  function setSaving(active, label = '') {
    if (!submitBtn) return;
    if (active) {
      submitBtn.setAttribute('disabled', 'disabled');
      submitBtn.textContent = label || 'Procesando...';
    } else {
      submitBtn.removeAttribute('disabled');
      submitBtn.textContent = 'Iniciar Sesión';
    }
  }

  // Toggle password visibility (definida aquí)
  function setupPasswordToggle() {
    if (!toggle || !passwordInput) return;
    toggle.addEventListener('click', () => {
      const t = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', t);
      toggle.textContent = t === 'password' ? '👁️' : '🙈';
    });
  }

  // Reset handler
  if (resetBtn) resetBtn.addEventListener('click', () => form.reset());

  // Main submit handler (single listener)
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const em = (emailInput.value || '').trim().toLowerCase();
    const pw = (passwordInput.value || '').trim();

    if (!em || !pw) {
      return showError('Correo y contraseña son obligatorios');
    }
    if (!em.endsWith('@est.ucab.edu.ve')) {
      return showError('Usa tu correo institucional (@est.ucab.edu.ve)');
    }

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

      if (res.ok) {
        pushToast('Inicio de sesión exitoso', 'success');

        // Guardar token/usuario si viene en respuesta
        if (json && json.token) {
          try { localStorage.setItem('authToken', json.token); } catch (e) {}
        }
        if (json && json.user) {
          try { localStorage.setItem('usuario', JSON.stringify(json.user)); } catch (e) {}
        }

        const redirect = (json && json.redirect) ? json.redirect : '/gestion.html';
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

  // Inicialización después de cargar DOM
  document.addEventListener('DOMContentLoaded', () => {
    setupPasswordToggle();
  });

  // Si el documento ya está cargado, inicializar inmediatamente
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupPasswordToggle();
  }
})();

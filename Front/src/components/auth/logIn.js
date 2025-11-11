// Front/src/components/auth/login.js
import '/src/utils/modals.js';

(() => {
  function q(id){ return document.getElementById(id); }
  function showError(el, text){
    if(!el) {
      return showAlert(text, {
        title: 'Error',
        type: 'error',
        confirmText: 'Entendido'
      });
    }
    el.textContent = text;
    el.classList.remove('visually-hidden');
    setTimeout(()=>el.classList.add('visually-hidden'),4500);
  }

  const form = q('loginForm');
  if (!form) return;

  const email = q('emailInput');
  const pwd = q('passwordInput');
  const submitBtn = q('submitBtn');
  const formError = q('formError');
  const btnClear = q('btnClear'); // coincide con el HTML que no cambiamos
  const toggle = q('togglePassword');

  // Submit del formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const em = (email && email.value || '').trim().toLowerCase();
    const pw = (pwd && pwd.value || '').trim();
    if (!em || !pw) return showError(formError, 'Correo y contraseña son obligatorios');

    submitBtn.setAttribute('disabled','disabled');
    submitBtn.textContent = 'Iniciando...';
    try {
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, password: pw })
      });
      const json = await res.json().catch(()=>null);
      submitBtn.removeAttribute('disabled');
      submitBtn.textContent = 'Iniciar Sesión';

      if (res.ok && json && json.ok) {
        try { localStorage.setItem('usuario', JSON.stringify(json.user)); } catch(e){}
        window.location.href = json.redirect || '/logIn.html';
        return;
      }

      const msg = (json && (json.error || json.message)) || `Error ${res.status}`;
      showError(formError, msg);
    } catch (err) {
      submitBtn.removeAttribute('disabled');
      submitBtn.textContent = 'Iniciar Sesión';
      showError(formError, 'Error de red al iniciar sesión');
    }
  });

  // Botón Limpiar (funciona con id="btnClear" del HTML proporcionado)
  if (btnClear) {
    btnClear.addEventListener('click', (e) => {
      e.preventDefault();
      if (email) { email.value = ''; email.dispatchEvent(new Event('input')); }
      if (pwd) { pwd.value = ''; pwd.dispatchEvent(new Event('input')); }
      if (formError) { formError.textContent = ''; formError.classList.add('visually-hidden'); }
      try { localStorage.removeItem('usuario'); } catch(e){}
      // limpiar cookie 'usuario' en cliente (mejor-effort)
      document.cookie = 'usuario=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      if (email) email.focus();
    });
  }

  // Toggle contraseña
  if (toggle) {
    toggle.addEventListener('click', () => {
      const pwdEl = q('passwordInput');
      if (!pwdEl) return;
      const t = pwdEl.getAttribute('type') === 'password' ? 'text' : 'password';
      pwdEl.setAttribute('type', t);
      toggle.textContent = t === 'password' ? '👁️' : '🙈';
    });
  }
})();
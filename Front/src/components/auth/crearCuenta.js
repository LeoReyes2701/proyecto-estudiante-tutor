// /src/components/auth/crearCuenta.js
const form = document.getElementById('registerForm');
const regBtn = document.getElementById('regBtn');
const regError = document.getElementById('regError');

if (form) {
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    regError.classList.add('visually-hidden');
    regError.textContent = '';

    const nombre = getValue('nombre');
    const apellido = getValue('apellido');
    const email = getValue('email');
    const password = getValue('password');
    const confirmPassword = getValue('confirmPassword');
    const rol = getValue('rol').toLowerCase();

    // Validaciones básicas
    if (!nombre || !apellido || !email || !password || !confirmPassword) {
      showError('Completa todos los campos obligatorios.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Ingresa un correo válido.');
      return;
    }

    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      showError('Las contraseñas no coinciden.');
      markInvalid('confirmPassword');
      return;
    }

    if (!['estudiante', 'tutor', 'profesor'].includes(rol)) {
      showError('Rol inválido.');
      return;
    }

    const payload = {
      nombre,
      apellido,
      email,
      password,
      rol
    };

    try {
      setLoading(true);
      const resp = await fetch('/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin'
      });

      const json = await resp.json().catch(() => null);

      if (!resp.ok || !json) {
        const errMsg = (json && json.error) ? json.error : `Error de servidor (${resp.status})`;
        showError(errMsg);
        return;
      }

      if (json.ok) {
        regBtn.textContent = 'Registrado';
        setTimeout(() => {
          window.location.href = json.redirect || '/';
        }, 600);
      } else {
        showError(json.error || 'No se pudo registrar.');
      }
    } catch (err) {
      console.error('[crearCuenta] network error', err);
      showError('Error de red. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  });
}

function getValue(id) {
  return String((document.getElementById(id) || {}).value || '').trim();
}

function showError(msg) {
  regError.textContent = msg;
  regError.classList.remove('visually-hidden');
}

function setLoading(isLoading) {
  if (isLoading) {
    regBtn.disabled = true;
    regBtn.innerHTML = 'Registrando...';
  } else {
    regBtn.disabled = false;
    regBtn.innerHTML = 'Crear cuenta';
  }
}

function markInvalid(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('is-invalid');
    el.addEventListener('input', () => el.classList.remove('is-invalid'), { once: true });
  }
}

// /src/components/auth/crearCuenta.js
const form = document.getElementById('registerForm');
const regBtn = document.getElementById('regBtn');
const regError = document.getElementById('regError');

if (form) {
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    regError.classList.add('visually-hidden');
    regError.textContent = '';

    const nombre = String((document.getElementById('nombre') || {}).value || '').trim();
    const apellido = String((document.getElementById('apellido') || {}).value || '').trim();
    const email = String((document.getElementById('email') || {}).value || '').trim();
    const password = String((document.getElementById('password') || {}).value || '');
    const rol = String((document.getElementById('rol') || {}).value || 'estudiante').trim().toLowerCase();

    // validaciones básicas en cliente
    if (!nombre || !apellido || !email || !password) {
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
    if (!['estudiante', 'tutor', 'profesor'].includes(rol)) {
      // aceptar alias "profesor"
      showError('Rol inválido.');
      return;
    }

    const payload = {
      nombre,
      apellido,
      email,
      password,
      rol // enviado tal cual; backend normalizará profesor->tutor
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
        // éxito: redirigir según el servidor o mostrar confirmación
        const redirect = json.redirect || '/';
        // pequeña pausa para feedback
        regBtn.textContent = 'Registrado';
        setTimeout(() => {
          window.location.href = redirect;
        }, 600);
        return;
      } else {
        showError(json.error || 'No se pudo registrar.');
        return;
      }
    } catch (err) {
      console.error('[crearCuenta] network error', err);
      showError('Error de red. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  });
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
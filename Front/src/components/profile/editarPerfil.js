// /src/components/profile/editarPerfil.js
const form = document.getElementById('editProfileForm');
const editBtn = document.getElementById('editBtn');
const editError = document.getElementById('editError');

if (form) {
  // Load current user data
  loadUserData();

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    editError.classList.add('visually-hidden');
    editError.textContent = '';

    const nombre = getValue('nombre');
    const apellido = getValue('apellido');
    const password = getValue('password');
    const confirmPassword = getValue('confirmPassword');

    // Validaciones básicas
    if (!nombre || !apellido) {
      showError('Nombre y apellido son obligatorios.');
      return;
    }

    if (password || confirmPassword) {
      if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden.');
        markInvalid('confirmPassword');
        return;
      }
    }

    const payload = {
      nombre,
      apellido,
      password: password || undefined // Only send if provided
    };

    try {
      setLoading(true);
      const resp = await fetch('/auth/profile', {
        method: 'PUT',
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
        editBtn.textContent = 'Guardado';
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 600);
      } else {
        showError(json.error || 'No se pudo actualizar el perfil.');
      }
    } catch (err) {
      console.error('[editarPerfil] network error', err);
      showError('Error de red. Revisa la consola.');
    } finally {
      setLoading(false);
    }
  });
}

async function loadUserData() {
  try {
    const resp = await fetch('/auth/profile', {
      method: 'GET',
      credentials: 'same-origin'
    });

    const json = await resp.json().catch(() => null);

    if (resp.ok && json && json.ok) {
      const user = json.user;
      setValue('nombre', user.nombre || '');
      setValue('apellido', user.apellido || '');
      setValue('email', user.email || '');
      setValue('rol', user.rol || 'estudiante');
    } else {
      console.error('Failed to load user data');
      window.location.href = '/login.html';
    }
  } catch (err) {
    console.error('[editarPerfil] error loading user data', err);
    window.location.href = '/login.html';
  }
}

function getValue(id) {
  return String((document.getElementById(id) || {}).value || '').trim();
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function showError(msg) {
  editError.textContent = msg;
  editError.classList.remove('visually-hidden');
}

function setLoading(isLoading) {
  if (isLoading) {
    editBtn.disabled = true;
    editBtn.innerHTML = 'Guardando...';
  } else {
    editBtn.disabled = false;
    editBtn.innerHTML = 'Guardar Cambios';
  }
}

function markInvalid(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('is-invalid');
    el.addEventListener('input', () => el.classList.remove('is-invalid'), { once: true });
  }
}

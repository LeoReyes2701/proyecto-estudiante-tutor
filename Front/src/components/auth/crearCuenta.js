<<<<<<< HEAD
function setupPasswordToggle(toggleId, inputId) {
    const toggle = document.querySelector(`#${toggleId}`);
    const input = document.querySelector(`#${inputId}`);
    
    if (toggle && input) {
        // El toggle es invisible (controlado por CSS), pero el cursor indica que es cliqueable.
        toggle.addEventListener('click', function (e) {
            // Alterna entre el tipo 'password' y 'text'
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
        });
    }
}
document.addEventListener('DOMContentLoaded', function() {
  // Formulario principal
  const form = document.getElementById('signupForm');
  if (!form) return console.warn('Formulario #form-registro no encontrado en la página.');

  // Inicializar toggles de contraseña (si existen)
  setupPasswordToggle('togglePassword1', 'passwordInput');
  setupPasswordToggle('togglePassword2', 'confirmPasswordInput');

  // Selección de rol: soporta IDs específicos o un grupo .role-selection .btn
  const btnEstudiante = document.getElementById('roleEstudiante');
  const btnTutor = document.getElementById('roleTutor');
  const roleButtons = document.querySelectorAll('.role-selection .btn');
  let rolSeleccionado = null;

  function marcarActivo(botonActivo, botonInactivo) {
    if (!botonActivo) return;
    botonActivo.classList.add('active-role', 'btn-primary');
    botonActivo.classList.remove('btn-outline-secondary');
    if (botonInactivo) {
      botonInactivo.classList.remove('active-role', 'btn-primary');
      botonInactivo.classList.add('btn-outline-secondary');
    }
  }

  if (btnEstudiante) {
    btnEstudiante.addEventListener('click', () => {
      rolSeleccionado = 'estudiante';
      marcarActivo(btnEstudiante, btnTutor);
    });
  }
  if (btnTutor) {
    btnTutor.addEventListener('click', () => {
      rolSeleccionado = 'tutor';
      marcarActivo(btnTutor, btnEstudiante);
    });
  }

  // Fallback: si no hay IDs, usar botones con .role-selection .btn
  if (!btnEstudiante && !btnTutor && roleButtons.length) {
    roleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        roleButtons.forEach(b => b.classList.remove('active-role', 'btn-primary'));
        btn.classList.add('active-role', 'btn-primary');
        rolSeleccionado = btn.dataset.role || btn.getAttribute('data-role') || (btn.id && btn.id.toLowerCase().includes('est') ? 'estudiante' : 'tutor');
      });
    });
  }

  // Helper para leer valores del formulario de forma robusta
  function getFormValue(name) {
    const el = form.elements[name] || form.querySelector(`[name="${name}"]`) || document.getElementById(name);
    return el ? (el.value || '').toString() : '';
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    if (!rolSeleccionado) {
      alert('Debes seleccionar un rol antes de registrarte');
=======
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
>>>>>>> origin/mauricio
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

<<<<<<< HEAD
=======
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
>>>>>>> origin/mauricio

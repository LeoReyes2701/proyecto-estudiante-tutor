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
      return;
    }

    const nombre = document.getElementById("nombreInput")?.value.trim();
    const apellido = document.getElementById("apellidoInput")?.value.trim();
    const email = document.getElementById("emailInput")?.value.trim().toLowerCase();
    const password = document.getElementById("passwordInput")?.value.trim();
    const confirmPassword = document.getElementById("confirmPasswordInput")?.value.trim();


    // if (!nombre || !apellido || !email || !password) {
    //   alert('Faltan campos obligatorios');
    //   return;
    // }

    const camposFaltantes = [];

    if (!form.nombreInput.value.trim()) camposFaltantes.push("Nombre");
    if (!form.apellidoInput.value.trim()) camposFaltantes.push("Apellido");
    if (!form.correoInput.value.trim()) camposFaltantes.push("Correo");
    if (!form.contraseñaInput.value.trim()) camposFaltantes.push("Contraseña");
    if (!form.confirmarContraseñaInput.value.trim()) camposFaltantes.push("confirmarContraseña");
    if (!rolSeleccionado) camposFaltantes.push("Rol");

    if (camposFaltantes.length > 0) {
    alert("Faltan campos obligatorios: " + camposFaltantes.join(", "));
    return;
    }


    if (!email.endsWith('@est.ucab.edu.ve')) {
      alert('El correo debe terminar en @est.ucab.edu.ve');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const datos = { nombre, apellido, email, password, rol: rolSeleccionado };

    try {
      const res = await fetch('http://localhost:3000/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      let resultado = null;
      try { resultado = await res.json(); } catch (err) { /* ignore parse error */ }

      if (res.ok) {
        alert(resultado?.mensaje || 'Usuario registrado con éxito');
        window.location.href = "/login";
        form.reset();
        rolSeleccionado = null;
        roleButtons.forEach(b => b.classList.remove('active-role', 'btn-primary'));
        if (btnEstudiante) { btnEstudiante.classList.remove('btn-primary'); btnEstudiante.classList.add('btn-outline-secondary'); }
        if (btnTutor) { btnTutor.classList.remove('btn-primary'); btnTutor.classList.add('btn-outline-secondary'); }
      } else {
        alert(resultado?.error || resultado?.mensaje || `Error ${res.status}: ${res.statusText}`);
      }
    } catch (err) {
      console.error('Error en fetch registro:', err);
      alert('Error al conectar con el servidor');
    }
  });

});


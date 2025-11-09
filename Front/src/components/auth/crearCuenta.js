class CrearCuenta {
  constructor(rootFormId = 'signupForm') {
    this.form = document.getElementById(rootFormId);
    if (!this.form) return console.warn(`#${rootFormId} no encontrado`);
    this.bindEls();
    this.attachListeners();
  }

  bindEls() {
    this.nombre = this.form.querySelector('#nombreInput');
    this.apellido = this.form.querySelector('#apellidoInput');
    this.email = this.form.querySelector('#emailInput');
    this.password = this.form.querySelector('#passwordInput');
    this.confirmPassword = this.form.querySelector('#confirmPasswordInput');
    this.roleEst = document.getElementById('roleEstudiante');
    this.roleTut = document.getElementById('roleTutor');
    this.roleButtons = Array.from(this.form.querySelectorAll('.role-selection .btn'));
    this.rolSeleccionado = null;
    this.alertContainer = document.getElementById('pageAlertContainer') || this.form;
  }

  attachListeners() {
    this.setupToggle('togglePassword1', this.password);
    this.setupToggle('togglePassword2', this.confirmPassword);

    if (this.roleEst) this.roleEst.addEventListener('click', () => this.selectRole('estudiante', this.roleEst, this.roleTut));
    if (this.roleTut) this.roleTut.addEventListener('click', () => this.selectRole('tutor', this.roleTut, this.roleEst));
    if (!this.roleEst && !this.roleTut && this.roleButtons.length) {
      this.roleButtons.forEach(btn => btn.addEventListener('click', () => this.selectRoleFromBtn(btn)));
    }

    this.form.addEventListener('submit', (e) => this.onSubmit(e));
  }

  setupToggle(toggleId, inputEl) {
    if (!toggleId || !inputEl) return;
    const toggle = document.getElementById(toggleId);
    if (!toggle) return;
    toggle.style.cursor = 'pointer';
    toggle.addEventListener('click', () => {
      inputEl.type = inputEl.type === 'password' ? 'text' : 'password';
    });
  }

  selectRole(rol, activo, inactivo) {
    this.rolSeleccionado = rol;
    if (activo) {
      activo.classList.add('active-role', 'btn-primary');
      activo.classList.remove('btn-outline-secondary');
    }
    if (inactivo) {
      inactivo.classList.remove('active-role', 'btn-primary');
      inactivo.classList.add('btn-outline-secondary');
    }
  }

  selectRoleFromBtn(btn) {
    this.roleButtons.forEach(b => b.classList.remove('active-role', 'btn-primary'));
    btn.classList.add('active-role', 'btn-primary');
    const roleFromDataset = btn.dataset.role || btn.getAttribute('data-role');
    if (roleFromDataset) this.rolSeleccionado = roleFromDataset;
    else this.rolSeleccionado = btn.id && btn.id.toLowerCase().includes('est') ? 'estudiante' : 'tutor';
  }

  collectFields() {
    return {
      nombre: this.nombre?.value.trim() || '',
      apellido: this.apellido?.value.trim() || '',
      email: (this.email?.value.trim() || '').toLowerCase(),
      password: this.password?.value || '',
      confirmPassword: this.confirmPassword?.value || '',
      rol: this.rolSeleccionado
    };
  }

  validate(fields) {
    const faltan = [];
    if (!fields.nombre) faltan.push('Nombre');
    if (!fields.apellido) faltan.push('Apellido');
    if (!fields.email) faltan.push('Correo');
    if (!fields.password) faltan.push('Contraseña');
    if (!fields.confirmPassword) faltan.push('Confirmar contraseña');
    if (!fields.rol) faltan.push('Rol');
    if (faltan.length) return { ok: false, msg: `Faltan campos obligatorios: ${faltan.join(', ')}` };
    if (!fields.email.endsWith('@est.ucab.edu.ve')) return { ok: false, msg: 'El correo debe terminar en @est.ucab.edu.ve' };
    if (fields.password.length < 6) return { ok: false, msg: 'La contraseña debe tener al menos 6 caracteres' };
    if (fields.password !== fields.confirmPassword) return { ok: false, msg: 'Las contraseñas no coinciden' };
    return { ok: true };
  }

  showMessage(message, type = 'success', timeout = 4000) {
    const container = this.alertContainer;
    if (!container) {
      alert(message);
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert" style="border-radius:.5rem;">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;

    // Limpiar anteriores y añadir nueva
    container.innerHTML = '';
    container.appendChild(wrapper);

    // Auto-dismiss con instancia de Bootstrap si está disponible
    if (timeout > 0) {
      setTimeout(() => {
        try {
          const alertEl = wrapper.querySelector('.alert');
          if (window.bootstrap && alertEl) {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alertEl);
            bsAlert.close();
          } else {
            wrapper.innerHTML = '';
          }
        } catch (e) {
          wrapper.innerHTML = '';
        }
      }, timeout);
    }
  }

  async onSubmit(e) {
    e.preventDefault();
    const fields = this.collectFields();
    const v = this.validate(fields);
    if (!v.ok) return this.showMessage(v.msg, 'danger');

    const payload = {
      nombre: fields.nombre,
      apellido: fields.apellido,
      email: fields.email,
      password: fields.password,
      rol: fields.rol
    };

    try {
      const res = await fetch('/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await (res.headers.get('content-type')?.includes('application/json') ? res.json() : null);

      if (res.ok) {
        this.showMessage(json?.mensaje || 'Usuario registrado con éxito', 'success');
        this.form.reset();
        this.rolSeleccionado = null;
        this.roleButtons.forEach(b => b.classList.remove('active-role', 'btn-primary'));
        if (this.roleEst) { this.roleEst.classList.remove('btn-primary'); this.roleEst.classList.add('btn-outline-secondary'); }
        if (this.roleTut) { this.roleTut.classList.remove('btn-primary'); this.roleTut.classList.add('btn-outline-secondary'); }
      } else {
        this.showMessage(json?.error || json?.mensaje || `Error ${res.status}`, 'danger');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      this.showMessage('Error al conectar con el servidor', 'danger');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new CrearCuenta('signupForm'));

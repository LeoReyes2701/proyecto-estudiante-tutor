class CrearTutoria {
  constructor(formId = 'crearTutoriaForm') {
    this.form = document.getElementById(formId);
    if (!this.form) return console.warn(`#${formId} no encontrado`);
    this.horarioContainer = document.getElementById('horarioContainer');
    this.selectedInput = document.getElementById('selectedSchedule');
    this.alertContainer = document.getElementById('pageAlertContainer') || this.form;
    this.selected = null;
    this.init();
  }

  async init() {
    this.attachListeners();
    await this.loadSchedules();
  }

  attachListeners() {
    this.form.addEventListener('submit', (e) => this.onSubmit(e));
    const btnReset = document.getElementById('resetSelection');
    if (btnReset) btnReset.addEventListener('click', () => this.clearSelection());
  }

  async loadSchedules() {
    try {
      const res = await fetch('/data/schedules.json', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const schedules = await res.json();
      this.renderSchedules(schedules);
    } catch (err) {
      console.error('Error cargando schedules.json', err);
      this.horarioContainer.innerHTML = '<div class="text-danger">No se pudieron cargar los horarios</div>';
    }
  }

  renderSchedules(schedules = []) {
    if (!Array.isArray(schedules) || schedules.length === 0) {
      this.horarioContainer.innerHTML = '<div class="text-muted">No hay horarios disponibles</div>';
      return;
    }

    this.horarioContainer.innerHTML = '';
    schedules.forEach((s, idx) => {
      const card = document.createElement('div');
      card.className = 'schedule-card';
      card.tabIndex = 0;
      card.setAttribute('data-dia', s.dia || '');
      card.setAttribute('data-hora', s.hora || '');
      card.setAttribute('data-id', s.id ?? idx);
      card.textContent = `${s.dia} ${s.hora}`;

      card.addEventListener('click', () => this.toggleSelect(card));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggleSelect(card); }
      });

      this.horarioContainer.appendChild(card);
    });
  }

  toggleSelect(card) {
    // Desactivar previos
    Array.from(this.horarioContainer.querySelectorAll('.schedule-card.active')).forEach(c => c.classList.remove('active'));
    // Activar actual
    card.classList.add('active');
    this.selected = {
      id: card.getAttribute('data-id'),
      dia: card.getAttribute('data-dia'),
      hora: card.getAttribute('data-hora')
    };
    if (this.selectedInput) this.selectedInput.value = JSON.stringify(this.selected);
  }

  clearSelection() {
    Array.from(this.horarioContainer.querySelectorAll('.schedule-card.active')).forEach(c => c.classList.remove('active'));
    this.selected = null;
    if (this.selectedInput) this.selectedInput.value = '';
  }

  showMessage(msg, type = 'success', timeout = 4000) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${msg}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>`;
    this.alertContainer.innerHTML = '';
    this.alertContainer.appendChild(wrapper);
    if (timeout > 0) setTimeout(() => {
      try { const el = wrapper.querySelector('.alert'); if (window.bootstrap && el) bootstrap.Alert.getOrCreateInstance(el).close(); else wrapper.innerHTML = ''; } catch (e) { wrapper.innerHTML = ''; }
    }, timeout);
  }

  async onSubmit(e) {
    e.preventDefault();
    const asignatura = (this.form.querySelector('#asignaturaInput')?.value || '').trim();
    if (!asignatura) return this.showMessage('La asignatura es obligatoria', 'danger');

    if (!this.selected) return this.showMessage('Selecciona un horario disponible', 'danger');

    const payload = {
      asignatura,
      descripcion: this.form.querySelector('#descripcionInput')?.value || '',
      schedule: this.selected
    };

    try {
      const res = await fetch('/api/tutorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await (res.headers.get('content-type')?.includes('application/json') ? res.json() : null);
      if (res.ok) {
        this.showMessage(json?.mensaje || 'Tutoría creada con éxito', 'success');
        this.form.reset();
        this.clearSelection();
      } else {
        this.showMessage(json?.error || json?.mensaje || `Error ${res.status}`, 'danger');
      }
    } catch (err) {
      console.error('Error creando tutoría', err);
      this.showMessage('Error al conectar con el servidor', 'danger');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new CrearTutoria('crearTutoriaForm'));

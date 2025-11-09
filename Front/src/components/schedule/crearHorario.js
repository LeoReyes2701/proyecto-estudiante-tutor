// Front/src/components/schedule/crearHorario.js
const d = document;

class CrearHorario {
  constructor() {
    this.form = d.getElementById('createScheduleForm');
    this.userIdInput = d.getElementById('userIdInput');
    this.daySelect = d.getElementById('daySelect');
    this.startInput = d.getElementById('startInput');
    this.endInput = d.getElementById('endInput');
    this.submitBtn = d.getElementById('submitSchedule');
    this.resetBtn = d.getElementById('resetForm');
    this.formError = d.getElementById('formError');
    this.saveStatus = d.getElementById('saveStatus');
    this.serverSchedules = d.getElementById('serverSchedules');
    this.appMessages = d.getElementById('appMessages');
    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => this.onSubmit(e));
    this.resetBtn.addEventListener('click', () => this.onReset());
    window.addEventListener('load', () => this.loadServerSchedules());
  }

  pushAlert(msg, type='info') {
    const el = document.createElement('div');
    el.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    this.appMessages.appendChild(el);
    setTimeout(() => { try { el.querySelector('.alert').classList.remove('show'); } catch(e){} }, 4000);
  }

  validateSlot(day, start, end) {
    if (!day) return 'Selecciona un día';
    if (!start || !end) return 'Selecciona hora de inicio y fin';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if ([sh, sm, eh, em].some(v => Number.isNaN(v))) return 'Formato de hora inválido';
    const sMin = sh*60 + sm;
    const eMin = eh*60 + em;
    if (sMin >= eMin) return 'La hora de inicio debe ser anterior a la de fin';
    if (eMin - sMin < 20) return 'La duración mínima es 20 minutos';
    return null;
  }

  async onSubmit(e) {
    e.preventDefault();
    const userId = this.userIdInput.value.trim();
    const day = this.daySelect.value;
    const start = this.startInput.value;
    const end = this.endInput.value;

    if (!userId) return this.showError('userId es obligatorio');
    const v = this.validateSlot(day, start, end);
    if (v) return this.showError(v);

    const payload = { role: 'tutor', userId, slots: [{ day, start, end }], confirm: 'yes' };

    try {
      this.setSaving(true, 'Guardando...');
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => null);
      this.setSaving(false);

      if (res.status === 201) {
        this.pushAlert('Horario guardado correctamente', 'success');
        this.onReset();
        this.loadServerSchedules();
        return;
      }

      if (res.status === 200 && json && json.message === 'Horario ya existe') {
        this.pushAlert('El horario ya existe', 'info');
        this.loadServerSchedules();
        return;
      }

      const msg = json?.error || json?.message || `Error ${res.status}`;
      this.showError(msg);
    } catch (err) {
      console.error('Error guardando horario', err);
      this.setSaving(false);
      this.showError('Error de red al guardar horario');
    }
  }

  showError(msg) {
    this.formError.textContent = msg;
    this.formError.classList.remove('d-none');
    this.pushAlert(msg, 'danger');
    setTimeout(() => this.formError.classList.add('d-none'), 5000);
  }

  onReset() {
    this.userIdInput.value = '';
    this.daySelect.value = '';
    this.startInput.value = '';
    this.endInput.value = '';
    this.saveStatus.textContent = '';
  }

  setSaving(active, text='') {
    if (active) {
      this.submitBtn.setAttribute('disabled', 'disabled');
      this.saveStatus.textContent = text;
    } else {
      this.submitBtn.removeAttribute('disabled');
      this.saveStatus.textContent = '';
    }
  }

  async loadServerSchedules() {
    try {
      const res = await fetch('/api/schedules', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const arr = await res.json();
      this.renderServerSchedules(arr || []);
    } catch (err) {
      console.error('Error cargando schedules', err);
      this.serverSchedules.innerHTML = '<div class="text-danger">No se pudieron cargar horarios</div>';
    }
  }

  renderServerSchedules(arr) {
    if (!arr || arr.length === 0) {
      this.serverSchedules.innerHTML = '<div class="text-muted">No hay horarios en el servidor</div>';
      return;
    }
    this.serverSchedules.innerHTML = '';
    arr.forEach(s => {
      const card = document.createElement('div');
      card.className = 'card p-2 mb-2';
      const slotsHtml = (s.slots || []).map(sl => `<div class="small">${sl.day} • ${sl.start} - ${sl.end}</div>`).join('');
      card.innerHTML = `<div class="d-flex justify-content-between"><div><strong>${s.userId}</strong></div><div class="text-muted">${s.createdAt ?? ''}</div></div><div class="mt-2">${slotsHtml}</div>`;
      this.serverSchedules.appendChild(card);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => new CrearHorario());

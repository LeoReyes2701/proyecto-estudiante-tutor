class Tutoria {
  constructor({ id = null, nombre, cupos, descripcion, horarios = [] } = {}) {
    this.id = id || Tutoria.generateId();
    this.nombre = typeof nombre === 'string' ? nombre.trim() : '';
    this.cupos = Number.isFinite(Number(cupos)) ? Number(cupos) : null;
    this.descripcion = typeof descripcion === 'string' ? descripcion.trim() : '';
    this.horarios = Array.isArray(horarios) ? horarios.map(h => ({
      dia: (h && h.dia) ? String(h.dia) : '',
      hora: (h && h.hora) ? String(h.hora) : ''
    })) : [];
  }

  static generateId() {
    // ID simple y único basado en timestamp + random (suficiente para demo)
    return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      cupos: this.cupos,
      descripcion: this.descripcion,
      horarios: this.horarios
    };
  }

  validate() {
    if (!this.nombre) return { ok: false, field: 'nombre', message: 'Nombre obligatorio' };
    if (!this.descripcion) return { ok: false, field: 'descripcion', message: 'Descripción obligatoria' };
    if (!Number.isInteger(this.cupos) || this.cupos < 10 || this.cupos > 20) {
      return { ok: false, field: 'cupos', message: 'Cupos debe ser entero entre 10 y 20' };
    }
    if (!Array.isArray(this.horarios) || this.horarios.length === 0) {
      return { ok: false, field: 'horarios', message: 'Debe seleccionar al menos un horario' };
    }
    for (let i = 0; i < this.horarios.length; i++) {
      const h = this.horarios[i];
      if (!h.dia || !h.hora) {
        return { ok: false, field: `horarios[${i}]`, message: 'Cada horario necesita dia y hora' };
      }
    }
    return { ok: true };
  }
}

module.exports = Tutoria;

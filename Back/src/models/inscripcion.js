class Inscripcion {
  constructor({ id = null, userId, tutoriaId, horarioId = null } = {}) {
    this.id = id || Inscripcion.generateId();
    this.userId = typeof userId === 'string' ? userId.trim() : null;
    this.tutoriaId = typeof tutoriaId === 'string' ? tutoriaId.trim() : null;
    this.horarioId = typeof horarioId === 'string' ? horarioId.trim() : null;
    this.fecha = new Date().toISOString(); // Fecha automática de inscripción
  }

  static generateId() {
    const rand = Math.floor(Math.random() * 10000);
    return `INS-${Date.now()}-${rand}`;
  }

  // Validar que tenga los campos requeridos
  validate() {
    if (!this.userId) return { ok: false, reason: 'Falta el userId' };
    if (!this.tutoriaId) return { ok: false, reason: 'Falta el tutoriaId' };
    return { ok: true };
  }

  // Representación en JSON
  toJSON() {
    const result = {
      id: this.id,
      userId: this.userId,
      tutoriaId: this.tutoriaId,
      fecha: this.fecha
    };

    if (this.horarioId) {
      result.horarioId = this.horarioId;
    }

    return result;
  }
}

module.exports = Inscripcion;

class Inscripcion {
  constructor({ id = null, userId, tutoriaId } = {}) {
    this.id = id || Inscripcion.generateId();
    this.userId = typeof userId === 'string' ? userId.trim() : null;
    this.tutoriaId = typeof tutoriaId === 'string' ? tutoriaId.trim() : null;
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
    return {
      id: this.id,
      userId: this.userId,
      tutoriaId: this.tutoriaId,
      fecha: this.fecha
    };
  }
}

module.exports = Inscripcion;

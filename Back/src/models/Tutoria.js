class Tutoria {
  constructor(obj = {}) {
    this.id = obj.id || (Date.now().toString() + '-' + Math.random().toString(36).slice(2, 9));
    this.titulo = String(obj.titulo || '').trim();
    this.descripcion = String(obj.descripcion || '').trim();

    // cupo: número entero ≥ 0
    const rawCupo = typeof obj.cupo !== 'undefined' ? obj.cupo : obj.fecha;
    const n = Number(rawCupo);
    this.cupo = Number.isFinite(n) && !Number.isNaN(n) ? Math.max(0, Math.floor(n)) : 0;

    // creador
    this.creadorId = obj.creadorId || null;
    this.creadorCorreo = obj.creadorCorreo || null;

    // horario asociado
    this.horarioId = obj.horarioId || obj.scheduleId || null;

    // lista de estudiantes inscritos (IDs)
    this.estudiantesInscritos = Array.isArray(obj.estudiantesInscritos)
      ? obj.estudiantesInscritos.map(id => String(id))
      : [];

    this.createdAt = obj.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      cupo: this.cupo,
      creadorId: this.creadorId,
      creadorCorreo: this.creadorCorreo,
      horarioId: this.horarioId,
      estudiantesInscritos: this.estudiantesInscritos,
      createdAt: this.createdAt
    };
  }
}

module.exports = Tutoria;

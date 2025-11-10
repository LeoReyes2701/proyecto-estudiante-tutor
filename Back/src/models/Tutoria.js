class Tutoria {
  constructor(obj = {}) {
    this.id = obj.id || (Date.now().toString() + '-' + Math.random().toString(36).slice(2, 9));
    this.titulo = String(obj.titulo || '').trim();
    this.descripcion = String(obj.descripcion || '').trim();

    // Nuevo atributo cupo (número)
    //  - si viene obj.cupo se usa su valor numérico
    //  - si no viene pero existe obj.fecha y parece un número, lo tomamos como fallback
    //  - en cualquier otro caso cupo = 0
    const rawCupo = typeof obj.cupo !== 'undefined' ? obj.cupo : obj.fecha;
    const n = Number(rawCupo);
    this.cupo = Number.isFinite(n) && !Number.isNaN(n) ? Math.max(0, Math.floor(n)) : 0;

    // Relation to creator
    this.creadorId = obj.creadorId || null;
    this.creadorNombre = obj.creadorNombre || null;

    // Relation to schedule (horario) used when creating the tutoria
    this.horarioId = obj.horarioId || obj.scheduleId || null;

    this.createdAt = obj.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      cupo: this.cupo,
      creadorId: this.creadorId,
      creadorNombre: this.creadorNombre,
      horarioId: this.horarioId,
      createdAt: this.createdAt
    };
  }
}

module.exports = Tutoria;
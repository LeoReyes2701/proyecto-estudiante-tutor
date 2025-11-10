// Back/src/models/Tutoria.js
class Tutoria {
  constructor(obj = {}) {
    this.id = obj.id || (Date.now().toString() + '-' + Math.random().toString(36).slice(2,9));
    this.titulo = String(obj.titulo || '').trim();
    this.descripcion = String(obj.descripcion || '').trim();
    this.fecha = String(obj.fecha || '').trim(); // ISO string or human readable — validate upstream
    // Relation to creator
    this.creadorId = obj.creadorId || null;
    this.creadorNombre = obj.creadorNombre || null;
    this.createdAt = obj.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      titulo: this.titulo,
      descripcion: this.descripcion,
      fecha: this.fecha,
      creadorId: this.creadorId,
      creadorNombre: this.creadorNombre,
      createdAt: this.createdAt
    };
  }
}

module.exports = Tutoria;

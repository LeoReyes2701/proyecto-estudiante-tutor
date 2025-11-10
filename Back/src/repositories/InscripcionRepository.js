const fs = require('fs');
const path = require('path');

class InscripcionRepository {
  constructor(filePath) {
    this.filePath = filePath || path.join(__dirname, '..', 'models', 'data', 'inscripciones.json');
  }

  _ensureFile() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.filePath)) fs.writeFileSync(this.filePath, '[]', 'utf8');
  }

  _readAll() {
    this._ensureFile();
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('[InscripcionRepository.readAll] JSON corrupto, reseteando', err);
      fs.writeFileSync(this.filePath, '[]', 'utf8');
      return [];
    }
  }

  _writeAll(arr) {
    this._ensureFile();
    fs.writeFileSync(this.filePath, JSON.stringify(arr, null, 2), 'utf8');
  }

  all() {
    return this._readAll();
  }

  save(inscripcion) {
    const all = this._readAll();
    all.push(inscripcion);
    this._writeAll(all);
    return inscripcion;
  }

  findByUser(userId) {
    const all = this._readAll();
    return all.filter(i => i.userId === userId);
  }

  findByTutoria(tutoriaId) {
    const all = this._readAll();
    return all.filter(i => i.tutoriaId === tutoriaId);
  }
}

module.exports = InscripcionRepository;

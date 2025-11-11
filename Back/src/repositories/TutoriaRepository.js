// Back/src/repositories/TutoriaRepository.js
const fs = require('fs');
const path = require('path');
const Tutoria = require('../models/Tutoria');

class TutoriaRepository {
  constructor({ storagePath } = {}) {
    this.storagePath = storagePath || path.resolve(__dirname, '..', 'models', 'data', 'tutorias.json');
    this._ensureStorage();
  }

  _ensureStorage() {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.storagePath)) fs.writeFileSync(this.storagePath, '[]', 'utf8');
  }

  _readRaw() {
    try {
      const raw = fs.readFileSync(this.storagePath, 'utf8');
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      console.error('[TutoriaRepository] read error', e);
      return [];
    }
  }

  _writeRaw(arr) {
    const tmp = `${this.storagePath}.tmp`;
    try {
      fs.writeFileSync(tmp, JSON.stringify(arr, null, 2), 'utf8');
      fs.renameSync(tmp, this.storagePath);
    } catch (e) {
      try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_) {}
      throw e;
    }
  }

  getAll() {
    const raw = this._readRaw();
    return raw.map(r => new Tutoria(r));
  }

  // Compatibilidad: leer como array plano (usado por controllers que esperan readAll)
  readAll() {
    return this._readRaw();
  }

  // alias histórico
  listAll() {
    return this._readRaw();
  }

  findById(id) {
    if (!id) return null;
    const raw = this._readRaw();
    const found = raw.find(x => String(x.id) === String(id));
    return found ? new Tutoria(found) : null;
  }

  save(tutoria) {
    const t = tutoria instanceof Tutoria ? tutoria : new Tutoria(tutoria);
    const raw = this._readRaw();

    const idx = raw.findIndex(x => String(x.id) === String(t.id));
    if (idx >= 0) {
      raw[idx] = t.toJSON();
      this._writeRaw(raw);
      return new Tutoria(raw[idx]);
    }

    raw.push(t.toJSON());
    this._writeRaw(raw);
    return t;
  }
}

module.exports = TutoriaRepository;
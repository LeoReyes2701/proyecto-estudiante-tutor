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
      console.error('[TutoriaRepository] _readRaw error', e);
      return [];
    }
  }

  _normalizeForWrite(arr) {
    // Normalize array elements to ensure they use `cupo` and do not keep `fecha`
    if (!Array.isArray(arr)) return [];
    return arr.map(item => {
      // If item is a Tutoria instance with toJSON, use it
      const plain = item && typeof item.toJSON === 'function' ? item.toJSON() : (item && typeof item === 'object' ? Object.assign({}, item) : {});

      // If cupo missing but fecha present, try to derive a numeric cupo
      if (typeof plain.cupo === 'undefined' && typeof plain.fecha !== 'undefined') {
        const n = Number(plain.fecha);
        plain.cupo = Number.isFinite(n) && !Number.isNaN(n) ? Math.max(0, Math.floor(n)) : 0;
      }

      // Ensure cupo is numeric
      if (typeof plain.cupo !== 'number') {
        const n = Number(plain.cupo);
        plain.cupo = Number.isFinite(n) && !Number.isNaN(n) ? Math.max(0, Math.floor(n)) : 0;
      }

      // Remove legacy fecha field if present
      if (typeof plain.fecha !== 'undefined') {
        delete plain.fecha;
      }

      return plain;
    });
  }

  _writeRaw(arr) {
    const tmp = `${this.storagePath}.tmp`;
    try {
      const normalized = this._normalizeForWrite(arr);
      fs.writeFileSync(tmp, JSON.stringify(normalized, null, 2), 'utf8');
      fs.renameSync(tmp, this.storagePath);
    } catch (e) {
      try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_) {}
      console.error('[TutoriaRepository] _writeRaw error', e);
      throw e;
    }
  }

  // --- Existing API (kept) ---
  getAll() {
    const raw = this._readRaw();
    return raw.map(r => new Tutoria(r));
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

  // --- Backwards-compatible aliases / async-friendly wrappers ---

  // Synchronous aliases expected by controllers
  readAll() {
    // return plain array of objects (legacy callers may expect plain objects)
    return this._readRaw();
  }

  listAll() {
    return this._readRaw();
  }

  writeAll(arr) {
    // expect arr to be array of plain objects or Tutoria
    const normalized = Array.isArray(arr) ? arr.map(x => (x && x.toJSON ? x.toJSON() : x)) : [];
    this._writeRaw(normalized);
    return true;
  }

  // Create/insert convenience methods
  create(tutoria) {
    // return the saved Tutoria instance
    return this.save(tutoria);
  }

  insert(tutoria) {
    return this.save(tutoria);
  }

  // Async variants (useful if controllers use await or future async I/O)
  async readAllAsync() {
    return this.readAll();
  }

  async writeAllAsync(arr) {
    return this.writeAll(arr);
  }

  async findByIdAsync(id) {
    return this.findById(id);
  }

  async saveAsync(tutoria) {
    return this.save(tutoria);
  }
}

module.exports = TutoriaRepository;
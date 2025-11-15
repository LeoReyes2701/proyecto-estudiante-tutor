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
    if (!Array.isArray(arr)) return [];

    return arr.map(item => {
      const plain = item && typeof item.toJSON === 'function'
        ? item.toJSON()
        : (item && typeof item === 'object' ? { ...item } : {});

      // cupo
      if (typeof plain.cupo === 'undefined' && typeof plain.fecha !== 'undefined') {
        const n = Number(plain.fecha);
        plain.cupo = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
      }
      if (typeof plain.cupo !== 'number') {
        const n = Number(plain.cupo);
        plain.cupo = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
      }

      // eliminar campo obsoleto
      if (typeof plain.fecha !== 'undefined') delete plain.fecha;

      // creadorNombre: evitar correos
      const rawNombre = plain.creadorNombre || '';
      const pareceCorreo = typeof rawNombre === 'string' && rawNombre.includes('@');
      if (pareceCorreo || !rawNombre.trim()) {
        plain.creadorNombre = 'Desconocido';
      }

      // estudiantesInscritos: normalizar a { id, fecha }
      if (Array.isArray(plain.estudiantesInscritos)) {
        plain.estudiantesInscritos = plain.estudiantesInscritos.map(e => {
          if (typeof e === 'string') return { id: e, fecha: '—' };
          const id = typeof e?.id === 'string' ? e.id : String(e?.id || '');
          const fecha = typeof e?.fecha === 'string' ? e.fecha : '—';
          return { id, fecha };
        });
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

  getAll() {
    return this._readRaw().map(r => new Tutoria(r));
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

  readAll() {
    return this._readRaw();
  }

  listAll() {
    return this._readRaw();
  }

  writeAll(arr) {
    const normalized = Array.isArray(arr)
      ? arr.map(x => (x && typeof x.toJSON === 'function' ? x.toJSON() : x))
      : [];
    this._writeRaw(normalized);
    return true;
  }

  create(tutoria) {
    return this.save(tutoria);
  }

  insert(tutoria) {
    return this.save(tutoria);
  }

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

  delete(id) {
    if (!id) return false;
    const raw = this._readRaw();
    const idx = raw.findIndex(x => String(x.id) === String(id));
    if (idx < 0) return false;
    raw.splice(idx, 1);
    this._writeRaw(raw);
    return true;
  }

  async deleteAsync(id) {
    return this.delete(id);
  }
}

module.exports = TutoriaRepository;

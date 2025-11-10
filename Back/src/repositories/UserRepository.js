// Back/src/repositories/UserRepository.js
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

class UserRepository {
  constructor({ storagePath } = {}) {
    // desde Back/src/repositories subir dos niveles hasta Back/
    this.storagePath = storagePath || path.resolve(__dirname, '..', 'models', 'data', 'usuarios.json');
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
      console.error('[UserRepository] read error', e);
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

  // Convención: getAll devuelve array de instancias User
  getAll() {
    const raw = this._readRaw();
    return raw.map(r => new User(r));
  }

  // findAll devuelve array de plain objects (útil para serializar)
  findAll() {
    return this._readRaw();
  }

  findByEmail(email) {
    if (!email) return null;
    const lower = String(email).trim().toLowerCase();
    const raw = this._readRaw();
    const found = raw.find(u => String(u.email || '').toLowerCase() === lower);
    return found ? new User(found) : null;
  }

  findById(id) {
    if (id === undefined || id === null) return null;
    const raw = this._readRaw();
    const found = raw.find(u => String(u.id) === String(id));
    return found ? new User(found) : null;
  }

  findByToken(token) {
    if (!token) return null;
    const raw = this._readRaw();
    const found = raw.find(u => u.currentToken && String(u.currentToken) === String(token));
    return found ? new User(found) : null;
  }

  existsByEmail(email) {
    return !!this.findByEmail(email);
  }

  // save acepta instancia User o plain object; devuelve instancia User
  save(user) {
    const u = user instanceof User ? user : new User(user);
    if (!u || !u.email) throw new Error('UserRepository.save requires a valid user with email');

    const raw = this._readRaw();
    const lowerEmail = String(u.email).trim().toLowerCase();

    const idxById = raw.findIndex(x => String(x.id) === String(u.id));
    if (idxById >= 0) {
      // merge para preservar campos previos que no vengan en u
      const merged = Object.assign({}, raw[idxById], u.toJSON());
      const mergedUser = new User(merged);
      raw[idxById] = mergedUser.toJSON();
      this._writeRaw(raw);
      return new User(raw[idxById]);
    }

    const idxByEmail = raw.findIndex(x => String(x.email || '').toLowerCase() === lowerEmail);
    if (idxByEmail >= 0) {
      throw new Error('Email ya registrado');
    }

    const newUser = new User(u.toJSON());
    raw.push(newUser.toJSON());
    this._writeRaw(raw);
    return newUser;
  }

  removeById(id) {
    const raw = this._readRaw();
    const idx = raw.findIndex(x => String(x.id) === String(id));
    if (idx === -1) return false;
    raw.splice(idx, 1);
    this._writeRaw(raw);
    return true;
  }

  // persiste un array de plain objects o instancias User atomicamente
  saveAll(arr) {
    if (!Array.isArray(arr)) throw new Error('saveAll requires an array');
    const normalized = arr.map(a => (a instanceof User ? a.toJSON() : new User(a).toJSON()));
    this._writeRaw(normalized);
    return true;
  }
}

module.exports = UserRepository;
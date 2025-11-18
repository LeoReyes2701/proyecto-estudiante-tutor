// Back/src/repositories/ScheduleRepository.js
const fs = require('fs');
const path = require('path');

class ScheduleRepository {
  constructor(options = {}) {
    // Ajusta la ruta si en tu repo difiere
    this.filePath = options.filePath || path.resolve(__dirname, '..', 'models', 'data', 'schedules.json');
    this._ensureStorage();
    // Mutex in-process simple (FIFO) para evitar race en un solo proceso Node
    this._locked = false;
    this._queue = [];
  }

  // Mutex helpers
  async _lock() {
    if (!this._locked) {
      this._locked = true;
      return;
    }
    return new Promise(resolve => {
      this._queue.push(resolve);
    });
  }
  _unlock() {
    const next = this._queue.shift();
    if (next) next();
    else this._locked = false;
  }

  _ensureStorage() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.filePath)) fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf8');
  }

  // Lectura síncrona robusta que siempre devuelve array
  _readAllSyncSafe() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('[ScheduleRepository._readAllSyncSafe] parse/read error, returning []', e);
      return [];
    }
  }

  // API pública de lectura
  async readAll() {
    // Para simplicidad devolvemos la lectura síncrona segura
    return this._readAllSyncSafe();
  }

  async findById(id) {
    if (!id) return null;
    const all = await this.readAll();
    if (!Array.isArray(all)) return null;
    return all.find(x => String(x.id) === String(id)) || null;
  }

  async findByTutorId(tutorId) {
    if (!tutorId) return [];
    const all = await this.readAll();
    if (!Array.isArray(all)) return [];
    return all.filter(x => String(x.tutorId || x.userId) === String(tutorId));
  }

  async findByUserId(userId) {
    if (!userId) return [];
    const all = await this.readAll();
    if (!Array.isArray(all)) return [];
    return all.filter(x => String(x.userId || x.tutorId) === String(userId));
  }

  // normalizador de clave de slots para detectar duplicados exactos
  _slotsKey(arr = []) {
    return (arr || [])
      .map(s => `${String(s.day || '').toLowerCase()}|${s.horaInicio || s.start || ''}|${s.horaFin || s.end || ''}`)
      .sort()
      .join('||');
  }

  // Escritura atómica: write temp + rename
  _writeAllAtomicSync(allArray) {
    const tmpName = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    const data = JSON.stringify(allArray, null, 2);
    try {
      fs.writeFileSync(tmpName, data, 'utf8');
      fs.renameSync(tmpName, this.filePath);
    } catch (e) {
      console.error('[ScheduleRepository._writeAllAtomicSync] write error', e);
      try { if (fs.existsSync(tmpName)) fs.unlinkSync(tmpName); } catch (e2) {}
      throw e;
    }
  }

  // save atómico e idempotente
  async save(scheduleObj) {
    if (!scheduleObj || typeof scheduleObj !== 'object') throw new Error('scheduleObj required');

    await this._lock();
    try {
      const all = this._readAllSyncSafe();

      const tutorId = scheduleObj.tutorId || scheduleObj.userId || null;

      // detectar duplicado exacto (mismo tutor + misma key de slots)
      if (tutorId) {
        const existing = (Array.isArray(all) ? all : []).find(e =>
          String(e.tutorId || e.userId) === String(tutorId) &&
          this._slotsKey(e.slots) === this._slotsKey(scheduleObj.slots)
        );
        if (existing) {
          console.log('[ScheduleRepository.save] duplicate detected — returning existing id', existing.id);
          return existing;
        }
      }

      // actualizar por id si viene
      const incomingId = scheduleObj.id || scheduleObj._id || null;
      if (incomingId) {
        const idx = (all || []).findIndex(x => String(x.id) === String(incomingId));
        if (idx >= 0) {
          all[idx] = Object.assign({}, all[idx], scheduleObj, { id: String(all[idx].id) });
          this._writeAllAtomicSync(all);
          console.log('[ScheduleRepository.save] updated id', all[idx].id);
          return all[idx];
        }
      }

      // crear nuevo id garantizado
      const newId = String(scheduleObj.id || `${Date.now().toString()}-${Math.random().toString(36).slice(2,9)}`);
      const toSave = Object.assign({}, scheduleObj, { id: newId });
      (all || []).push(toSave);

      this._writeAllAtomicSync(all);
      console.log('[ScheduleRepository.save] inserted id', newId);
      return toSave;
    } finally {
      this._unlock();
    }
  }

  // helper robusto: find by tutor + slots (devuelve existente o null)
  async findByTutorAndSlots(tutorId, slots) {
    if (!tutorId) return null;

    // intentar readAll de forma segura y asegurar array
    let all;
    try {
      if (typeof this.readAll === 'function') {
        const maybe = await this.readAll();
        all = Array.isArray(maybe) ? maybe : this._readAllSyncSafe();
      } else {
        all = this._readAllSyncSafe();
      }
    } catch (e) {
      all = this._readAllSyncSafe();
    }

    if (!Array.isArray(all)) {
      return null;
    }

    const key = this._slotsKey(slots);
    return all.find(e =>
      String(e.tutorId || e.userId) === String(tutorId) &&
      this._slotsKey(e.slots) === key
    ) || null;
  }

  // delete atómico por id
  async delete(id) {
    if (!id) throw new Error('id required for delete');

    await this._lock();
    try {
      const all = this._readAllSyncSafe();
      const idx = (all || []).findIndex(x => String(x.id) === String(id));
      if (idx < 0) {
        console.log('[ScheduleRepository.delete] id not found', id);
        return false; // no encontrado
      }
      all.splice(idx, 1);
      this._writeAllAtomicSync(all);
      console.log('[ScheduleRepository.delete] deleted id', id);
      return true;
    } finally {
      this._unlock();
    }
  }
}

module.exports = ScheduleRepository;
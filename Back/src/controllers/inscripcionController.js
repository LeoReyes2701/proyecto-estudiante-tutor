const Inscripcion = require('../models/inscripcion');

class InscripcionController {
  constructor({ inscripcionRepository, userRepository, tutoriaRepository } = {}) {
    if (!inscripcionRepository) throw new Error('inscripcionRepository requerido');

    this.inscripcionRepository = inscripcionRepository;
    this.userRepository = userRepository;
    this.tutoriaRepository = tutoriaRepository;

    this.list = this.list.bind(this);
    this.create = this.create.bind(this);
    this.getByUserId = this.getByUserId.bind(this);
    this.getById = this.getById.bind(this);
    this.delete = this.delete.bind(this);
  }

  // Helper que soporta métodos sync o async en repositorios
  async _callMaybeAsync(fn, ...args) {
    if (!fn) return null;
    const r = fn.apply(this.inscripcionRepository, args);
    return r && typeof r.then === 'function' ? await r : r;
  }

  async list(req, res) {
    try {
      const all = await this._callMaybeAsync(this.inscripcionRepository.all || this.inscripcionRepository._readAll);
      return res.json(Array.isArray(all) ? all : []);
    } catch (err) {
      console.error('[InscripcionController.list] error', err);
      return res.status(500).json({ error: 'Error al leer inscripciones' });
    }
  }

  async getByUserId(req, res) {
    try {
      const userId = req.params.userId;
      const data = await this._callMaybeAsync(this.inscripcionRepository.findByUser, userId);
      return res.json(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[InscripcionController.getByUserId] error', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  async getById(req, res) {
    try {
      const id = req.params.id;
      const all = await this._callMaybeAsync(this.inscripcionRepository.all || this.inscripcionRepository._readAll);
      const item = (Array.isArray(all) ? all : []).find(i => String(i.id || i._id) === String(id));
      if (!item) return res.status(404).json({ error: 'No encontrado' });
      return res.json(item);
    } catch (err) {
      console.error('[InscripcionController.getById] error', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  async create(req, res) {
    try {
      console.log('[inscripciones.create] body:', req.body, 'headers:', req.headers);

      const { userId, tutoriaIds } = req.body || {};
      if (!userId || !Array.isArray(tutoriaIds) || tutoriaIds.length === 0) {
        return res.status(400).json({ error: 'Faltan datos para la inscripción' });
      }

      // Si existe userRepository, verificar usuario (opcional según tu flujo)
      if (this.userRepository && typeof this.userRepository.findById === 'function') {
        const usuario = await this._callMaybeAsync(this.userRepository.findById, userId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const inscripcionesPrevias = (await this._callMaybeAsync(this.inscripcionRepository.findByUser, userId)) || [];
      const nuevas = [];

      for (const tutoriaId of tutoriaIds) {
        // Evitar duplicados por usuario+tutoria
        const yaInscrito = inscripcionesPrevias.some(i => String(i.tutoriaId) === String(tutoriaId));
        if (yaInscrito) continue;

        // Validar existencia de la tutoria si hay repositorio
        if (this.tutoriaRepository && typeof this.tutoriaRepository.findById === 'function') {
          const tutoria = await this._callMaybeAsync(this.tutoriaRepository.findById, tutoriaId);
          if (!tutoria) continue; // ignorar tutoría inexistente
        }

        const nueva = new Inscripcion({ userId, tutoriaId });
        const saved = await this._callMaybeAsync(this.inscripcionRepository.save || this.inscripcionRepository.save, nueva);
        nuevas.push(saved || (nueva.toJSON ? nueva.toJSON() : nueva));
      }

      if (nuevas.length === 0) {
        return res.status(400).json({ error: 'No se realizaron nuevas inscripciones' });
      }

      return res.status(201).json({ message: 'Inscripciones realizadas', nuevas });
    } catch (err) {
      console.error('[InscripcionController.create] error', err);
      return res.status(500).json({ error: 'Error interno al crear inscripción' });
    }
  }

  async delete(req, res) {
    try {
      const id = req.params.id;
      // Usar métodos internos del repo si existen
      if (typeof this.inscripcionRepository._readAll !== 'function' || typeof this.inscripcionRepository._writeAll !== 'function') {
        return res.status(500).json({ error: 'Repositorio no soporta eliminación' });
      }
      const all = this.inscripcionRepository._readAll();
      const idx = all.findIndex(i => String(i.id || i._id) === String(id));
      if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
      all.splice(idx, 1);
      this.inscripcionRepository._writeAll(all);
      return res.json({ message: 'Inscripción eliminada' });
    } catch (err) {
      console.error('[InscripcionController.delete] error', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }
}

module.exports = InscripcionController;

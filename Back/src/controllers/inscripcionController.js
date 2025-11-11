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
  async _callMaybeAsync(repo, fn, ...args) {
    if (!fn || !repo) return null;
    const r = fn.apply(repo, args);
    return r && typeof r.then === 'function' ? await r : r;
  }

  async list(req, res) {
    try {
      const all = await this._callMaybeAsync(this.inscripcionRepository, this.inscripcionRepository.all || this.inscripcionRepository._readAll);
      return res.json(Array.isArray(all) ? all : []);
    } catch (err) {
      console.error('[InscripcionController.list] error', err);
      return res.status(500).json({ error: 'Error al leer inscripciones' });
    }
  }

  async getByUserId(req, res) {
    try {
      const userId = req.params.userId;
      const data = await this._callMaybeAsync(this.inscripcionRepository, this.inscripcionRepository.findByUser, userId);
      return res.json(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[InscripcionController.getByUserId] error', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  async getById(req, res) {
    try {
      const id = req.params.id;
      const all = await this._callMaybeAsync(this.inscripcionRepository, this.inscripcionRepository.all || this.inscripcionRepository._readAll);
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
      const { userId, tutoriaIds, inscripciones } = req.body || {};
      
      // Soporte para ambos formatos: legacy (tutoriaIds) y nuevo (inscripciones con horarioId)
      let itemsToProcess = [];
      
      if (inscripciones && Array.isArray(inscripciones)) {
        // Formato nuevo: [{ tutoriaId, horarioId }, ...]
        itemsToProcess = inscripciones.map(item => ({
          tutoriaId: item.tutoriaId,
          horarioId: item.horarioId
        }));
      } else if (tutoriaIds && Array.isArray(tutoriaIds)) {
        // Formato legacy: [tutoriaId1, tutoriaId2, ...]
        itemsToProcess = tutoriaIds.map(tutoriaId => ({
          tutoriaId: tutoriaId,
          horarioId: null
        }));
      }

      if (!userId || itemsToProcess.length === 0) {
        return res.status(400).json({ error: 'Faltan datos para la inscripción' });
      }

      // Si existe userRepository, verificar usuario (opcional según tu flujo)
      if (this.userRepository && typeof this.userRepository.findById === 'function') {
        const usuario = await this._callMaybeAsync(this.userRepository, this.userRepository.findById, userId);
        if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const inscripcionesPrevias = (await this._callMaybeAsync(this.inscripcionRepository, this.inscripcionRepository.findByUser, userId)) || [];
  // Horarios ya ocupados por inscripciones previas del usuario
  const existingHorarioIds = new Set(inscripcionesPrevias.filter(i => i.horarioId).map(i => String(i.horarioId)));
      

      // Validar que no haya conflicto de horarios entre las nuevas solicitudes y las previas
      const newHorarioIds = new Set();

      for (const it of itemsToProcess) {
        if (it.horarioId) {
          const hid = String(it.horarioId);
          if (existingHorarioIds.has(hid)) {
            return res.status(400).json({ error: `Conflicto: ya tienes una inscripción en el horario ${hid}` });
          }
          if (newHorarioIds.has(hid)) {
            return res.status(400).json({ error: `Conflicto: intentas inscribirte en varias tutorías con el mismo horario ${hid}` });
          }
          newHorarioIds.add(hid);
        }
      }

      const nuevas = [];

      for (const item of itemsToProcess) {
        const { tutoriaId, horarioId } = item;
        
        // Evitar duplicados por usuario+tutoria
        const yaInscrito = inscripcionesPrevias.some(i => String(i.tutoriaId) === String(tutoriaId));
        if (yaInscrito) continue;

        // Validar existencia de la tutoria si hay repositorio
        if (this.tutoriaRepository && typeof this.tutoriaRepository.findById === 'function') {
          const tutoria = await this._callMaybeAsync(this.tutoriaRepository, this.tutoriaRepository.findById, tutoriaId);
          if (!tutoria) continue; // ignorar tutoría inexistente
        }

        const inscripcionData = { userId, tutoriaId };
        if (horarioId) {
          inscripcionData.horarioId = horarioId;
        }

        const nueva = new Inscripcion(inscripcionData);
        const saved = await this._callMaybeAsync(this.inscripcionRepository, this.inscripcionRepository.save, nueva);
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

// Back/src/controllers/tutoriaController.js
// Exporta una clase que puede instanciarse con new TutoriaController({ tutoriaRepository, userRepository, scheduleRepository })

const Tutoria = require('../models/Tutoria');

class TutoriaController {
  constructor(options = {}) {
    if (!options.tutoriaRepository) throw new Error('TutoriaController requires tutoriaRepository');
    this.tutoriaRepository = options.tutoriaRepository;
    this.userRepository = options.userRepository || null;
    this.scheduleRepository = options.scheduleRepository || null;

    // bind methods si se usan como handlers sin bind
    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
  }

  // POST /tutorias
  async create(req, res) {
    try {
      // req.user debería venir del authMiddleware (cookie-based)
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'No autorizado' });
      }

      const { titulo, descripcion, cupo, slots } = req.body || {};

      if (!titulo || String(titulo).trim() === '') {
        return res.status(400).json({ error: 'Título requerido' });
      }

      // Determinar horarioId: preferir id si se envía. Si no, intentar resolver con scheduleRepository.
      let horarioId = null;
      if (Array.isArray(slots) && slots.length > 0) {
        const s0 = slots[0];
        horarioId = s0.id || s0.horarioId || s0.scheduleId || null;

        // si no existe id pero tenemos datos de horario (day/start/end) intentamos buscar uno del tutor
        if (!horarioId && this.scheduleRepository && (s0.day || s0.horaInicio || s0.start)) {
          try {
            // búsqueda conservadora: buscar schedules del tutor y comparar por day+start+end
            const allSchedules = await (this.scheduleRepository.readAll ? this.scheduleRepository.readAll() : this.scheduleRepository.listAll());
            const match = (Array.isArray(allSchedules) ? allSchedules : []).find(sc => {
              const sd = (sc.day || sc.dia || (sc.slots && sc.slots[0] && sc.slots[0].day) || '').toString();
              const ss = (sc.start || sc.horaInicio || (sc.slots && sc.slots[0] && sc.slots[0].horaInicio) || '').toString();
              const se = (sc.end || sc.horaFin || (sc.slots && sc.slots[0] && sc.slots[0].horaFin) || '').toString();
              const qd = (s0.day || s0.dia || '').toString();
              const qs = (s0.start || s0.horaInicio || '').toString();
              const qe = (s0.end || s0.horaFin || '').toString();
              return sd === qd && ss === qs && se === qe;
            });
            if (match) horarioId = match.id || match._id || null;
          } catch (e) {
            console.warn('[tutoriaController] scheduleRepository search failed', e);
          }
        }
      }

      const newTutoria = new Tutoria({
        titulo: titulo,
        descripcion: descripcion || '',
        creadorId: req.user.id,
        creadorNombre: req.user.email || req.user.nombre || null,
        horarioId: horarioId || null,
        cupo: typeof cupo !== 'undefined' ? Number(cupo) : undefined
      });

      // Persistir: si el repo expone save/create/insert, intentamos varios nombres
      const repo = this.tutoriaRepository;
      let saved = null;
      if (repo.save && typeof repo.save === 'function') {
        saved = await repo.save(newTutoria.toJSON ? newTutoria.toJSON() : newTutoria);
      } else if (repo.create && typeof repo.create === 'function') {
        saved = await repo.create(newTutoria.toJSON ? newTutoria.toJSON() : newTutoria);
      } else if (repo.insert && typeof repo.insert === 'function') {
        saved = await repo.insert(newTutoria.toJSON ? newTutoria.toJSON() : newTutoria);
      } else {
        // fallback: try write to readAll + push + persist methods if available
        if (repo.readAll && repo.writeAll) {
          const all = await repo.readAll();
          const arr = Array.isArray(all) ? all : [];
          const toSave = newTutoria.toJSON ? newTutoria.toJSON() : newTutoria;
          arr.push(toSave);
          await repo.writeAll(arr);
          saved = toSave;
        } else {
          throw new Error('TutoriaRepository does not implement save/create/insert');
        }
      }

      return res.status(201).json({ message: 'Tutoría creada', tutoria: saved });
    } catch (err) {
      console.error('[tutoriaController.create] error', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  // GET /tutorias
  async list(req, res) {
    try {
      const repo = this.tutoriaRepository;
      const all = await (repo.readAll ? repo.readAll() : repo.listAll ? repo.listAll() : []);
      return res.json(Array.isArray(all) ? all : []);
    } catch (err) {
      console.error('[tutoriaController.list] error', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  // GET /tutorias/:id
  async getById(req, res) {
    try {
      const id = req.params.id;
      const repo = this.tutoriaRepository;
      const item = (repo.findById && typeof repo.findById === 'function') ? await repo.findById(id) : null;
      if (!item) return res.status(404).json({ error: 'No encontrado' });
      return res.json(item);
    } catch (err) {
      console.error('[tutoriaController.getById] error', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }
}

module.exports = TutoriaController;
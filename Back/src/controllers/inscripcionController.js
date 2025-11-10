const Inscripcion = require('../models/inscripcion');

class InscripcionController {
  constructor({ inscripcionRepository, userRepository, tutoriaRepository }) {
    this.inscripcionRepository = inscripcionRepository;
    this.userRepository = userRepository;
    this.tutoriaRepository = tutoriaRepository;

    this.list = this.list.bind(this);
    this.create = this.create.bind(this);
  }

  // GET /inscripciones
  async list(req, res) {
    try {
      const data = this.inscripcionRepository.all();
      return res.json(data);
    } catch (err) {
      console.error('[InscripcionController.list] error', err);
      return res.status(500).json({ error: 'Error al leer inscripciones' });
    }
  }

  // POST /inscripciones
  async create(req, res) {
    try {
      const { userId, tutoriaIds } = req.body;

      if (!userId || !Array.isArray(tutoriaIds))
        return res.status(400).json({ error: 'Faltan datos para la inscripción' });

      const usuario = this.userRepository.findById
        ? this.userRepository.findById(userId)
        : null;
      if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

      const inscripcionesPrevias = this.inscripcionRepository.findByUser(userId);
      const nuevas = [];

      for (const tutoriaId of tutoriaIds) {
        const yaInscrito = inscripcionesPrevias.some(i => i.tutoriaId === tutoriaId);
        if (yaInscrito) continue;

        const tutoria = this.tutoriaRepository.findById(tutoriaId);
        if (!tutoria) continue;

        const inscripcionesEnTutoria = this.inscripcionRepository.findByTutoria(tutoriaId);
        if (inscripcionesEnTutoria.length >= (tutoria.cupos || 0)) continue;

        const nueva = new Inscripcion({ userId, tutoriaId });
        this.inscripcionRepository.save(nueva);
        nuevas.push(nueva);
      }

      if (nuevas.length === 0)
        return res.status(400).json({ message: 'No se realizaron nuevas inscripciones' });

      return res.status(201).json({ message: 'Inscripciones realizadas', nuevas });
    } catch (err) {
      console.error('[InscripcionController.create] error', err);
      return res.status(500).json({ error: 'Error interno al crear inscripción' });
    }
  }
}

module.exports = InscripcionController;

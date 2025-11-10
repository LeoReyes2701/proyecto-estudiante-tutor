// Back/src/controllers/tutoriacontroller.js
const Tutoria = require('../models/Tutoria');

class TutoriaController {
  constructor({ tutoriaRepository, userRepository } = {}) {
    if (!tutoriaRepository) throw new Error('TutoriaController requires tutoriaRepository');
    if (!userRepository) throw new Error('TutoriaController requires userRepository');
    this.tutoriaRepository = tutoriaRepository;
    this.userRepository = userRepository;

    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.getById = this.getById.bind(this);
  }

  // POST /tutorias  (protected; req.user.sub contains userId)
  async create(req, res) {
    try {
      const userId = req.user && req.user.sub;
      if (!userId) return res.status(401).json({ error: 'No autorizado' });

      const raw = req.body || {};
      const titulo = raw.titulo ? String(raw.titulo).trim() : '';
      const descripcion = raw.descripcion ? String(raw.descripcion).trim() : '';
      const fecha = raw.fecha ? String(raw.fecha).trim() : '';

      if (!titulo || !descripcion || !fecha) return res.status(400).json({ error: 'Faltan campos obligatorios' });

      // Verificar que usuario existe
      const user = await Promise.resolve(this.userRepository.findById(userId));
      if (!user) return res.status(404).json({ error: 'Usuario creador no encontrado' });

      const id = Date.now().toString() + '-' + Math.random().toString(36).slice(2, 9);
      const tutoria = new Tutoria({
        id,
        titulo,
        descripcion,
        fecha,
        creadorId: user.id,
        creadorNombre: `${user.nombre} ${user.apellido}`,
        createdAt: new Date().toISOString()
      });

      await Promise.resolve(this.tutoriaRepository.save(tutoria));

      return res.status(201).json({ ok: true, tutoria: tutoria.toJSON() });
    } catch (err) {
      console.error('[TutoriaController.create]', err);
      return res.status(500).json({ error: 'Error al crear tutoría' });
    }
  }

  // GET /tutorias
  async list(req, res) {
    try {
      const all = await Promise.resolve(this.tutoriaRepository.getAll());
      return res.json({ ok: true, data: all.map(t => t.toJSON()) });
    } catch (err) {
      console.error('[TutoriaController.list]', err);
      return res.status(500).json({ error: 'Error al listar tutorías' });
    }
  }

  // GET /tutorias/:id
  async getById(req, res) {
    try {
      const id = req.params.id;
      const t = await Promise.resolve(this.tutoriaRepository.findById(id));
      if (!t) return res.status(404).json({ error: 'Tutoría no encontrada' });
      return res.json({ ok: true, data: t.toJSON() });
    } catch (err) {
      console.error('[TutoriaController.getById]', err);
      return res.status(500).json({ error: 'Error al obtener tutoría' });
    }
  }
}

module.exports = TutoriaController;
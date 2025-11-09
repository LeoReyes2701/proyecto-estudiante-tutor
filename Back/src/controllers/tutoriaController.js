const Tutoria = require('../models/tutoria');

class TutoriaController {
  constructor(repository) {
    if (!repository) throw new Error('TutoriaController requires a repository instance');
    this.repo = repository;

    // bind para usar métodos directamente como handlers
    this.createTutoria = this.createTutoria.bind(this);
    this.getTutorias = this.getTutorias.bind(this);
    this.getTutoriaById = this.getTutoriaById.bind(this);
    this.deleteTutoria = this.deleteTutoria.bind(this);
  }

  createTutoria(req, res) {
    try {
      const tutoria = new Tutoria(req.body);
      const valid = tutoria.validate();
      if (!valid.ok) {
        return res.status(400).json({ error: 'Datos inválidos', field: valid.field, message: valid.message });
      }
      const saved = this.repo.save(tutoria.toJSON());
      return res.status(201).json({ message: 'Tutoría creada exitosamente', data: saved });
    } catch (err) {
      console.error('createTutoria error:', err);
      return res.status(500).json({ error: 'Error interno al crear tutoría' });
    }
  }

  getTutorias(req, res) {
    try {
      const all = this.repo.all();
      return res.status(200).json(all);
    } catch (err) {
      console.error('getTutorias error:', err);
      return res.status(500).json({ error: 'Error interno al obtener tutorías' });
    }
  }

  getTutoriaById(req, res) {
    try {
      const { id } = req.params;
      const found = this.repo.findById(id);
      if (!found) return res.status(404).json({ error: 'Tutoría no encontrada' });
      return res.status(200).json(found);
    } catch (err) {
      console.error('getTutoriaById error:', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  deleteTutoria(req, res) {
    try {
      const { id } = req.params;
      const removed = this.repo.removeById(id);
      if (!removed) return res.status(404).json({ error: 'Tutoría no encontrada' });
      return res.status(200).json({ message: 'Tutoría eliminada' });
    } catch (err) {
      console.error('deleteTutoria error:', err);
      return res.status(500).json({ error: 'Error interno al eliminar' });
    }
  }
}

module.exports = TutoriaController;

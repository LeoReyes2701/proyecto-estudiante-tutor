// Back/src/controllers/inscripcionController.js
const InscripcionRepository = require('../repositories/InscripcionRepository');

function makeController({ inscripcionRepository } = {}) {
  const repo = inscripcionRepository || new InscripcionRepository();

  async function inscribir(req, res) {
    try {
      // Preferir usuario autenticado (authMiddleware debe setear req.user)
      const actor = req.user || null;
      if (!actor) return res.status(401).json({ error: 'No autenticado' });

      // Solo estudiantes pueden inscribirse
      if (String((actor.rol || '')).toLowerCase() !== 'estudiante') {
        return res.status(403).json({ error: 'Solo estudiantes pueden inscribirse' });
      }

      // tomar tutoriaId desde body (o query fallback)
      const { tutoriaId } = req.body || {};
      const estudianteId = actor.id || req.body.estudianteId;
      if (!tutoriaId || !estudianteId) {
        return res.status(400).json({ error: 'tutoriaId (body) y sesión válida son requeridos' });
      }

      const result = await repo.inscribirEstudiante(tutoriaId, estudianteId);

      if (result.status === 'not_found') return res.status(404).json({ error: result.message });
      if (result.status === 'already') return res.status(200).json({ message: result.message, tutoria: result.tutoria });
      if (result.status === 'full') return res.status(409).json({ error: result.message, tutoria: result.tutoria });
      if (result.status === 'ok') return res.status(201).json({ message: result.message, tutoria: result.tutoria });

      // fallback genérico
      return res.status(500).json({ error: 'Resultado de inscripción inesperado' });
    } catch (err) {
      console.error('[inscripcionController.inscribir] error', err);
      return res.status(500).json({ error: 'Error interno al procesar la inscripción' });
    }
  }

  return { inscribir };
}

// Soportar export directo del objeto o fábrica
module.exports = makeController;


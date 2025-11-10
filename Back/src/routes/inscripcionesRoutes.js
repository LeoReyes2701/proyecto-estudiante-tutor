const express = require('express');

module.exports = function inscripcionesRoutesFactory({ inscripcionController }) {
  if (!inscripcionController) throw new Error('inscripcionController requerido');

  const router = express.Router();

  // Obtener todas las inscripciones
  router.get('/', inscripcionController.list);

  // 🔹 Nueva ruta: obtener inscripciones del usuario actual (por cookie)
  router.get('/me', (req, res) => {
    try {
      const cookieHeader = req.headers.cookie || '';
      const usuarioCookie = cookieHeader.split(';').find(c => c.trim().startsWith('usuario='));
      if (!usuarioCookie) return res.status(401).json({ error: 'No autenticado' });

      const user = JSON.parse(Buffer.from(usuarioCookie.split('=')[1], 'base64').toString('utf8'));
      if (!user || !user.id) return res.status(400).json({ error: 'Cookie inválida' });

      const inscripciones = inscripcionController.inscripcionRepository.findByUser(user.id);
      return res.json(inscripciones);
    } catch (err) {
      console.error('[GET /inscripciones/me]', err);
      return res.status(500).json({ error: 'Error interno' });
    }
  });

  // Obtener inscripciones por usuario (usando :userId)
  router.get('/usuario/:userId', inscripcionController.getByUserId);

  // Obtener una inscripción específica por ID
  router.get('/:id', inscripcionController.getById);

  // Crear nueva inscripción (inscribirse en una tutoría)
  router.post('/', inscripcionController.create);

  // Eliminar una inscripción (cancelar inscripción)
  router.delete('/:id', inscripcionController.delete);

  return router;
};


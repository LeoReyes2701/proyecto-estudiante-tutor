const express = require('express');

module.exports = function inscripcionesRoutesFactory({ inscripcionController }) {
  if (!inscripcionController) throw new Error('inscripcionController requerido');

  const router = express.Router();

  // Obtener todas las inscripciones
  router.get('/', inscripcionController.list);

  //  Obtener inscripciones por usuario
  router.get('/usuario/:userId', inscripcionController.getByUserId);

  //  Obtener una inscripción específica por ID
  router.get('/:id', inscripcionController.getById);

  //  Crear nueva inscripción (inscribirse en una tutoría)
  router.post('/', inscripcionController.create);

  //  Eliminar una inscripción (cancelar inscripción)
  router.delete('/:id', inscripcionController.delete);

  return router;
};

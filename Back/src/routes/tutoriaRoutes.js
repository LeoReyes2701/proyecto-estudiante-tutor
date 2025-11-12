<<<<<<< HEAD
// Back/src/routes/tutoriaRoutes.js
// exporta una fábrica: tutoriaRoutesFactory({ tutoriaController, authMiddleware })

const express = require('express');

=======
const express = require('express');

function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

>>>>>>> origin/mauricio
module.exports = function tutoriaRoutesFactory({ tutoriaController, authMiddleware } = {}) {
  if (!tutoriaController) throw new Error('tutoriaRoutesFactory requires tutoriaController');

  const router = express.Router();

<<<<<<< HEAD
  // Listar tutorías públicas
  router.get('/', (req, res, next) => {
    return tutoriaController.list(req, res, next);
  });

  // Obtener por id
  router.get('/:id', (req, res, next) => {
    return tutoriaController.getById(req, res, next);
  });

  // Crear tutoría (protegida)
  if (typeof authMiddleware === 'function') {
    router.post('/', authMiddleware, (req, res, next) => {
      return tutoriaController.create(req, res, next);
    });
  } else {
    // si no se pasa middleware, dejar la ruta igualmente pero con warning (solo dev)
    console.warn('[tutoriaRoutes] authMiddleware not provided; POST /tutorias will be unprotected');
    router.post('/', (req, res, next) => {
      return tutoriaController.create(req, res, next);
    });
=======
  // Listar tutorías públicas (delegado al controlador; soporta ?mine=1)
  router.get('/', asyncHandler((req, res, next) => tutoriaController.list(req, res, next)));

  // Obtener por id
  router.get('/:id', asyncHandler((req, res, next) => tutoriaController.getById(req, res, next)));

  // Crear tutoría (protegida)
  if (typeof authMiddleware === 'function') {
    router.post('/', authMiddleware, asyncHandler((req, res, next) => tutoriaController.create(req, res, next)));
  } else {
    console.warn('[tutoriaRoutes] authMiddleware not provided; POST /tutorias will be unprotected');
    router.post('/', asyncHandler((req, res, next) => tutoriaController.create(req, res, next)));
>>>>>>> origin/mauricio
  }

  return router;
};
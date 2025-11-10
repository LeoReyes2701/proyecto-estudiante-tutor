const express = require('express');

function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = function tutoriaRoutesFactory({ tutoriaController, authMiddleware } = {}) {
  if (!tutoriaController) throw new Error('tutoriaRoutesFactory requires tutoriaController');

  const router = express.Router();

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
  }

  return router;
};
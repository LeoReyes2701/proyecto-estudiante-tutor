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
    router.post('/', asyncHandler((req, res, next) => tutoriaController.create(req, res, next)));
  }

  // Actualizar tutoría (protegida)
  if (typeof authMiddleware === 'function') {
    router.put('/:id', authMiddleware, asyncHandler((req, res, next) => tutoriaController.update(req, res, next)));
  } else {
    router.put('/:id', asyncHandler((req, res, next) => tutoriaController.update(req, res, next)));
  }

  // Eliminar tutoría (protegida)
  if (typeof authMiddleware === 'function') {
    router.delete('/:id', authMiddleware, asyncHandler((req, res, next) => tutoriaController.delete(req, res, next)));
  } else {
    router.delete('/:id', asyncHandler((req, res, next) => tutoriaController.delete(req, res, next)));
  }

  return router;
};
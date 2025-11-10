// Back/src/routes/tutoriaRoutes.js
const express = require('express');

module.exports = function ({ tutoriaController, authMiddleware } = {}) {
  if (!tutoriaController) throw new Error('tutoriaRoutes requires tutoriaController');
  if (!authMiddleware) throw new Error('tutoriaRoutes requires authMiddleware');

  const router = express.Router();

  // Create tutoria (protected)
  router.post('/', authMiddleware, (req, res, next) => tutoriaController.create(req, res, next));

  // List all tutorias (public read)
  router.get('/', (req, res, next) => tutoriaController.list(req, res, next));

  // Get by id
  router.get('/:id', (req, res, next) => tutoriaController.getById(req, res, next));

  return router;
};
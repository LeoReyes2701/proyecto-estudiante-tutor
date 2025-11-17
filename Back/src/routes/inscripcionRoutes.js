// Back/src/routes/inscripcionRoutes.js
const express = require('express');

// wrapper async
function wrap(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/*
  factory: module.exports = function({ inscripcionController, authMiddleware } = {}) { return router; }
  También soporta export directo.
*/
module.exports = function ({ inscripcionController: injectedController, authMiddleware } = {}) {
  const router = express.Router();

  // Resolver controller
  let controller = injectedController;
  if (!controller) {
    try {
      const mod = require('../controllers/inscripcionController');
      controller = typeof mod === 'function' ? (mod({}) || mod) : mod;
    } catch (err) {
      controller = null;
    }
  }

  // POST / -> inscribir (protegido por authMiddleware si se inyecta)
  const handlers = [
    wrap(async (req, res) => {
      if (!controller || typeof controller.inscribir !== 'function') {
        return res.status(500).json({ error: 'Inscripcion controller no disponible' });
      }
      return controller.inscribir(req, res);
    })
  ];

  if (authMiddleware) handlers.unshift(authMiddleware);

  router.post('/', handlers);

  // DELETE / -> eliminar (protegido por authMiddleware si se inyecta)
  const deleteHandlers = [
    wrap(async (req, res) => {
      if (!controller || typeof controller.eliminar !== 'function') {
        return res.status(500).json({ error: 'Inscripcion controller no disponible' });
      }
      return controller.eliminar(req, res);
    })
  ];

  if (authMiddleware) deleteHandlers.unshift(authMiddleware);

  router.delete('/', deleteHandlers);

  return router;
};

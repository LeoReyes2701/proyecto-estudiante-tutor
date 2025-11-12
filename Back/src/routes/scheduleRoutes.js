// Back/src/routes/scheduleRoutes.js
const express = require('express');

<<<<<<< HEAD
router.post("/", scheduleController.createSchedule);

router.get("/mine", scheduleController.getMySchedules);
=======
// Helper: wrapper async para evitar try/catch repetido
function wrap(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/*
  Exporta una fábrica: module.exports = function({ scheduleController, authMiddleware } = {}) { return router; }
>>>>>>> origin/mauricio

  Esto permite que app.js haga:
    schedulesRouter = require('./routes/scheduleRoutes')({ scheduleController, authMiddleware });
  o
    schedulesRouter = require('./routes/scheduleRoutes')();
*/
module.exports = function ({ scheduleController: injectedController, authMiddleware } = {}) {
  const router = express.Router();

  // Resolver controller: puede ser un objeto con métodos o una fábrica que devuelve el objeto
  let controller = injectedController;
  if (!controller) {
    try {
      const mod = require('../controllers/scheduleController');
      // si el controller es una función (fábrica), intentar invocarla sin args
      controller = typeof mod === 'function' ? (mod({}) || mod) : mod;
    } catch (err) {
      // dejar controller undefined; handlers comprobarán y devolverán 500 si no existe
      controller = null;
    }
  }

  // Rutas públicas / API
  router.get(
    '/',
    wrap(async (req, res) => {
      if (!controller || typeof controller.getAll !== 'function') {
        return res.status(500).json({ error: 'Schedule controller not available' });
      }
      return controller.getAll(req, res);
    })
  );

  // obtener por id (id de schedule)
  router.get(
    '/:id',
    wrap(async (req, res) => {
      if (!controller || typeof controller.getById === 'function') {
        // si existe método getById, usarlo; si no, caer a getByTutorId si aplica
        return controller.getById ? controller.getById(req, res) : controller.getByTutorId ? controller.getByTutorId(req, res) : res.status(404).json({ error: 'Not implemented' });
      }
      return controller.getById(req, res);
    })
  );

  // obtener horarios por tutorId (endpoint opcional, útil)
  router.get(
    '/tutor/:tutorId',
    wrap(async (req, res) => {
      if (!controller || typeof controller.getByTutorId !== 'function') {
        return res.status(500).json({ error: 'getByTutorId not available' });
      }
      return controller.getByTutorId(req, res);
    })
  );

  // obtener por userId (opcional)
  router.get(
    '/user/:userId',
    wrap(async (req, res) => {
      if (!controller || typeof controller.getByUserId !== 'function') {
        return res.status(500).json({ error: 'getByUserId not available' });
      }
      return controller.getByUserId(req, res);
    })
  );

  // POST /  -> create (protegible con authMiddleware si está disponible)
  const postHandlers = [
    wrap(async (req, res) => {
      if (!controller || typeof controller.create !== 'function') {
        return res.status(500).json({ error: 'create handler not available' });
      }
      return controller.create(req, res);
    })
  ];

  // si hay authMiddleware y quieres proteger el POST por defecto con autenticación de tutor,
  // descomenta la línea siguiente y ajusta según tu middleware:
  // if (authMiddleware) postHandlers.unshift(authMiddleware);

  router.post('/', postHandlers);

  return router;
};
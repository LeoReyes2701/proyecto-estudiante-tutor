const express = require('express');

module.exports = function inscripcionesRoutesFactory({ inscripcionController }) {
  const router = express.Router();

  router.get('/', inscripcionController.list);
  router.post('/', inscripcionController.create);

  return router;
};

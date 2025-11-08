const { body, validationResult } = require('express-validator');

const validateTutoring = [
  body('title').isString().notEmpty().withMessage('Título obligatorio'),
  body('startTime').isISO8601().withMessage('Inicio inválido'),
  body('endTime').isISO8601().withMessage('Fin inválido'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors.array() });
    }
    next();
  }
];

module.exports = { validateTutoring };

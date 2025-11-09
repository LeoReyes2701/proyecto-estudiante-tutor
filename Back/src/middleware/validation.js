const { body, validationResult } = require('express-validator');

const validateTutoring = [
  body('nombre')
    .isString().withMessage('El nombre debe ser texto')
    .notEmpty().withMessage('El nombre es obligatorio'),
  body('descripcion')
    .isString().withMessage('La descripción debe ser texto')
    .notEmpty().withMessage('La descripción es obligatoria'),
  body('cupos')
    .isInt({ min: 10, max: 20 }).withMessage('Los cupos deben estar entre 10 y 20'),
  body('horarios')
    .isArray({ min: 1 }).withMessage('Debe seleccionar al menos un horario'),
  body('horarios.*.dia')
    .isString().notEmpty().withMessage('Cada horario debe tener un día'),
  body('horarios.*.hora')
    .isString().notEmpty().withMessage('Cada horario debe tener una hora'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors.array() });
    }
    next();
  }
];

module.exports = { validateTutoring };

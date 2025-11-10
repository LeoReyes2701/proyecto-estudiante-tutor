// Back/src/middleware/validation.js
const { body, validationResult } = require('express-validator');

const validateRegister = [
  body('nombre').exists().bail().withMessage('El nombre es obligatorio').isString().trim(),
  body('apellido').exists().bail().withMessage('El apellido es obligatorio').isString().trim(),
  body('email').exists().bail().withMessage('El email es obligatorio').isEmail().normalizeEmail().custom(v => String(v).toLowerCase().endsWith('@est.ucab.edu.ve')).withMessage('El correo debe terminar en @est.ucab.edu.ve'),
  body('password').exists().bail().withMessage('La contraseña es obligatoria').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol').exists().bail().withMessage('El rol es obligatorio').isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Datos inválidos', details: errors.array() });
    next();
  }
];

const validateLogin = [
  body('email').exists().bail().withMessage('El email es obligatorio').isEmail().normalizeEmail(),
  body('password').exists().bail().withMessage('La contraseña es obligatoria').isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Datos inválidos', details: errors.array() });
    next();
  }
];

module.exports = { validateRegister, validateLogin };
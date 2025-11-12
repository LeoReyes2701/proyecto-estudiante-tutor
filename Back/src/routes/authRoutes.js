// Back/src/routes/authRoutes.js
const express = require('express');

module.exports = function ({ authController, validateRegister, validateLogin } = {}) {
  if (!authController) throw new Error('authRoutes requires authController');
  const router = express.Router();

  const norm = (m) => (m ? (Array.isArray(m) ? m : [m]) : []);

  router.post('/registro', ...norm(validateRegister), (req, res, next) => authController.register(req, res, next));
  router.post('/login', ...norm(validateLogin), (req, res, next) => authController.login(req, res, next));
  router.get('/profile', authController.profile); // protect this from route mount if needed with auth middleware externally

  return router;
};

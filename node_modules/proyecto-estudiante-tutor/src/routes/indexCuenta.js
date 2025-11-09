const express = require('express');
const router = express.Router();

// Rutas de ejemplo para la API
router.get('/', (req, res) => {
  res.json({ message: 'API activa. Usa /auth para autenticación.' });
});

module.exports = router;


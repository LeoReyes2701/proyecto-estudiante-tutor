const express = require('express');
const { createTutoria, getTutorias } = require('../controllers/tutoriasController');
const { validateTutoring } = require('../middleware/validation');

const router = express.Router();

// POST crear tutoría (existente)
router.post('/tutorias', validateTutoring, createTutoria);

// GET listar tutorías (nueva)
router.get('/tutorias', getTutorias);

module.exports = router;

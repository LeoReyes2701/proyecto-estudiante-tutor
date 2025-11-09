const express = require('express');
const TutoriaRepository = require('../repositories/TutoriaRepository');
const TutoriaController = require('../controllers/tutoriaController');
const { validateTutoring } = require('../middleware/validation');

const router = express.Router();

// instancia única del repositorio para persistencia en archivo
const repo = new TutoriaRepository();
const controller = new TutoriaController(repo);

// Rutas API (compatibles con tu frontend)
router.post('/tutorias', validateTutoring, controller.createTutoria);
router.get('/tutorias', controller.getTutorias);

// opcionales (no usadas por frontend actual pero útiles)
router.get('/tutorias/:id', controller.getTutoriaById);
router.delete('/tutorias/:id', controller.deleteTutoria);

module.exports = router;

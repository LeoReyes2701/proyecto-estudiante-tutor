const express = require('express');
const { createTutoring, getTutorings } = require('../controllers/tutoriasController');
const { validateTutoring } = require('../middleware/validation');

const router = express.Router();

router.post('/', validateTutoring, createTutoring);
router.get('/', getTutorings);

module.exports = router;

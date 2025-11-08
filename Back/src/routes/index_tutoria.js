const express = require('express');
const tutoringRoutes = require('./tutoriasRoute');

const router = express.Router();

router.use('/tutorias', tutoringRoutes);

module.exports = router;


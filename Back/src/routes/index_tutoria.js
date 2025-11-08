const express = require('express');
const tutorialasRoute = require('./tutoriasRoute');

const router = express.Router();

router.use('/', tutorialasRoute);

module.exports = router;

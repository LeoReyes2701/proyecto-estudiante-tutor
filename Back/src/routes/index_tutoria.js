const express = require('express');
const tutoringRoutes = require('./tutoriasRoute');

const router = express.Router();

router.use('/', tutoringRoutes);


module.exports = router;


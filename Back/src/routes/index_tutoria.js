// Back/src/routes/index_tutoria.js
const express = require('express');
const router = express.Router();
const scheduleRoutes = require('./scheduleRoutes');

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.use('/schedules', scheduleRoutes);

module.exports = router;

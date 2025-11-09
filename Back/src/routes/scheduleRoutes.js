// Back/src/routes/scheduleRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/scheduleController');

router.post('/', controller.create);
router.get('/', controller.getAll);
router.get('/user/:userId', controller.getByUserId);

module.exports = router;

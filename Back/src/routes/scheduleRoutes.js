// routes/scheduleRoutes.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/scheduleController");

router.post("/schedules", controller.createSchedule);
router.get("/schedules", controller.getSchedules);

module.exports = router;
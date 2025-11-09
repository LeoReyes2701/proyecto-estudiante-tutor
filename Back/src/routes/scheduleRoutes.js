const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");

router.post("/", scheduleController.createSchedule);

router.get("/mine", scheduleController.getMySchedules);

module.exports = router;

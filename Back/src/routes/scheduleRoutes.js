const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");

router.post("/", scheduleController.create);

router.get("/", scheduleController.getByUserId);

module.exports = router;

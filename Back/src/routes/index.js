const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Bienvenido al sistema Estudiante-Tutor" });
});

module.exports = router;

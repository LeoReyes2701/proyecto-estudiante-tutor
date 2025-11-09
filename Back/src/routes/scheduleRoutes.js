const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");

// Debug temporal para verificar que el controller exporte correctamente las funciones
console.log('DEBUG scheduleController keys:', scheduleController && Object.keys(scheduleController));
console.log('DEBUG typeof create:', scheduleController && typeof scheduleController.create);

// Crear un nuevo horario/tutoria
if (typeof scheduleController.create === 'function') {
  router.post("/", scheduleController.create);
} else {
  // Handler explícito para evitar que Express lance "argument handler must be a function"
  router.post("/", (req, res) => {
    console.error('scheduleController.create no es una función. Comprueba exports en controllers/scheduleController.js');
    return res.status(500).json({ error: 'scheduleController.create no está disponible' });
  });
}

// Listar todos los horarios
if (typeof scheduleController.getAll === 'function') {
  router.get("/", scheduleController.getAll);
} else {
  router.get("/", (req, res) => {
    console.error('scheduleController.getAll no es una función. Comprueba exports en controllers/scheduleController.js');
    return res.status(500).json({ error: 'scheduleController.getAll no está disponible' });
  });
}

// Obtener horarios de un usuario por su id
if (typeof scheduleController.getByUserId === 'function') {
  router.get("/user/:userId", scheduleController.getByUserId);
} else {
  router.get("/user/:userId", (req, res) => {
    console.error('scheduleController.getByUserId no es una función. Comprueba exports en controllers/scheduleController.js');
    return res.status(500).json({ error: 'scheduleController.getByUserId no está disponible' });
  });
}

module.exports = router;

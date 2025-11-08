const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const authController = require("../controllers/authControllers");
const User = require("../models/User");

// Ruta POST para login
router.post("/login", authController.login);


// Función para generar un ID simple
function generarId() {
  return Date.now().toString();
}

router.get('/crear-cuenta', (req, res) => {
  // opcional: redirigir al HTML o responder JSON
  res.sendFile(path.resolve(__dirname, '..', '..', 'Front', 'public', 'crearCuenta.html'));
});


// Ruta POST para registrar usuario
router.post("/registro", async (req, res) => {
  const { nombre, apellido, email, password, rol } = req.body;

  if (!nombre || !apellido || !email || !password || !rol) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  // Validar formato del correo
  if (!email.endsWith("@est.ucab.edu.ve")) {
    return res.status(400).json({ error: "El correo debe terminar en @est.ucab.edu.ve" });
  }

  // Leer usuarios desde archivo (si existe)
  const rutaArchivo = path.join(__dirname, "../models/data/usuarios.json");
  let usuarios = [];
  try {
    const data = fs.readFileSync(rutaArchivo, "utf8");
    usuarios = JSON.parse(data);
    if (!Array.isArray(usuarios)) usuarios = [];
  } catch (err) {
    // Si el archivo no existe o está vacío, inicializar array vacío
    usuarios = [];
  }

  // Validar que el correo no esté repetido
  const existeCorreo = usuarios.find(u => u.email === email);
  if (existeCorreo) {
    return res.status(400).json({ error: "El correo ya está registrado" });
  }

  try {
    // Encriptar la contraseña
    const passwordEncriptada = await bcrypt.hash(password, 10);

    // Crear nuevo usuario con contraseña encriptada
    const nuevoUsuario = new User(
      generarId(),
      nombre,
      apellido,
      email,
      passwordEncriptada,
      rol
    );

    usuarios.push(nuevoUsuario);

    // Asegurar que la carpeta exista y escribir el archivo
    fs.mkdirSync(path.dirname(rutaArchivo), { recursive: true });
    fs.writeFileSync(rutaArchivo, JSON.stringify(usuarios, null, 2), "utf8");

    res.json({ mensaje: "Usuario registrado con éxito" });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});



module.exports = router;

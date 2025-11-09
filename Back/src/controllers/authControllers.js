const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
  }

  const rutaArchivo = path.join(__dirname, "../models/data/usuarios.json");
  let usuarios = [];

  try {
    const data = fs.readFileSync(rutaArchivo, "utf8");
    usuarios = JSON.parse(data);
  } catch (err) {
    return res.status(500).json({ error: "Error al leer usuarios" });
  }

  const usuario = usuarios.find(u => u.email === email);
  if (!usuario) {
    return res.status(400).json({ error: "Correo no registrado" });
  }

  const coincide = await bcrypt.compare(password, usuario.password);
  if (!coincide) {
    return res.status(400).json({ error: "Contraseña incorrecta" });
  }

  return res.json({
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    rol: usuario.rol,
    createdAt: usuario.createdAt,
    tutoriasOfrecidas: usuario.tutoriasOfrecidas,
    tutoriasInscritas: usuario.tutoriasInscritas
  });
};

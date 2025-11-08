const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'models', 'data', 'tutorias.json');

function createTutoria(req, res) {
  const { nombre, cupos, descripcion, horarios } = req.body;

  if (
    typeof nombre !== 'string' || !nombre.trim() ||
    typeof descripcion !== 'string' || !descripcion.trim() ||
    typeof cupos !== 'number' || cupos < 10 || cupos > 20 ||
    !Array.isArray(horarios) || horarios.length === 0
  ) {
    return res.status(400).json({ error: 'Formato inválido en el servidor' });
  }

  const nuevaTutoria = {
    nombre: nombre.trim(),
    cupos,
    descripcion: descripcion.trim(),
    horarios: horarios.map(h => ({
      dia: h.dia,
      hora: h.hora
    }))
  };

  let tutorias = [];

  try {
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf8');
      tutorias = JSON.parse(raw);
      if (!Array.isArray(tutorias)) tutorias = [];
    }
  } catch (err) {
    console.error('Error leyendo tutorias.json:', err);
    return res.status(500).json({ error: 'Error interno al leer datos' });
  }

  tutorias.push(nuevaTutoria);

  try {
    fs.writeFileSync(dataPath, JSON.stringify(tutorias, null, 2), 'utf8');
    return res.status(201).json({ message: 'Tutoría creada exitosamente' });
  } catch (err) {
    console.error('Error escribiendo tutorias.json:', err);
    return res.status(500).json({ error: 'Error interno al guardar datos' });
  }
}

function getTutorias(req, res) {
  try {
    if (!fs.existsSync(dataPath)) {
      // Si no existe, devolver array vacío (no crear archivo automáticamente para no alterar)
      return res.status(200).json([]);
    }
    const raw = fs.readFileSync(dataPath, 'utf8');
    const tutorias = JSON.parse(raw);
    if (!Array.isArray(tutorias)) {
      return res.status(500).json({ error: 'Formato inválido de datos en servidor' });
    }
    return res.status(200).json(tutorias);
  } catch (err) {
    console.error('Error leyendo tutorias.json:', err);
    return res.status(500).json({ error: 'Error interno al leer datos' });
  }
}

module.exports = { createTutoria, getTutorias };


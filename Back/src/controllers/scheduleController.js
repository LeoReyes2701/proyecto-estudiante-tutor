const Schedule = require("../models/Schedule");
const repo = require("../repositories/scheduleRepository");

// Detectar solapamientos
function haySolapamiento(nuevoHorario, listaHorarios) {
  const [newStartH, newStartM] = nuevoHorario.start.split(":").map(Number);
  const [newEndH, newEndM] = nuevoHorario.end.split(":").map(Number);
  const newStart = newStartH * 60 + newStartM;
  const newEnd = newEndH * 60 + newEndM;

  return listaHorarios.some(h => {
    if (h.tutor !== nuevoHorario.tutor || h.day !== nuevoHorario.day) return false;

    const [startH, startM] = h.start.split(":").map(Number);
    const [endH, endM] = h.end.split(":").map(Number);
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;

    return newStart < end && newEnd > start;
  });
}

// Crear horario
exports.createSchedule = (req, res) => {
  try {
    const { day, start, end } = req.body;

    // Validar que el usuario esté autenticado y sea tutor
    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }
    if (req.user.rol !== "tutor") {
      return res.status(403).json({ error: "Solo los tutores pueden crear horarios" });
    }

    // Construir nuevo horario con datos del perfil
    const nuevoHorario = new Schedule(
      req.user.id,
      day,
      start,
      end
    );

    // Validación propia del modelo
    const check = nuevoHorario.isValid();
    if (!check.ok) {
      return res.status(400).json({ error: check.reason });
    }

    // Cargar horarios existentes
    const horarios = repo.loadHorarios();

    // Validar solapamiento
    if (haySolapamiento(nuevoHorario, horarios)) {
      return res.status(400).json({ error: "El horario se solapa con otro ya existente" });
    }

    // Guardar
    horarios.push(nuevoHorario.toJSON());
    repo.saveHorarios(horarios);

    res.status(201).json(nuevoHorario.toJSON());
  } catch (err) {
    console.error("Error al crear horario:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// Consultar horarios
exports.getMySchedules = (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }
    if (req.user.rol !== "tutor") {
      return res.status(403).json({ error: "Solo los tutores pueden consultar horarios" });
    }

    const horarios = repo.loadHorarios();
    const filtrados = horarios.filter(h => h.tutor === req.user.id);

    if (filtrados.length === 0) {
      return res.status(404).json({ message: "No tienes horarios que consultar" });
    }

    res.json(filtrados);
  } catch (err) {
    console.error("Error al consultar horarios:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
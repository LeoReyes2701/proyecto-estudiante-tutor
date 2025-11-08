const Schedule = require("../models/Schedule");
const scheduleRepo = new Map();

// Crear horario (flujo del diagrama)
exports.create = (req, res) => {
  try {
    const { role, userId, slots, confirm } = req.body;

    // Precondición: debe ser tutor
    if (role !== "tutor") {
      return res.status(403).json({ error: "El tutor debe haber iniciado sesión" });
    }

    if (!userId || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: "Datos no válidos" });
    }

    // Intentar crear instancia de horario
    let schedule;
    try {
      schedule = new Schedule(userId, slots);
    } catch (err) {
      // Si falla validación o solapamiento
      return res.status(400).json({ error: err.message });
    }

    // Paso de confirmación (flujo del diagrama)
    if (!confirm) {
      return res.status(200).json({ message: "¿Confirma la creación de este bloque de horario?" });
    }

    if (confirm === "no") {
      return res.status(200).json({ message: "Horario no creado" });
    }

    if (confirm === "yes") {
      scheduleRepo.set(userId, schedule);
      return res.status(201).json({ message: "Horario creado exitosamente", horario: schedule.toJSON() });
    }

    return res.status(400).json({ error: "Confirmación inválida" });

  } catch (err) {
    return res.status(500).json({ error: "Error interno del sistema" });
  }
};

// Consultar horario
exports.getByUserId = (req, res) => {
  const { role, userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Debe especificar userId" });
  }

  const schedule = scheduleRepo.get(userId);
  if (!schedule) {
    return res.status(404).json({ error: "Horario no encontrado" });
  }

  if (role !== "tutor" && role !== "student") {
    return res.status(403).json({ error: "Rol no autorizado" });
  }

  return res.json(schedule.toJSON());
};


/*// (Opcional) Añadir un slot a un horario existente (solo tutor)
exports.addSlot = (req, res) => {
  try {
    const { role, userId } = req.body;
    const { day, start, end } = req.body;

    if (role !== "tutor") {
      return res.status(403).json({ error: "Solo los tutores pueden editar horarios" });
    }
    if (!userId || !day || !start || !end) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    const schedule = scheduleRepo.get(userId);
    if (!schedule) {
      return res.status(404).json({ error: "Horario no encontrado" });
    }

    schedule.addSlot(day, start, end);
    return res.status(200).json(schedule.toJSON());
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};*/ 

const Schedule = require("../models/Schedule");
const schedules = []; // almacenamiento en memoria

// Crear horario
exports.createSchedule = (req, res) => {
  const { day, start, end } = req.body;

  // Aquí el tutor se obtiene automáticamente (ejemplo: de sesión/login)
  // Por ahora lo simulamos con un valor fijo:
  const tutor = "Juan Pérez";

  const schedule = new Schedule(tutor, day, start, end);
  const check = schedule.isValid();

  if (!check.ok) {
    return res.status(400).json({ error: check.reason });
  }

  schedules.push(schedule);
  res.status(201).json(schedule.toJSON());
};

// Consultar horarios (todos)
exports.getSchedules = (req, res) => {
  res.json(schedules.map(s => s.toJSON()));
};

// Consultar horarios de un tutor específico
exports.getSchedulesByTutor = (req, res) => {
  const { tutor } = req.params;
  const result = schedules.filter(s => s.tutor === tutor);
  res.json(result.map(s => s.toJSON()));
};

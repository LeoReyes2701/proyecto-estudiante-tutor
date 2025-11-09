const Schedule = require("../models/Schedule");
const repo = require("../repositories/scheduleRepository");

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

exports.createSchedule = (req, res) => {
  const { day, start, end } = req.body;
  const tutor = "Juan Pérez"; // simulado
  //const tutor = req.user.name; // cuando venga del perfil autenticado

  const nuevoHorario = new Schedule(tutor, day, start, end);
  const check = nuevoHorario.isValid();
  if (!check.ok) {
    return res.status(400).json({ error: check.reason });
  }

  const horarios = repo.loadHorarios();
  if (haySolapamiento(nuevoHorario, horarios)) {
    return res.status(400).json({ error: "El horario se solapa con otro existente del mismo tutor y día" });
  }

  horarios.push(nuevoHorario.toJSON());
  repo.saveHorarios(horarios);
  res.status(201).json(nuevoHorario.toJSON());
};

exports.getSchedules = (req, res) => {
  const horarios = repo.loadHorarios();
  res.json(horarios);
};

exports.getSchedulesByTutor = (req, res) => {
  const { tutor } = req.params;
  const horarios = repo.loadHorarios();
  const filtrados = horarios.filter(h => h.tutor === tutor);
  res.json(filtrados);
};

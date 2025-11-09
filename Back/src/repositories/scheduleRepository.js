// repositories/scheduleRepository.js
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "../models/data/schedules.json");

function loadHorarios() {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error al leer schedules.json:", err);
    return [];
  }
}

function saveHorarios(horarios) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(horarios, null, 2));
  } catch (err) {
    console.error("Error al guardar schedules.json:", err);
  }
}

module.exports = {
  loadHorarios,
  saveHorarios
};

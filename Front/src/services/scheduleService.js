// src/services/scheduleService.js
import api from "./api.js"; // tu configuración de axios

export async function createSchedule(data) {
  const res = await api.post("/schedules", data);
  return res.data;
}

export async function getSchedules() {
  const res = await api.get("/schedules");
  return res.data;
}

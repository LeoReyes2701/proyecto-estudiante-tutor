// Back/src/controllers/scheduleController.js
const Schedule = require('../models/Schedule');
const dataStore = require('../models/DataStore');

async function create(req, res) {
  try {
    const { role, userId, slots, confirm } = req.body || {};

    if (role !== 'tutor') return res.status(403).json({ error: 'El tutor debe haber iniciado sesión' });
    if (!userId || !Array.isArray(slots) || slots.length === 0) return res.status(400).json({ error: 'userId y al menos un slot son requeridos' });

    let schedule;
    try {
      schedule = new Schedule(userId, slots);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    if (confirm === undefined || confirm === null) {
      return res.status(200).json({ message: 'Confirma la creación', preview: schedule.toJSON() });
    }

    const c = String(confirm).toLowerCase();
    if (c === 'no') return res.status(200).json({ message: 'Horario no creado' });

    if (c === 'yes') {
      try {
        const all = await dataStore.readAll();

        // evitar duplicados exactos (mismo userId y mismos slots)
        const key = (arr) => (arr || []).map(s => `${s.day}|${s.start}|${s.end}`).sort().join('||');
        const exists = all.some(existing => String(existing.userId) === String(schedule.userId) && key(existing.slots) === key(schedule.slots));
        if (exists) return res.status(200).json({ message: 'Horario ya existe', horario: schedule.toJSON() });

        all.push(schedule.toJSON());
        await dataStore.saveAll(all);
        return res.status(201).json({ message: 'Horario creado exitosamente', horario: schedule.toJSON() });
      } catch (err) {
        console.error('Error guardando horario:', err);
        return res.status(500).json({ error: 'No se pudo guardar el horario en disco' });
      }
    }

    return res.status(400).json({ error: 'Confirmación inválida' });
  } catch (err) {
    console.error('scheduleController.create error', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function getAll(req, res) {
  try {
    const arr = await dataStore.readAll();
    return res.json(arr);
  } catch (err) {
    console.error('scheduleController.getAll error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function getByUserId(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'Debe especificar userId' });
    const arr = await dataStore.readAll();
    const found = arr.find(s => String(s.userId) === String(userId));
    if (!found) return res.status(404).json({ error: 'Horario no encontrado' });
    return res.json(found);
  } catch (err) {
    console.error('scheduleController.getByUserId error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { create, getAll, getByUserId };


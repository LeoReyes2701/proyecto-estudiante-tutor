const Schedule = require('../models/Schedule');

const scheduleRepo = new Map();

/**
 * POST /api/schedules
 * Body: { role, userId, slots: [{ day, start, end }], confirm }
 *
 * Flow:
 * - sólo role === "tutor" puede crear
 * - valida userId y slots
 * - intenta crear instancia Schedule(userId, slots) que valida formato/solapamientos
 * - si confirm no está, devuelve mensaje de confirmación (200)
 * - if confirm === "no" => no crea (200)
 * - if confirm === "yes" => guarda en repo y devuelve 201
 */
exports.create = (req, res) => {
  try {
    const { role, userId, slots, confirm } = req.body || {};

    if (role !== 'tutor') {
      return res.status(403).json({ error: 'El tutor debe haber iniciado sesión' });
    }

    if (!userId || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ error: 'Datos no válidos: se requiere userId y al menos un slot' });
    }

    let schedule;
    try {
      schedule = new Schedule(userId, slots);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    if (confirm === undefined || confirm === null) {
      return res.status(200).json({ message: '¿Confirma la creación de este bloque de horario?', preview: schedule.toJSON() });
    }

    if (String(confirm).toLowerCase() === 'no') {
      return res.status(200).json({ message: 'Horario no creado' });
    }

    if (String(confirm).toLowerCase() === 'yes') {
      scheduleRepo.set(String(userId), schedule);
      return res.status(201).json({ message: 'Horario creado exitosamente', horario: schedule.toJSON() });
    }

    return res.status(400).json({ error: 'Confirmación inválida' });
  } catch (err) {
    console.error('scheduleController.create error', err);
    return res.status(500).json({ error: 'Error interno del sistema' });
  }
};

/**
 * GET /api/schedules
 * Query: ?role=...&userId=...
 * If userId query provided returns that user's schedule (if found) else 400.
 * If no userId provided returns all schedules.
 * Role must be 'tutor' or 'student' to read.
 */
exports.getAll = (req, res) => {
  try {
    const { role } = req.query;
    if (role !== 'tutor' && role !== 'student') {
      return res.status(403).json({ error: 'Rol no autorizado' });
    }

    const all = Array.from(scheduleRepo.values()).map(s => s.toJSON());
    return res.json(all);
  } catch (err) {
    console.error('scheduleController.getAll error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
};

/**
 * GET /api/schedules/user/:userId
 * Path param userId. Query may include role.
 */
exports.getByUserId = (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query;

    if (!userId) return res.status(400).json({ error: 'Debe especificar userId' });
    if (role !== 'tutor' && role !== 'student') return res.status(403).json({ error: 'Rol no autorizado' });

    const schedule = scheduleRepo.get(String(userId));
    if (!schedule) return res.status(404).json({ error: 'Horario no encontrado' });

    return res.json(schedule.toJSON());
  } catch (err) {
    console.error('scheduleController.getByUserId error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
};
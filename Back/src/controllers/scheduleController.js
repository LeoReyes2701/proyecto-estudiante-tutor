<<<<<<< HEAD
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
=======
// Back/src/controllers/scheduleController.js
const ScheduleRepository = require('../repositories/ScheduleRepository');
const scheduleRepo = new ScheduleRepository();

function timeToMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== 'string') return NaN;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function _normalizeSlots(slots) {
  if (!Array.isArray(slots)) return [];
  return slots.map(s => ({
    day: (s.day || s.dia || '').toString(),
    horaInicio: s.horaInicio || s.start || '',
    horaFin: s.horaFin || s.end || ''
  }));
}

function _slotsKey(arr = []) {
  return (arr || [])
    .map(s => `${(s.day || '').toString().toLowerCase()}|${s.horaInicio || ''}|${s.horaFin || ''}`)
    .sort()
    .join('||');
}

async function create(req, res) {
  try {
    const { role, tutorId, userId, slots, confirm } = req.body || {};
    const creatorId = tutorId || userId || req.headers['x-user-id'];

    // Log temprano para detectar llamadas dobles
    console.log('[scheduleController.create] incoming', {
      creatorId,
      slotsCount: Array.isArray(slots) ? slots.length : 0,
      confirm,
      ts: new Date().toISOString()
    });

    if (!creatorId) return res.status(400).json({ error: 'tutorId (o userId) es requerido' });
    if (role && role !== 'tutor') return res.status(403).json({ error: 'El tutor debe haber iniciado sesión' });

    const normalizedSlots = _normalizeSlots(slots);
    if (!normalizedSlots.length) return res.status(400).json({ error: 'slots missing or empty' });

    // Leer todos los horarios existentes
    const allRaw = await scheduleRepo.readAll();
    const all = Array.isArray(allRaw) ? allRaw : [];

    // Validar duplicados exactos
    const existsExact = all.some(existing =>
      String(existing.tutorId || existing.userId) === String(creatorId) &&
      _slotsKey(existing.slots) === _slotsKey(normalizedSlots)
    );
    if (existsExact) {
      const existing = all.find(e =>
        String(e.tutorId || e.userId) === String(creatorId) &&
        _slotsKey(e.slots) === _slotsKey(normalizedSlots)
      );
      return res.status(200).json({ message: 'Horario ya existe', horario: existing });
    }

    // Validar solapamiento
    const tutorSchedules = all.filter(s => String(s.tutorId || s.userId) === String(creatorId));
    const conflicts = [];
    for (const newSlot of normalizedSlots) {
      const newStart = timeToMinutes(newSlot.horaInicio);
      const newEnd = timeToMinutes(newSlot.horaFin);
      if (Number.isNaN(newStart) || Number.isNaN(newEnd)) {
        return res.status(400).json({ error: 'Formato de hora inválido en slots' });
      }
      for (const existingSch of tutorSchedules) {
        for (const existSlot of (existingSch.slots || [])) {
          if ((existSlot.day || '').toLowerCase() !== (newSlot.day || '').toLowerCase()) continue;
          const exStart = timeToMinutes(existSlot.horaInicio || existSlot.start);
          const exEnd = timeToMinutes(existSlot.horaFin || existSlot.end);
          if (Number.isNaN(exStart) || Number.isNaN(exEnd)) continue;
          if (rangesOverlap(newStart, newEnd, exStart, exEnd)) {
            conflicts.push({ newSlot, conflictingExisting: { scheduleId: existingSch.id || null, slot: existSlot } });
          }
        }
      }
    }
    if (conflicts.length) {
      return res.status(409).json({ error: 'Hay solapamiento con un horario ya existente', conflicts: conflicts.slice(0, 5) });
    }

    // Preview when no confirm provided
    if (confirm === undefined || confirm === null) {
      return res.status(200).json({ message: 'Confirma para continuar', preview: { tutorId: creatorId, slots: normalizedSlots } });
    }

    const c = String(confirm).toLowerCase();
    if (c === 'no') return res.status(200).json({ message: 'Horario NO creado...' });

    if (c === 'yes') {
      // Leer una sola vez
      const allRaw = await scheduleRepo.readAll();
      const all = Array.isArray(allRaw) ? allRaw : [];

      // 4) Guardar
      const toSave = { tutorId: creatorId, slots: normalizedSlots, createdAt: new Date().toISOString() };
      const saved = await scheduleRepo.save(toSave);
      return res.status(201).json({ message: 'Horario creado exitosamente...', horario: saved });
    }
    
  } catch (err) {
    console.error('[scheduleController.create] error', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function getAll(req, res) {
  try {
    const arr = await scheduleRepo.readAll();
    return res.json(Array.isArray(arr) ? arr : []);
  } catch (err) {
    console.error('[scheduleController.getAll] error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function getByTutorId(req, res) {
  try {
    const { tutorId } = req.params;
    if (!tutorId) return res.status(400).json({ error: 'Debe especificar tutorId' });
    const arr = await scheduleRepo.findByTutorId(tutorId);
    return res.json(Array.isArray(arr) ? arr : []);
  } catch (err) {
    console.error('[scheduleController.getByTutorId] error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

async function getByUserId(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'Debe especificar userId' });
    const arr = await scheduleRepo.findByUserId(userId);
    return res.json(Array.isArray(arr) ? arr : []);
  } catch (err) {
    console.error('[scheduleController.getByUserId] error', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}

module.exports = { create, getAll, getByTutorId, getByUserId };
>>>>>>> origin/mauricio

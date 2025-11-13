// Back/src/repositories/InscripcionRepository.js
const TutoriaRepository = require('./TutoriaRepository');
const ScheduleRepository = require('./ScheduleRepository');

class InscripcionRepository {
  constructor({ scheduleRepository } = {}) {
    this.tutoriaRepo = new TutoriaRepository();
    this.scheduleRepo = scheduleRepository || new ScheduleRepository();
  }

  async inscribirEstudiante(tutoriaId, estudianteId) {
    if (!tutoriaId || !estudianteId) throw new Error('Faltan parámetros');

    // Obtener la tutoria
    const tutoria = await this.tutoriaRepo.findById(tutoriaId);
    if (!tutoria) return { status: 'not_found', message: 'Tutoria no encontrada' };

    // Asegurar formato de la lista
    if (!Array.isArray(tutoria.estudiantesInscritos)) tutoria.estudiantesInscritos = [];

    // Evitar duplicado
    if (tutoria.estudiantesInscritos.includes(String(estudianteId))) {
      return { status: 'already', message: 'Estudiante ya inscrito', tutoria };
    }

    // Validar cupo
    const inscritosCount = tutoria.estudiantesInscritos.length;
    const cupo = Number.isFinite(Number(tutoria.cupo)) ? Math.max(0, Math.floor(Number(tutoria.cupo))) : 0;
    if (inscritosCount >= cupo) {
      return { status: 'full', message: 'No hay cupo disponible', tutoria };
    }

    // Validar conflicto de horarios
    const conflictResult = await this._checkScheduleConflict(estudianteId, tutoria.horarioId);
    if (conflictResult.conflict) {
      return { status: 'conflict', message: conflictResult.message, tutoria };
    }

    // Agregar e intentar persistir
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, "0");
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const año = String(hoy.getFullYear()).slice(-2);
    const fecha = `${dia}/${mes}/${año}`;

    tutoria.estudiantesInscritos.push({ id: String(estudianteId), fecha });

    // Intentar actualizar el repositorio. Soportamos varios métodos posibles: update(id, obj), save(obj), replace(id,obj)
    if (typeof this.tutoriaRepo.update === 'function') {
      await this.tutoriaRepo.update(tutoriaId, tutoria);
    } else if (typeof this.tutoriaRepo.save === 'function') {
      await this.tutoriaRepo.save(tutoria);
    } else if (typeof this.tutoriaRepo.replace === 'function') {
      await this.tutoriaRepo.replace(tutoriaId, tutoria);
    } else {
      // Si no hay método de persistencia, lanzamos para que el controller devuelva 500
      throw new Error('TutoriaRepository no implementa método de guardado (update/save/replace)');
    }

    return { status: 'ok', message: 'Inscripción realizada', tutoria };
  }

  // Método auxiliar para verificar conflictos de horario
  async _checkScheduleConflict(estudianteId, newHorarioId) {
    if (!newHorarioId) return { conflict: false };

    // Obtener el horario de la nueva tutoría
    const newSchedule = await this.scheduleRepo.findById(newHorarioId);
    if (!newSchedule || !Array.isArray(newSchedule.slots)) return { conflict: false };

    // Obtener todas las tutorías donde el estudiante está inscrito
    const allTutorias = await this.tutoriaRepo.readAll();
    const enrolledTutorias = allTutorias.filter(t =>
      Array.isArray(t.estudiantesInscritos) &&
      t.estudiantesInscritos.some(e => String(e.id) === String(estudianteId))
    );

    // Para cada tutoría inscrita, obtener su horario y verificar solapamiento
    for (const enrolledTutoria of enrolledTutorias) {
      if (!enrolledTutoria.horarioId) continue;

      const enrolledSchedule = await this.scheduleRepo.findById(enrolledTutoria.horarioId);
      if (!enrolledSchedule || !Array.isArray(enrolledSchedule.slots)) continue;

      // Verificar si hay solapamiento entre los slots
      for (const newSlot of newSchedule.slots) {
        for (const enrolledSlot of enrolledSchedule.slots) {
          if (this._slotsOverlap(newSlot, enrolledSlot)) {
            return {
              conflict: true,
              message: `Conflicto de horario: La tutoría "${enrolledTutoria.titulo}" se solapa con esta nueva tutoría.`
            };
          }
        }
      }
    }

    return { conflict: false };
  }

  // Método auxiliar para verificar si dos slots se solapan
  _slotsOverlap(slotA, slotB) {
    if (!slotA || !slotB) return false;

    const dayA = String(slotA.day || slotA.dia || '').toLowerCase().trim();
    const dayB = String(slotB.day || slotB.dia || '').toLowerCase().trim();

    if (dayA !== dayB) return false;

    const startA = this._timeToMinutes(slotA.horaInicio || slotA.start);
    const endA = this._timeToMinutes(slotA.horaFin || slotA.end);
    const startB = this._timeToMinutes(slotB.horaInicio || slotB.start);
    const endB = this._timeToMinutes(slotB.horaFin || slotB.end);

    if (startA === -1 || endA === -1 || startB === -1 || endB === -1) return false;

    return startA < endB && startB < endA;
  }

  // Método auxiliar para convertir tiempo HH:MM a minutos
  _timeToMinutes(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return -1;
    const [h, m] = timeStr.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return -1;
    return h * 60 + m;
  }
}

module.exports = InscripcionRepository;


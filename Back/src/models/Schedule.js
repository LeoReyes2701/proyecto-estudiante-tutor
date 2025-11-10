// Back/src/models/Schedule.js
class Schedule {
  /**
   * tutorId: identificador del tutor que crea el horario
   * slots: array de slots. Cada slot puede tener las claves:
   *   - day, start, end
   *   - day, horaInicio, horaFin
   */
  constructor(tutorId, slots = []) {
    if (!tutorId) throw new Error('tutorId es requerido');
    if (!Array.isArray(slots)) throw new Error('slots debe ser un array');
    this.id = Date.now().toString();
    this.tutorId = String(tutorId);
    this.slots = [];
    this.createdAt = new Date().toISOString();
    slots.forEach(s => {
      // aceptar ambos formatos de campo (start/end o horaInicio/horaFin)
      const day = s.day || s.dia;
      const start = s.start || s.horaInicio || s.hora_inicio;
      const end = s.end || s.horaFin || s.hora_fin;
      this.addSlot(day, start, end);
    });
  }

  static timeToMinutes(time) {
    if (typeof time !== 'string') return NaN;
    const m = time.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return NaN;
    const hh = parseInt(m[1], 10), mm = parseInt(m[2], 10);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return NaN;
    return hh * 60 + mm;
  }

  /**
   * addSlot acepta day, start, end donde start/end pueden venir en formato "HH:MM"
   * o cualquier string convertible. Internamente se almacenan como horaInicio/horaFin
   * para coincidir con lo que envía el HTML.
   */
  addSlot(day, start, end) {
    if (!day) throw new Error('El campo day es obligatorio');
    const sMin = Schedule.timeToMinutes(String(start));
    const eMin = Schedule.timeToMinutes(String(end));
    if (Number.isNaN(sMin) || Number.isNaN(eMin)) throw new Error('Formato de hora inválido. Usa HH:MM');
    if (sMin >= eMin) throw new Error('start debe ser anterior a end');
    if (eMin - sMin < 20) throw new Error('La duración mínima es 20 minutos');

    const overlap = this.slots.some(slot => {
      if (slot.day !== day) return false;
      const ss = Schedule.timeToMinutes(slot.horaInicio || slot.start);
      const ee = Schedule.timeToMinutes(slot.horaFin || slot.end);
      return !(eMin <= ss || sMin >= ee);
    });
    if (overlap) throw new Error('El slot se solapa con otro existente');

    // Guardar con las claves que pide el HTML: dia, horaInicio, horaFin
    this.slots.push({
      day,
      horaInicio: String(start),
      horaFin: String(end)
    });
  }

  toJSON() {
    return {
      id: this.id,
      tutorId: this.tutorId,
      slots: this.slots.map(s => ({ ...s })),
      createdAt: this.createdAt
    };
  }
}

module.exports = Schedule;
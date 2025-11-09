// Back/src/models/Schedule.js
class Schedule {
  constructor(userId, slots = []) {
    if (!userId) throw new Error('userId es requerido');
    if (!Array.isArray(slots)) throw new Error('slots debe ser un array');
    this.id = Date.now().toString();
    this.userId = String(userId);
    this.slots = [];
    this.createdAt = new Date().toISOString();
    slots.forEach(s => this.addSlot(s.day, s.start, s.end));
  }

  static timeToMinutes(time) {
    if (typeof time !== 'string') return NaN;
    const m = time.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return NaN;
    const hh = parseInt(m[1], 10), mm = parseInt(m[2], 10);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return NaN;
    return hh * 60 + mm;
  }

  addSlot(day, start, end) {
    if (!day) throw new Error('El campo day es obligatorio');
    const sMin = Schedule.timeToMinutes(String(start));
    const eMin = Schedule.timeToMinutes(String(end));
    if (Number.isNaN(sMin) || Number.isNaN(eMin)) throw new Error('Formato de hora inválido. Usa HH:MM');
    if (sMin >= eMin) throw new Error('start debe ser anterior a end');
    if (eMin - sMin < 20) throw new Error('La duración mínima es 20 minutos');

    const overlap = this.slots.some(slot => {
      if (slot.day !== day) return false;
      const ss = Schedule.timeToMinutes(slot.start);
      const ee = Schedule.timeToMinutes(slot.end);
      return !(eMin <= ss || sMin >= ee);
    });
    if (overlap) throw new Error('El slot se solapa con otro existente');

    this.slots.push({ day, start: String(start), end: String(end) });
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      slots: this.slots.map(s => ({ ...s })),
      createdAt: this.createdAt
    };
  }
}

module.exports = Schedule;

class Schedule {
  constructor(userId, slots = []) {
    this.id = Date.now().toString();
    this.userId = userId;
    this.slots = [];
    this.createdAt = new Date().toISOString();

    // Inicializar con validación
    slots.forEach(s => this.addSlot(s.day, s.start, s.end));
  }

  static validDays() {
    return ["mon","tue","wed","thu","fri","sat","sun"];
  }

  static toMinutes(time) {
    // Convierte "HH:MM" a minutos desde medianoche
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  static isValidDuration(start, end) {
    const diff = Schedule.toMinutes(end) - Schedule.toMinutes(start);
    return diff >= 50 && diff <= 100;
  }

  addSlot(day, start, end) {
    if (!Schedule.validDays().includes(day)) {
      throw new Error("Día inválido");
    }
    if (!Schedule.isValidDuration(start, end)) {
      throw new Error("La duración debe ser entre 50 y 100 minutos");
    }
    if (this.hasOverlap(day, start, end)) {
      throw new Error("Solapamiento de horario para este tutor");
    }
    this.slots.push({ day, start, end });
  }

  hasOverlap(day, start, end) {
    const startMin = Schedule.toMinutes(start);
    const endMin = Schedule.toMinutes(end);

    return this.slots.some(s => {
      if (s.day !== day) return false;
      const sStart = Schedule.toMinutes(s.start);
      const sEnd = Schedule.toMinutes(s.end);
      // Solapamiento si los rangos se cruzan
      return !(endMin <= sStart || startMin >= sEnd);
    });
  }

  getSlots() {
    return [...this.slots];
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      slots: this.getSlots(),
      createdAt: this.createdAt
    };
  }
}

module.exports = Schedule;

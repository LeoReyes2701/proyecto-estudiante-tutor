class Schedule {
  static diasValidos = [
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes"
  ];

  constructor(tutor, day, start, end) {
    this.tutor = tutor; 
    this.day = day;     
    this.start = start; 
    this.end = end;     
  }

  /*Por commo esta ahora solo se utiliza el validDuration, de resto se skipea debido a la
  entrada de datos, lo dejo igual para mas adelante por posible implementacion de modificar horario*/
  // Valida el día
  isValidDay() {
    const normalizar = (s) =>
      s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    const diaInput = normalizar(this.day);
    const diasNormalizados = Schedule.diasValidos.map(normalizar);
    return diasNormalizados.includes(diaInput);
  }

  // Calcula duración en minutos
  getDuration() {
    const [sh, sm] = this.start.split(":").map(Number);
    const [eh, em] = this.end.split(":").map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  }

  // Valida duración entre 50 y 100 min
  isValidDuration() {
    const d = this.getDuration();
    return d >= 50 && d <= 100;
  }

  // Valida formato HH:mm
  static isValidTimeFormat(time) {
    return /^\d{2}:\d{2}$/.test(time);
  }

  // Validación general
  isValid() {
    if (!Schedule.isValidTimeFormat(this.start) || !Schedule.isValidTimeFormat(this.end)) {
      return { ok: false, reason: "Formato de hora inválido (HH:mm)" };
    }
    if (this.getDuration() <= 0) {
      return { ok: false, reason: "La hora fin debe ser posterior a la hora inicio" };
    }
    if (!this.isValidDuration()) {
      return { ok: false, reason: "Duración inválida. Debe durar 1 o 2 horas académicas (50-100 min)" };
    }
    if (!this.isValidDay()) {
      return { ok: false, reason: "El día no es correcto" };
    }
    return { ok: true };
  }

  toJSON() {
    return {
      tutor: this.tutor,
      day: this.day,
      start: this.start,
      end: this.end
    };
  }
}

module.exports = Schedule;

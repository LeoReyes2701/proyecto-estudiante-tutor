class Tutoring {
  constructor({ title, description, startTime, endTime, weekday, capacity }) {
    this.id = Date.now().toString();
    this.title = title;
    this.description = description || '';
    this.startTime = startTime;
    this.endTime = endTime;
    this.weekday = weekday || null;
    this.capacity = capacity || null;
  }
}

module.exports = Tutoring;

// Back/src/repositories/ScheduleRepository.js
const DataStore = require('../models/DataStore');

class ScheduleRepository {
  constructor(options = {}) {
    const file = options.filePath; // opcional para tests
    this.store = new DataStore(file);
  }

  async listAll() {
    return await this.store.readAll();
  }

  async findByUserId(userId) {
    const all = await this.store.readAll();
    return all.find(s => String(s.userId) === String(userId)) || null;
  }

  async save(scheduleObj) {
    const all = await this.store.readAll();
    all.push(scheduleObj);
    await this.store.saveAll(all);
    return scheduleObj;
  }
}

module.exports = ScheduleRepository;

// Back/src/models/DataStore.js
const fs = require('fs').promises;
const path = require('path');

const DEFAULT_DATA_DIR = path.resolve(__dirname, './data');
const DEFAULT_FILE = path.join(DEFAULT_DATA_DIR, 'schedules.json');

class DataStore {
  /**
   * options.filePath -> ruta absoluta o relativa al archivo JSON a usar.
   * Si no se pasa, se usa ./data/schedules.json dentro de este folder.
   */
  constructor(filePath) {
    if (filePath) {
      // si pasan un path relativo, resolver respecto a project (mantener flexibilidad)
      this.file = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
      this.dataDir = path.dirname(this.file);
    } else {
      this.dataDir = DEFAULT_DATA_DIR;
      this.file = DEFAULT_FILE;
    }
  }

  async ensureFile() {
    await fs.mkdir(this.dataDir, { recursive: true });
    try {
      await fs.access(this.file);
    } catch {
      await fs.writeFile(this.file, JSON.stringify([], null, 2), 'utf8');
    }
  }

  async readAll() {
    await this.ensureFile();
    const raw = await fs.readFile(this.file, 'utf8');
    try {
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      // si el JSON está corrupto, reescribir con array vacío y devolver []
      await fs.writeFile(this.file, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
  }

  async saveAll(arr) {
    if (!Array.isArray(arr)) throw new Error('saveAll requiere un array');
    await this.ensureFile();
    await fs.writeFile(this.file, JSON.stringify(arr, null, 2), 'utf8');
  }
}

// exports
module.exports = DataStore;

// También exportar rutas por compatibilidad si se desea require(...) de forma funcional
module.exports.FILE = DEFAULT_FILE;
module.exports.DATA_DIR = DEFAULT_DATA_DIR;
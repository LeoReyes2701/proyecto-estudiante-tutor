const fs = require('fs');
const path = require('path');

class TutoriaRepository {
  constructor(dataPath) {
    // ruta por defecto compatible con la estructura del proyecto
    this.dataPath = dataPath || path.join(__dirname, '..', 'models', 'data', 'tutorias.json');
  }

  _ensureFile() {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.dataPath)) {
      fs.writeFileSync(this.dataPath, '[]', 'utf8');
    }
  }

  _readAll() {
    this._ensureFile();
    const raw = fs.readFileSync(this.dataPath, 'utf8');
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      // Si el JSON está corrupto, reescribimos vacío (evita romper en producción; puedes cambiar esto)
      fs.writeFileSync(this.dataPath, '[]', 'utf8');
      return [];
    }
  }

  _writeAll(arr) {
    this._ensureFile();
    fs.writeFileSync(this.dataPath, JSON.stringify(arr, null, 2), 'utf8');
  }

  all() {
    return this._readAll();
  }

  save(tutoriaObject) {
    // tutoriaObject se espera ya serializable (ej. tutoria.toJSON())
    const arr = this._readAll();
    arr.push(tutoriaObject);
    this._writeAll(arr);
    return tutoriaObject;
  }

  findById(id) {
    const arr = this._readAll();
    return arr.find(t => t.id === id) || null;
  }

  removeById(id) {
    const arr = this._readAll();
    const filtered = arr.filter(t => t.id !== id);
    this._writeAll(filtered);
    return arr.length !== filtered.length;
  }

  replaceAll(newArr) {
    this._writeAll(Array.isArray(newArr) ? newArr : []);
  }
}

module.exports = TutoriaRepository;

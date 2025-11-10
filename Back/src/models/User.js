// Back/src/models/User.js
class User {
  /**
   * Acepta:
   *   new User(id, nombre, apellido, email, password, rol)
   * o
   *   new User({ id, nombre, apellido, email, password, rol, createdAt })
   *
   * Solo se conservan los atributos que indicaste:
   *  id, nombre, apellido, email, password, rol, createdAt
   */
  constructor(idOrObj, nombre, apellido, email, password, rol) {
    const src = (typeof idOrObj === 'object' && idOrObj !== null)
      ? idOrObj
      : { id: idOrObj, nombre, apellido, email, password, rol };

    this.id = src.id || (Date.now().toString() + '-' + Math.random().toString(36).slice(2, 9));
    this.nombre = (src.nombre || '').trim();
    this.apellido = (src.apellido || '').trim();
    this.email = String(src.email || '').trim().toLowerCase();
    this.password = (src.password === undefined) ? null : src.password;
    this.rol = String(src.rol || '').trim().toLowerCase();

    // Normalizar rol: profesor -> tutor, por compatibilidad; solo 'tutor' o 'estudiante'
    if (this.rol === 'profesor') this.rol = 'tutor';
    if (this.rol !== 'tutor' && this.rol !== 'estudiante') this.rol = 'estudiante';

    // createdAt (ISO)
    if (src.createdAt && !isNaN(new Date(src.createdAt).getTime())) {
      this.createdAt = new Date(src.createdAt).toISOString();
    } else {
      this.createdAt = new Date().toISOString();
    }
  }

  // Representación pública (no incluye password)
  toPublic() {
    return {
      id: this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      rol: this.rol,
      createdAt: this.createdAt
    };
  }

  // Objeto guardado en almacenamiento (incluye password)
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      password: this.password,
      rol: this.rol,
      createdAt: this.createdAt
    };
  }
}

module.exports = User;
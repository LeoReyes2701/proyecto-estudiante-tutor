// Back/src/models/User.js
class User {
  /**
   * Compatible con firma antigua:
   *   new User(id, nombre, apellido, email, password, rol)
   * También acepta objeto:
   *   new User({ id, nombre, apellido, email, password, rol, createdAt, ... })
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
    this.currentToken = src.currentToken || null;

    // createdAt / updatedAt (ISO)
    if (src.createdAt && !isNaN(new Date(src.createdAt).getTime())) {
      this.createdAt = new Date(src.createdAt).toISOString();
    } else {
      this.createdAt = new Date().toISOString();
    }
    if (src.updatedAt && !isNaN(new Date(src.updatedAt).getTime())) {
      this.updatedAt = new Date(src.updatedAt).toISOString();
    } else {
      this.updatedAt = this.createdAt;
    }

    // lastLogin (nullable ISO) y active flag
    this.lastLogin = (src.lastLogin && !isNaN(new Date(src.lastLogin).getTime())) ? new Date(src.lastLogin).toISOString() : null;
    this.active = (typeof src.active === 'boolean') ? src.active : true;

    // Colecciones / listas con defaults
    this.horarios = Array.isArray(src.horarios) ? src.horarios : [];
    this.favoritos = Array.isArray(src.favoritos) ? src.favoritos : [];
    this.tutoriasOfrecidas = Array.isArray(src.tutoriasOfrecidas) ? src.tutoriasOfrecidas : [];
    this.tutoriasInscritas = Array.isArray(src.tutoriasInscritas) ? src.tutoriasInscritas : [];

    // Normalizar rol
    if (this.rol === 'profesor') this.rol = 'tutor';
    if (this.rol !== 'tutor' && this.rol !== 'estudiante') {
      this.rol = 'estudiante';
    }

    // createdAtShort en formato DD/MM/YY
    const d = new Date(this.createdAt);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const año = String(d.getFullYear()).slice(-2);
    this.createdAtShort = `${dia}/${mes}/${año}`;
  }

  // Representación segura para el cliente (sin password ni token)
  toPublic() {
    return {
      id: this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      rol: this.rol,
      createdAt: this.createdAt,
      createdAtShort: this.createdAtShort,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin,
      horarios: this.horarios,
      favoritos: this.favoritos,
      tutoriasOfrecidas: this.tutoriasOfrecidas,
      tutoriasInscritas: this.tutoriasInscritas,
      active: this.active
    };
  }

  // Objeto tal como se guarda en almacenamiento (incluye password y token)
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      password: this.password,
      rol: this.rol,
      currentToken: this.currentToken,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin,
      horarios: this.horarios,
      favoritos: this.favoritos,
      tutoriasOfrecidas: this.tutoriasOfrecidas,
      tutoriasInscritas: this.tutoriasInscritas,
      active: this.active
    };
  }
}

module.exports = User;
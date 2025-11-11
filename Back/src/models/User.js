class User {
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

    // Fecha en formato dd/mm/yy
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, "0");
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const año = String(hoy.getFullYear()).slice(-2);

    // Si viene una fecha en formato ISO, la ignoramos
    const isISO = typeof src.createdAt === 'string' && src.createdAt.includes('T');
    this.createdAt = (!isISO && src.createdAt) ? src.createdAt : `${dia}/${mes}/${año}`;
  }

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
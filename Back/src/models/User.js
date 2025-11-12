class User {
<<<<<<< HEAD
  constructor(id, nombre, apellido, email, password, rol) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.password = password;
    this.rol = rol; // estudiante o tutor
    
    // Fecha formateada en DD/MM/YY
=======
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
>>>>>>> origin/mauricio
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, "0");
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const año = String(hoy.getFullYear()).slice(-2);

<<<<<<< HEAD
    this.createdAt = `${dia}/${mes}/${año}`;
    this.tutoriasOfrecidas = []; // solo para tutores 
    this.tutoriasInscritas = []; // solo para estudiantes
=======
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
>>>>>>> origin/mauricio
  }
}

module.exports = User;
class User {
  constructor(id, nombre, apellido, email, password, rol) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.password = password;
    this.rol = rol; // estudiante o tutor
  }
}

module.exports = User;

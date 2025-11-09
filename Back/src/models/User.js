class User {
  constructor(id, nombre, apellido, email, password, rol) {
    this.id = id;
    this.nombre = nombre;
    this.apellido = apellido;
    this.email = email;
    this.password = password;
    this.rol = rol; // estudiante o tutor
    
    // Fecha formateada en DD/MM/YY
    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, "0");
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const año = String(hoy.getFullYear()).slice(-2);

    this.createdAt = `${dia}/${mes}/${año}`;
    this.tutoriasOfrecidas = []; // solo para tutores 
    this.tutoriasInscritas = []; // solo para estudiantes
  }
}

module.exports = User;

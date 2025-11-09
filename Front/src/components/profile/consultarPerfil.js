document.addEventListener("DOMContentLoaded", () => {
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  if (!usuario) {
    alert("No hay sesión activa. Redirigiendo al login...");
    window.location.href = "/login";
    return;
  }

  // Mostrar datos en el perfil
  document.getElementById("userName").textContent = `${usuario.nombre} ${usuario.apellido}`;
  document.getElementById("userEmail").textContent = usuario.email;
  document.getElementById("userRol").textContent = usuario.rol;
  document.getElementById("fechaPerfil").textContent = `Perfil creado el: ${usuario.createdAt}`;

  // Cerrar sesión
  document.getElementById("logoutButton").addEventListener("click", () => {
    localStorage.removeItem("usuario");
    window.location.href = "/login";
  });
});

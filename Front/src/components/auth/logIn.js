function setupPasswordToggle() {
    const togglePassword = document.querySelector('#togglePassword');
    const passwordInput = document.querySelector('#passwordInput');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function (e) {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
        });
    }
}


document.addEventListener("DOMContentLoaded", () => {
    setupPasswordToggle();
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("emailInput").value.trim().toLowerCase();
    const password = document.getElementById("passwordInput").value.trim();

    if (!email || !password) {
      alert("Debes ingresar correo y contraseña");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error en login");
        return;
      }

      // Guardar sesión en LocalStorage
      localStorage.setItem("usuario", JSON.stringify(data));

      alert("Inicio de sesión exitoso");
      console.log("Sesión creada en LocalStorage:", data);
      //window.location.href = "/home.html"; // ACA FALTA PONER LA PAGINA PRINCIPAL
    } catch (err) {
      console.error("Error en login:", err);
      alert("Error de conexión con el servidor");
    }
  });
});

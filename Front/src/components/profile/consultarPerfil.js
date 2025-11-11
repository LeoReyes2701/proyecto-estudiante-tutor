// /src/components/profile/consultarPerfil.js
document.addEventListener("DOMContentLoaded", () => {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) {
      // No hay sesión: redirigir al login
      console.warn("No hay usuario en localStorage, redirigiendo a login");
      window.location.href = "/logIn.html";
      return;
    }

    let usuario;
    try {
      usuario = JSON.parse(raw);
    } catch (err) {
      console.error("Error parseando 'usuario' desde localStorage:", err);
      localStorage.removeItem("usuario");
      window.location.href = "/logIn.html";
      return;
    }

    // Rellenar campos del perfil con comprobaciones
    const userNameEl = document.getElementById("userName");
    const userEmailEl = document.getElementById("userEmail");
    const userRolEl = document.getElementById("userRol");
    const fechaPerfilEl = document.getElementById("fechaPerfil");
    const logoutBtn = document.getElementById("logoutButton");
    const volverBtn = document.getElementById("btnVolver");

    if (userNameEl) {
      const nombre = (usuario.nombre || "").trim();
      const apellido = (usuario.apellido || "").trim();
      userNameEl.textContent = nombre || apellido ? `${nombre} ${apellido}`.trim() : "Usuario";
    }
    if (userEmailEl) userEmailEl.textContent = usuario.email || "";
    if (userRolEl) userRolEl.textContent = usuario.rol || "";

    if (fechaPerfilEl) {
      const createdAt = usuario.createdAt || usuario.created_at || usuario.created || null;
      let formatted = "Fecha no disponible";
      if (createdAt) {
        const d = new Date(createdAt);
        if (!Number.isNaN(d.getTime())) {
          formatted = d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
        } else {
          formatted = String(createdAt);
        }
      }
      fechaPerfilEl.textContent = `Perfil creado el: ${formatted}`;
    }

    // Logout: limpiar localStorage y redirigir
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        try { localStorage.removeItem("usuario"); } catch (e) { /* ignore */ }
        window.location.href = "/logIn.html";
      });
    }

    // Volver a gestion
    if (volverBtn) {
      volverBtn.addEventListener("click", () => {
        window.location.href = "/gestion.html";
      });
    }

  } catch (e) {
    console.error("Error inicializando página de perfil:", e);
    // Fallback: redirigir al login para evitar quedar en estado inconsistente
    window.location.href = "/logIn.html";
  }
});
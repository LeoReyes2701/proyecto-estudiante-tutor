// /src/components/profile/consultarPerfil.js
document.addEventListener("DOMContentLoaded", () => {
  try {
    const raw = localStorage.getItem("usuario");
    if (!raw) {
      window.location.href = "/login.html";
      return;
    }

    let usuario;
    try {
      usuario = JSON.parse(raw);
    } catch (err) {
      localStorage.removeItem("usuario");
      window.location.href = "/login.html";
      return;
    }

    // Selectores (más tolerante)
    const userNameEl = document.getElementById("userName") || document.querySelector("[data-user-name]");
    const userEmailEl = document.getElementById("userEmail") || document.querySelector("[data-user-email]");
    const userRolEl = document.getElementById("userRol") || document.querySelector("[data-user-rol]");
    const fechaPerfilEl = document.getElementById("fechaPerfil") || document.querySelector("[data-user-created]");
    const logoutBtn = document.getElementById("logoutButton") || document.querySelector("[data-logout]");
    const volverBtn = document.getElementById("btnVolver") || document.querySelector(".btn-volver");
    const tutoriasContainer = document.getElementById("tutoriasListContainer") || document.querySelector("#tutoriasListContainer");
    const tutorEmptyMessage = document.getElementById("tutorEmptyMessage");

    const setText = (el, txt) => { if (el) el.textContent = txt; };

    // Nombre completo
    if (userNameEl) {
      const nombre = (usuario.nombre || "").trim();
      const apellido = (usuario.apellido || "").trim();
      setText(userNameEl, (nombre || apellido) ? `${nombre} ${apellido}`.trim() : "Usuario");
    }

    // Email y rol
    setText(userEmailEl, usuario.email || "—");
    setText(userRolEl, usuario.rol || "—");

    // Fecha de creación (format safe)
    if (fechaPerfilEl) {
      const createdAt = usuario.createdAt || usuario.created_at || usuario.created || usuario.createdDate || null;
      let formatted = "Fecha no disponible";
      if (createdAt) {
        const d = new Date(createdAt);
        if (!Number.isNaN(d.getTime())) {
          formatted = d.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
        }
      }
      setText(fechaPerfilEl, `Perfil creado el: ${formatted}`);
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        try { localStorage.removeItem("usuario"); } catch (e) {}
        window.location.href = "/login.html";
      });
    }

    if (!volverBtn) return;

    try {
      const cookie = document.cookie.split(';').map(s => s.trim()).find(s => s.startsWith('usuario='));
      if (!cookie) return;
      const raw = cookie.split('=')[1];
      const usuario = JSON.parse(atob(decodeURIComponent(raw)));
      const rol = (usuario.rol || '').toLowerCase();

      if (rol === 'estudiante') {
        volverBtn.href = 'gestion_estudiante.html';
      } else {
        volverBtn.href = 'gestion.html';
      }
    } catch (e) {
      console.warn('[btnVolver] No se pudo determinar el rol del usuario', e);
      volverBtn.href = 'gestion.html'; // fallback
    }

    // Mostrar tutorías: primero intentar fuente localStorage.tutorias (si existe), luego endpoint
    async function loadTutorias() {
      if (!tutoriasContainer) return;

      // estado carga
      tutoriasContainer.innerHTML = `<div class="small text-muted">Cargando tutorías...</div>`;

      // 1) fallback desde localStorage (útil en desarrollo)
      const rawList = localStorage.getItem("tutorias");
      if (rawList) {
        try {
          const parsed = JSON.parse(rawList);
          if (Array.isArray(parsed)) {
            renderTutorias(filterByUsuario(parsed));
            return;
          }
        } catch (e) { /* ignore */ }
      }

      // 2) intentar varias rutas comunes para el endpoint
      const endpoints = ["/tutorias", "/api/tutorias", "tutorias", "api/tutorias"];
      let list = null;
      for (const url of endpoints) {
        try {
          const resp = await fetch(url, { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
          if (!resp.ok) continue;
          const json = await resp.json().catch(() => null);
          if (Array.isArray(json)) { list = json; break; }
        } catch (e) {
          // intentar siguiente endpoint
        }
      }

      if (!Array.isArray(list)) {
        renderTutorias([]); // no pudo obtener datos
        return;
      }

      renderTutorias(filterByUsuario(list));
    }

    // Filtra tutorías por usuario actual usando heurísticas seguras
    function filterByUsuario(list) {
      if (!Array.isArray(list)) return [];
      const usuarioId = usuario.id || usuario._id || usuario.userId || usuario.usuarioId || null;
      const emailLower = (usuario.email || "").toLowerCase();
      const nombreFull = `${(usuario.nombre || "").trim()} ${(usuario.apellido || "").trim()}`.trim().toLowerCase();

      const byCreator = list.filter(t => {
        const creator = t.creatorId || t.creator || t.userId || t.ownerId || t.usuarioId || t.usuario || t.owner || null;
        if (!creator) return false;
        return String(creator) === String(usuarioId);
      });
      if (byCreator.length > 0) return byCreator;

      const byEmail = list.filter(t => (String(t.ownerEmail || t.email || t.contactEmail || "")).toLowerCase() === emailLower);
      if (byEmail.length > 0) return byEmail;

      const byName = list.filter(t => {
        const candidate = `${t.tutor || t.ownerName || t.creador || t.author || ""}`.toLowerCase();
        return nombreFull && candidate && candidate.includes(nombreFull);
      });
      if (byName.length > 0) return byName;

      // última opción: devolver lista vacía (evita mostrar tutorías ajenas)
      return [];
    }

    // Render: sólo nombres
    function renderTutorias(tutorias) {
      if (!tutoriasContainer) return;
      tutoriasContainer.innerHTML = "";
      const items = Array.isArray(tutorias) ? tutorias : [];

      if (items.length === 0) {
        if (tutorEmptyMessage) {
          tutorEmptyMessage.classList.remove("d-none");
          tutoriasContainer.appendChild(tutorEmptyMessage);
        } else {
          tutoriasContainer.innerHTML = `<div class="tutor-empty">No hay tutorías asociadas aún.</div>`;
        }
        return;
      }

      if (tutorEmptyMessage) tutorEmptyMessage.classList.add("d-none");

      items.forEach(t => {
        const nombre = t.titulo || t.nombre || t.title || t.name || "Sin título";
        const el = document.createElement("div");
        el.className = "list-group-item";
        el.textContent = nombre;
        tutoriasContainer.appendChild(el);
      });
    }

    // Lanzar carga
    loadTutorias();
  } catch (e) {
    console.error("Error en perfil:", e);
    try { window.location.href = "/login.html"; } catch (e) {}
  }
});

document.addEventListener('DOMContentLoaded', () => {

});

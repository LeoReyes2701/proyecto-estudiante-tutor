// Front/public/src/components/gestion/gestion.js
(() => {
  const id = (s) => document.getElementById(s);
  const btnCrearCuenta = id('btnCrearCuenta');
  const btnConsultarCuenta = id('btnConsultarCuenta');
  const btnCrearHorario = id('btnCrearHorario');
  const btnConsultarHorario = id('btnConsultarHorario');
  const btnConsultarPerfil = id('btnConsultarPerfil');
  const btnLogout = id('btnLogout');

  const modalEl = document.getElementById('modalResult');
  const modal = (modalEl && window.bootstrap) ? new bootstrap.Modal(modalEl, {}) : null;
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  function showModal(title, html) {
    if (!modal) {
      alert(title + '\n\n' + (html || ''));
      return;
    }
    modalTitle.textContent = title;
    modalBody.innerHTML = html || '';
    modal.show();
  }

  // Navegación a páginas existentes
  btnCrearCuenta?.addEventListener('click', () => window.location.href = '/crear-cuenta');
  btnCrearHorario?.addEventListener('click', () => window.location.href = '/'); // ajusta a tu crearHorario.html si existe

  // Consultar cuenta por email (prompt -> GET /auth/user/:email)
  btnConsultarCuenta?.addEventListener('click', async () => {
    const email = prompt('Introduce el correo institucional a buscar (ej: usuario@est.ucab.edu.ve):');
    if (!email) return;
    try {
      const res = await fetch(`/auth/user/${encodeURIComponent(email)}`);
      if (res.status === 404) {
        showModal('Cuenta no encontrada', `<div class="text-muted">No existe una cuenta con el correo ${email}</div>`);
        return;
      }
      if (!res.ok) throw new Error('Error al consultar cuenta');
      const json = await res.json();
      const html = `<pre style="white-space:pre-wrap;">${JSON.stringify(json, null, 2)}</pre>`;
      showModal('Cuenta encontrada', html);
    } catch (err) {
      console.error(err);
      showModal('Error', '<div class="text-danger">No se pudo consultar la cuenta. Intenta de nuevo.</div>');
    }
  });

  // Consultar horarios -> GET /api/schedules
  btnConsultarHorario?.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/schedules');
      if (!res.ok) throw new Error('Error cargando horarios');
      const arr = await res.json();
      if (!Array.isArray(arr) || arr.length === 0) {
        showModal('Horarios', '<div class="text-muted">No hay horarios registrados</div>');
        return;
      }
      const html = arr.map(s => {
        const slots = (s.slots || []).map(sl => `${sl.day} ${sl.start}-${sl.end}`).join('<br>');
        return `<div class="mb-3"><strong>${s.userId}</strong> <div class="small text-muted">${s.createdAt || ''}</div><div style="margin-top:6px">${slots}</div></div>`;
      }).join('<hr>');
      showModal('Horarios registrados', html);
    } catch (err) {
      console.error(err);
      showModal('Error', '<div class="text-danger">No se pudieron cargar los horarios</div>');
    }
  });

  // Consultar perfil -> GET /auth/profile
  btnConsultarPerfil?.addEventListener('click', async () => {
    try {
      const res = await fetch('/auth/profile', { credentials: 'include' });
      if (res.status === 401) {
        showModal('No autorizado', '<div class="text-danger">No has iniciado sesión o la sesión expiró</div>');
        return;
      }
      if (!res.ok) throw new Error('Error consultando perfil');
      const json = await res.json();
      const html = `<pre style="white-space:pre-wrap;">${JSON.stringify(json, null, 2)}</pre>`;
      showModal('Mi perfil', html);
    } catch (err) {
      console.error(err);
      showModal('Error', '<div class="text-danger">No se pudo cargar el perfil</div>');
    }
  });

  // Logout -> POST /auth/logout (intentar) y redirigir a /login
  btnLogout?.addEventListener('click', async () => {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      // ignore
    } finally {
      window.location.href = '/login';
    }
  });

  // Sanity: si el modal no se inicializó por falta de bootstrap, cargamos un fallback simple
  if (!modal && modalEl) {
    modalEl.style.display = 'none';
  }
})();

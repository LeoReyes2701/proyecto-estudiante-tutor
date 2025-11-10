// /src/components/gestion/gestion_estudiante.js
const btnConsultarPerfil = document.getElementById('btnConsultarPerfil');
const btnConsultarHorario = document.getElementById('btnConsultarHorario');
const btnConsultarTutoria = document.getElementById('btnConsultarTutoria');
const btnConsultarInscripcion = document.getElementById('btnConsultarInscripcion');
const btnInscribirseCurso = document.getElementById('btnInscribirseCurso');
const btnLogout = document.getElementById('btnLogout');

const modalEl = document.getElementById('modalResult');
const modal = modalEl ? new bootstrap.Modal(modalEl) : null;
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');

function openPage(url) {
  window.location.href = url;
}

function showModal(title, html) {
  if (!modal) {
    alert(title + '\n\n' + (typeof html === 'string' ? html : JSON.stringify(html)));
    return;
  }
  modalTitle.textContent = title || 'Resultado';
  modalBody.innerHTML = html || '';
  modal.show();
}

// Asociaciones: rutas destino (ajusta si tus archivos se llaman distinto)
btnConsultarPerfil?.addEventListener('click', () => openPage('/consultarPerfil.html'));
btnConsultarHorario?.addEventListener('click', () => openPage('/consultarHorario.html'));
btnConsultarTutoria?.addEventListener('click', () => openPage('/consultartutoria.html'));
btnConsultarInscripcion?.addEventListener('click', () => openPage('/InscribirseCurso.html'));

// Acción de inscribirse: por defecto redirige a /inscribirse.html
// Si prefieres que haga una petición POST, reemplaza la navegación por fetch POST.
btnInscribirseCurso?.addEventListener('click', () => {
  // Intentamos abrir una página de inscripción. Si no existe, mostramos modal con instrucción.
  const target = '/inscribirse.html';
  // comprobación simple: intentar navegar
  fetch(target, { method: 'HEAD' })
    .then(resp => {
      if (resp.ok) {
        openPage(target);
      } else {
        showModal('Inscripción', '<p>Página de inscripción no disponible. Contacta al administrador.</p>');
      }
    })
    .catch(() => {
      // fallback: mostrar modal
      showModal('Inscripción', '<p>Página de inscripción no disponible. Contacta al administrador.</p>');
    });
});

btnLogout?.addEventListener('click', () => {
  document.cookie = 'usuario=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
  window.location.href = '/login.html';
});

// Mostrar nombre / email en la cabecera si hay sesión
(async function fetchProfile(){
  try {
    const res = await fetch('/auth/profile', { credentials: 'same-origin' });
    if (!res.ok) return;
    const json = await res.json();
    if (json && json.ok && json.user) {
      const name = `${json.user.nombre || ''} ${json.user.apellido || ''}`.trim();
      const welcomeTitle = document.getElementById('welcomeTitle');
      if (welcomeTitle && name) welcomeTitle.textContent = `Hola, ${name}`;
      const sessionState = document.getElementById('sessionState');
      if (sessionState) sessionState.textContent = `Sesión: ${json.user.email || ''}`;
    }
  } catch (e) {
    console.debug('[gestion_estudiante] profile fetch failed', e);
  }
})();
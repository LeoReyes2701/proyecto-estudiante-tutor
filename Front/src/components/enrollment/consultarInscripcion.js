document.addEventListener('DOMContentLoaded', () => {
  // Referencias del DOM
  const nombreTutoria = document.getElementById('nombreTutoria');
  const descripcionTutoria = document.getElementById('descripcionTutoria');
  const nombreTutor = document.getElementById('nombreTutor');
  const emailTutor = document.getElementById('emailTutor');
  const horarioTutoria = document.getElementById('horarioTutoria');
  const fechaInscripcion = document.getElementById('fechaInscripcion');
  const cancelButton = document.getElementById('cancelButton');

  const emptyMessage = document.createElement('div');
  emptyMessage.className = 'text-center text-muted mt-4';
  document.querySelector('main').prepend(emptyMessage);

  const userId = "USR-12345"; // cambiar por el id del usuario actual

  // función principal para obtener los datos
  async function fetchInscripcion() {
    try {
      const [insRes, tutRes, userRes] = await Promise.all([
        fetch('/inscripciones', { headers: { 'Accept': 'application/json' } }),
        fetch('/tutorias', { headers: { 'Accept': 'application/json' } }),
        fetch('/auth/usuarios', { headers: { 'Accept': 'application/json' } })
      ]);

      if (!insRes.ok || !tutRes.ok || !userRes.ok) {
        console.error('Error al cargar información del servidor.');
        return showEmpty('Error al cargar los datos de inscripción.');
      }

      const [inscripciones, tutorias, usuarios] = await Promise.all([
        insRes.json(),
        tutRes.json(),
        userRes.json()
      ]);

      const inscripcion = inscripciones.find(i => i.userId === userId);
      if (!inscripcion) return showEmpty('No tienes inscripciones registradas.');

      const tutoria = tutorias.find(t => t.id === inscripcion.tutoriaId);
      if (!tutoria) return showEmpty('No se encontró la tutoría asociada.');

      const tutor = usuarios.find(u => u.id === tutoria.creadorId);

      renderInscripcion({ inscripcion, tutoria, tutor });
    } catch (error) {
      console.error('No se pudo conectar con el servidor:', error);
      showEmpty('No se pudo conectar con el servidor.');
    }
  }

  // Mostrar mensaje vacío o error
  function showEmpty(message) {
    emptyMessage.textContent = message || 'No hay inscripción disponible.';
    emptyMessage.classList.remove('d-none');
  }

  // Renderizar los datos de la inscripción
  function renderInscripcion({ inscripcion, tutoria, tutor }) {
    emptyMessage.classList.add('d-none');

    nombreTutoria.textContent = tutoria.titulo || tutoria.nombre || '—';
    descripcionTutoria.textContent = tutoria.descripcion || '—';
    nombreTutor.textContent = tutor ? `${tutor.nombre} ${tutor.apellido}` : '—';
    emailTutor.textContent = tutor ? tutor.email : '—';
    horarioTutoria.textContent = tutoria.horario || 'Horario no disponible';
    fechaInscripcion.textContent = new Date(inscripcion.fecha || Date.now()).toLocaleDateString();

    cancelButton.onclick = async () => {
      if (!confirm('¿Deseas cancelar tu inscripción?')) return;
      try {
        const res = await fetch(`/inscripciones/${inscripcion.id}`, { method: 'DELETE' });
        if (res.ok) {
          alert('Inscripción cancelada correctamente.');
          location.reload();
        } else {
          alert('Error al cancelar la inscripción.');
        }
      } catch (err) {
        console.error('Error al cancelar inscripción:', err);
        alert('Error de conexión con el servidor.');
      }
    };
  }

  //Inicializar
  fetchInscripcion();
});

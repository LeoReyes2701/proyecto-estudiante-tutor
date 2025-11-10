document.addEventListener('DOMContentLoaded', async () => {
  const nombreTutoriaEl = document.getElementById('nombreTutoria');
  const descripcionTutoriaEl = document.getElementById('descripcionTutoria');
  const nombreTutorEl = document.getElementById('nombreTutor');
  const emailTutorEl = document.getElementById('emailTutor');
  const horarioTutoriaEl = document.getElementById('horarioTutoria');
  const fechaInscripcionEl = document.getElementById('fechaInscripcion');
  const cancelBtn = document.getElementById('cancelButton');
  const currentUserId = localStorage.getItem('userId');

  // helper para mostrar mensaje simple
  function setError(msg) {
    nombreTutoriaEl.textContent = msg;
    descripcionTutoriaEl.textContent = '-';
    nombreTutorEl.textContent = '-';
    emailTutorEl.textContent = '-';
    horarioTutoriaEl.textContent = '-';
    fechaInscripcionEl.textContent = '-';
    cancelBtn.disabled = true;
  }

  try {
    // Llamada al endpoint que devuelve las inscripciones del usuario actual
    const res = await fetch('/inscripciones/me', { credentials: 'same-origin' });
    if (!res.ok) {
      if (res.status === 401) setError('No autenticado');
      else setError('No se pudieron cargar las inscripciones');
      return;
    }

    const inscripciones = await res.json();
    if (!Array.isArray(inscripciones) || inscripciones.length === 0) {
      setError('No tienes inscripciones activas');
      return;
    }

    // Tomar la primera inscripción (ajusta si quieres listar todas)
    const inscripcion = inscripciones[0];
    if (!inscripcion || !inscripcion.tutoriaId) {
      setError('Inscripción inválida');
      return;
    }

    // Obtener datos de la tutoría
    const tutoriaRes = await fetch(`/tutorias/${inscripcion.tutoriaId}`);
    const tutoria = tutoriaRes.ok ? await tutoriaRes.json() : null;

    nombreTutoriaEl.textContent = tutoria ? (tutoria.nombre || tutoria.titulo || 'Tutoría') : 'Tutoría no encontrada';
    descripcionTutoriaEl.textContent = tutoria ? (tutoria.descripcion || '') : '';
    nombreTutorEl.textContent = tutoria ? (tutoria.creadorNombre || tutoria.creadorId || '-') : '-';
    emailTutorEl.textContent = tutoria ? (tutoria.creadorNombre || '-') : '-';
    horarioTutoriaEl.textContent = tutoria ? (tutoria.horarioId || '-') : '-';
    fechaInscripcionEl.textContent = inscripcion.createdAt ? new Date(inscripcion.createdAt).toLocaleString() : '-';

    cancelBtn.disabled = false;

    cancelBtn.addEventListener('click', async () => {
      if (!confirm('¿Deseas cancelar esta inscripción?')) return;
      try {
        const delRes = await fetch(`/inscripciones/${inscripcion.id}`, { method: 'DELETE' });
        if (delRes.ok) {
          alert('Inscripción cancelada');
          location.reload();
        } else {
          const b = await delRes.json().catch(()=>({}));
          alert(b.error || 'No se pudo cancelar');
        }
      } catch (err) {
        console.error('Error cancelando', err);
        alert('Error de conexión');
      }
    });

  } catch (err) {
    console.error('Error obteniendo inscripción', err);
    setError('Error de conexión con el servidor');
  }
});

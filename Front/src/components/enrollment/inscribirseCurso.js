document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.row');
  const btnInscribirse = document.querySelector('.btn-ucab-primary');
  const currentUserId = localStorage.getItem('userId');

  const message = document.createElement('div');
  message.className = 'text-center mt-4 text-muted fs-5';
  container.parentElement.appendChild(message);

  message.textContent = 'Cargando tutorías...';

  try {
    const [usuariosRes, tutoriasRes, inscripcionesRes] = await Promise.all([
      fetch('/usuarios'),
      fetch('/tutorias'),
      fetch('/inscripciones')
    ]);

    if (!usuariosRes.ok || !tutoriasRes.ok || !inscripcionesRes.ok) {
      const errMsg = 'Error al cargar datos del servidor';
      console.error(errMsg, { usuariosRes, tutoriasRes, inscripcionesRes });
      message.textContent = errMsg;
      return;
    }

    const usuarios = await usuariosRes.json();
    const tutorias = await tutoriasRes.json();
    const inscripciones = await inscripcionesRes.json();

    const usuarioActual = usuarios.find(u => String(u.id) === String(currentUserId));
    if (!usuarioActual) {
      message.textContent = 'Error: usuario no encontrado.';
      return;
    }

    // Tutorías donde el usuario YA está inscrito
    const tutoriasInscritas = inscripciones
      .filter(i => String(i.userId) === String(currentUserId))
      .map(i => String(i.tutoriaId));

    // Mostrar todas las tutorías que el usuario NO está inscrito (sin comprobar cupos)
    const disponibles = tutorias.filter(t => !tutoriasInscritas.includes(String(t.id)));

    renderTutorias(disponibles, inscripciones);

    if (disponibles.length === 0) {
      message.textContent = 'No hay tutorías para las que no estés inscrito.';
      return;
    }

    message.textContent = '';
  } catch (error) {
    console.error('Error al cargar datos:', error);
    message.textContent = 'Error al conectar con el servidor.';
  }

  function renderTutorias(tutorias) {
    container.innerHTML = '';

    tutorias.forEach(tutoria => {
      const card = document.createElement('div');
      card.className = 'col';
      card.innerHTML = `
        <div class="card p-4 border rounded-3 shadow-sm h-100 d-flex flex-column justify-content-start align-items-center">
          <h3 class="fw-medium fs-4 mb-0">${tutoria.nombre || tutoria.titulo || 'Tutoria'}</h3>
          <p class="text-secondary mb-2">${tutoria.descripcion || ''}</p>
          <div class="form-check mt-2">
            <input class="form-check-input" type="checkbox" value="${tutoria.id}" id="check-${tutoria.id}" style="width: 20px; height: 20px;">
            <label class="form-check-label ms-1" for="check-${tutoria.id}">Seleccionar</label>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Evento de inscripción
  if (btnInscribirse) {
    btnInscribirse.addEventListener('click', async () => {
      const seleccionadas = Array.from(document.querySelectorAll('.form-check-input:checked'))
        .map(chk => chk.value);

      if (seleccionadas.length === 0) {
        alert('Debes seleccionar al menos una tutoría.');
        return;
      }

      try {
        const res = await fetch('/inscripciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            tutoriaIds: seleccionadas
          })
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          alert(data.message || 'Inscripción realizada');
          location.reload();
        } else {
          alert(data.error || data.message || 'Error en la inscripción');
        }
      } catch (error) {
        console.error('Error al enviar inscripción:', error);
        alert('Error de conexión con el servidor.');
      }
    });
  }
});

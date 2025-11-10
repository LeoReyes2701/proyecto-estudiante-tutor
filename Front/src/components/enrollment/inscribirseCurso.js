document.addEventListener('DOMContentLoaded', async () => {
  const container = document.querySelector('.row');
  const btnInscribirse = document.querySelector('.btn-ucab-primary');
  const currentUserId = localStorage.getItem('userId');


  const message = document.createElement('div');
  message.className = 'text-center mt-4 text-muted fs-5';
  container.parentElement.appendChild(message);

  message.textContent = 'Cargando tutorías disponibles...';

  try {
    // Obtener datos desde el backend sin CORS (misma URL base)
    const [usuariosRes, tutoriasRes, inscripcionesRes] = await Promise.all([
      fetch('/usuarios'),
      fetch('/tutorias'),
      fetch('/inscripciones')
    ]);

    if (!usuariosRes.ok || !tutoriasRes.ok || !inscripcionesRes.ok) {
      throw new Error('Error al cargar datos');
    }

    const usuarios = await usuariosRes.json();
    const tutorias = await tutoriasRes.json();
    const inscripciones = await inscripcionesRes.json();

    const usuarioActual = usuarios.find(u => u.id === currentUserId);
    if (!usuarioActual) {
      message.textContent = 'Error: usuario no encontrado.';
      return;
    }

    // Obtener tutorías donde ya está inscrito
    const tutoriasInscritas = inscripciones
      .filter(i => i.userId === currentUserId)
      .map(i => i.tutoriaId);

    // Filtrar tutorías disponibles
    const disponibles = tutorias.filter(t => {
      const inscritos = inscripciones.filter(i => i.tutoriaId === t.id).length;
      const hayCupos = inscritos < t.cupos;
      const noInscrito = !tutoriasInscritas.includes(t.id);
      return hayCupos && noInscrito;
    });

    renderTutorias(disponibles, inscripciones);

    if (disponibles.length === 0) {
      message.textContent = 'No hay tutorías disponibles para inscribirte.';
      return;
    }

    message.textContent = '';
  } catch (error) {
    console.error('Error al cargar datos:', error);
    message.textContent = 'Error al conectar con el servidor.';
  }

  // Mostrar tarjetas de tutorías
  function renderTutorias(tutorias, inscripciones) {
    container.innerHTML = '';

    tutorias.forEach(tutoria => {
      const inscritos = inscripciones.filter(i => i.tutoriaId === tutoria.id).length;
      const cuposRestantes = tutoria.cupos - inscritos;

      const card = document.createElement('div');
      card.className = 'col';
      card.innerHTML = `
        <div class="card p-4 border rounded-3 shadow-sm h-100 d-flex flex-column justify-content-start align-items-center">
          <h3 class="fw-medium fs-4 mb-0">${tutoria.nombre}</h3>
          <p class="text-secondary mb-2">Cupos disponibles: ${cuposRestantes}</p>
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

      const data = await res.json();

      if (res.ok) {
        alert(` ${data.message}`);
        location.reload();
      } else {
        alert(` Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error al enviar inscripción:', error);
      alert('Error de conexión con el servidor.');
    }
  });
});

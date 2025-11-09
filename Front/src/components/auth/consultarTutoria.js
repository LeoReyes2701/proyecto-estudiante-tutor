document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('tutoriasContainer');
  const emptyMessage = document.getElementById('emptyMessage');

  async function fetchTutorias() {
    try {
      const res = await fetch('/tutorias', { method: 'GET', headers: { 'Accept': 'application/json' }});
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Error al obtener tutorías:', err);
        showEmpty('Error al cargar tutorías');
        return;
      }
      const tutorias = await res.json();
      renderTutorias(tutorias);
    } catch (error) {
      console.error('No se pudo conectar con el servidor:', error);
      showEmpty('No se pudo conectar con el servidor');
    }
  }

  function showEmpty(message) {
    container.innerHTML = '';
    emptyMessage.classList.remove('d-none');
    emptyMessage.textContent = message || 'No hay tutorías registradas aún.';
  }

  function renderTutorias(tutorias) {
    container.innerHTML = '';

    if (!Array.isArray(tutorias) || tutorias.length === 0) {
      emptyMessage.classList.remove('d-none');
      return;
    }

    emptyMessage.classList.add('d-none');

    tutorias.forEach((tutoria, idx) => {
      const col = document.createElement('div');
      col.className = 'col-12 col-md-6';

      const card = document.createElement('div');
      card.className = 'card shadow-sm h-100';

      const cardBody = document.createElement('div');
      cardBody.className = 'card-body d-flex flex-column';

      const title = document.createElement('h5');
      title.className = 'card-title mb-2';
      title.textContent = tutoria.nombre || `Tutoria ${idx + 1}`;

      const desc = document.createElement('p');
      desc.className = 'card-text text-muted mb-3';
      desc.textContent = tutoria.descripcion || '';

      const cupos = document.createElement('p');
      cupos.className = 'mb-2';
      cupos.innerHTML = `<strong>Cupos:</strong> ${tutoria.cupos ?? '-'}`;

      const horariosList = document.createElement('ul');
      horariosList.className = 'list-unstyled mb-0';
      if (Array.isArray(tutoria.horarios) && tutoria.horarios.length > 0) {
        tutoria.horarios.forEach(h => {
          const li = document.createElement('li');
          li.textContent = `${h.dia} — ${h.hora}`;
          horariosList.appendChild(li);
        });
      } else {
        const li = document.createElement('li');
        li.textContent = 'No hay horarios registrados';
        horariosList.appendChild(li);
      }

      cardBody.appendChild(title);
      cardBody.appendChild(desc);
      cardBody.appendChild(cupos);
      cardBody.appendChild(horariosList);

      card.appendChild(cardBody);
      col.appendChild(card);
      container.appendChild(col);
    });
  }

  // Inicializar
  fetchTutorias();
});

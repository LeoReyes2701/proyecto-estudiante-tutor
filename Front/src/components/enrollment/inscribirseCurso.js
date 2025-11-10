// /src/components/enrollment/inscribirseCurso.js
document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('cursoGrid');
  const btn = document.getElementById('btnInscribirse');
  const msg = document.getElementById('inscripcionMsg');

  const showMessage = (text, type = 'info') => {
    msg.textContent = text;
    msg.className = type === 'error' ? 'error' : '';
  };

  const getUsuarioId = () => {
    try {
      const raw = localStorage.getItem('usuario');
      if (!raw) return null;
      const obj = JSON.parse(raw);
      return obj.id || obj.userId || null;
    } catch {
      return null;
    }
  };

  const inscribir = async (tutoriaId, estudianteId) => {
    const res = await fetch('/inscripcion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tutoriaId, estudianteId })
    });
    return res.json();
  };

  const renderCursos = (tutorias = []) => {
    grid.innerHTML = '';
    if (!tutorias.length) {
      showMessage('No hay tutorías disponibles en este momento.', 'error');
      return;
    }

    tutorias.forEach(tutoria => {
      const col = document.createElement('div');
      col.className = 'col';

      const card = document.createElement('div');
      card.className = 'card p-4 border rounded-3 shadow-sm h-100 d-flex flex-column justify-content-start align-items-center';

      const h3 = document.createElement('h3');
      h3.className = 'fw-medium fs-4 mb-0 text-center';
      h3.textContent = tutoria.titulo;

      const p = document.createElement('p');
      p.className = 'text-muted mt-2 mb-1 text-center';
      p.style.fontSize = '0.9rem';
      p.textContent = `Cupo: ${tutoria.estudiantesInscritos?.length || 0} / ${tutoria.cupo}`;

      const checkDiv = document.createElement('div');
      checkDiv.className = 'form-check mt-2';

      const input = document.createElement('input');
      input.className = 'form-check-input';
      input.type = 'checkbox';
      input.id = `check-${tutoria.id}`;
      input.dataset.tutoriaId = tutoria.id;

      const label = document.createElement('label');
      label.className = 'form-check-label ms-1';
      label.htmlFor = input.id;
      label.textContent = 'Seleccionar';

      checkDiv.appendChild(input);
      checkDiv.appendChild(label);

      card.appendChild(h3);
      card.appendChild(p);
      card.appendChild(checkDiv);
      col.appendChild(card);
      grid.appendChild(col);
    });
  };

  const loadTutorias = async () => {
    try {
      const res = await fetch('/tutorias');
      if (!res.ok) throw new Error('Error al cargar tutorías');
      const tutorias = await res.json();
      renderCursos(tutorias);
    } catch (err) {
      console.error('[loadTutorias]', err);
      showMessage('No se pudieron cargar las tutorías.', 'error');
    }
  };

  btn.addEventListener('click', async () => {
    showMessage('');
    const estudianteId = getUsuarioId();
    if (!estudianteId) {
      showMessage('No hay sesión activa. Inicia sesión como estudiante.', 'error');
      return;
    }

    const seleccionados = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
    if (!seleccionados.length) {
      showMessage('Selecciona al menos un curso para inscribirte.', 'error');
      return;
    }

    let successCount = 0;
    for (const input of seleccionados) {
      const tutoriaId = input.dataset.tutoriaId;
      try {
        const result = await inscribir(tutoriaId, estudianteId);
        if (result.error) {
          console.warn(`[${tutoriaId}]`, result.error);
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`[${tutoriaId}]`, err);
      }
    }

    if (successCount > 0) {
      showMessage(`Inscripción completada en ${successCount} curso(s).`);
      await loadTutorias(); // recargar para actualizar cupos
    } else {
      showMessage('No se pudo completar la inscripción.', 'error');
    }
  });

  loadTutorias();
});

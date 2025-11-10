(async function () {
  const listEl = document.getElementById('horario-list');
  const btnConfirmar = document.getElementById('btn-confirmar');
  const btnVolver = document.getElementById('btn-volver');
  const messageEl = document.getElementById('modal-message') || document.getElementById('message');
  const loadingIndicator = document.getElementById('loading-indicator');

  function setMessage(txt, isError = false) {
    if (!messageEl) return;
    messageEl.textContent = txt;
    messageEl.className = isError ? 'text-center text-danger mb-3' : 'text-center muted mb-3';
  }

  function showAlert(msg, type = 'danger') {
    const temp = document.createElement('div');
    temp.className = `alert ${type === 'success' ? 'alert-success' : 'alert-danger'} alert-dismissible fade show fixed-top mt-2 mx-auto`;
    temp.style.width = '80%';
    temp.style.zIndex = '1050';
    temp.innerHTML = `${msg}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    document.body.appendChild(temp);
    setTimeout(() => {
      const inst = bootstrap.Alert.getInstance(temp) || new bootstrap.Alert(temp);
      inst.close();
    }, 4000);
  }

  async function safeFetch(url, opts = {}) {
    try {
      const res = await fetch(url, Object.assign({ credentials: 'same-origin' }, opts));
      const text = await res.text().catch(() => '');
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch (e) { json = null; }
      return { ok: res.ok, status: res.status, json, text };
    } catch (err) {
      return { ok: false, status: 0, json: null, text: null, error: err };
    }
  }

  // Leer selección
  const raw = sessionStorage.getItem('selectedTutorias');
  let payload = null;
  try { payload = raw ? JSON.parse(raw) : null; } catch (e) {
    setMessage('Selección inválida. Vuelve a seleccionar las tutorías.', true); return;
  }
  if (!payload || !payload.userId || !Array.isArray(payload.tutoriaIds) || payload.tutoriaIds.length === 0) {
    setMessage('No hay tutorías seleccionadas. Regresa y selecciona al menos una.', true); return;
  }
  const userId = String(payload.userId);
  const tutoriaIds = payload.tutoriaIds.map(String);

  if (loadingIndicator) loadingIndicator.classList.remove('d-none');
  setMessage('Cargando detalles de las tutorías seleccionadas...');

  // Obtener tutorías
  const tutoriaPromises = tutoriaIds.map(id => safeFetch('/tutorias/' + encodeURIComponent(id)));
  const tutoriaResults = await Promise.all(tutoriaPromises);
  const tutorias = [];
  for (let i = 0; i < tutoriaResults.length; i++) {
    const r = tutoriaResults[i];
    if (!r.ok || !r.json) {
      console.warn('Tutoria no encontrada o error para id', tutoriaIds[i], r);
      continue;
    }
    tutorias.push(r.json);
  }
  if (tutorias.length === 0) {
    setMessage('No se encontraron las tutorías seleccionadas. Regresa y selecciona de nuevo.', true);
    if (loadingIndicator) loadingIndicator.classList.add('d-none');
    return;
  }

  // Obtener todos los horarios y luego filtrar por tutorId === tutoria.creadorId
  const horariosResp = await safeFetch('/horarios');
  const horariosAll = (horariosResp.ok && Array.isArray(horariosResp.json)) ? horariosResp.json : [];

  const estado = {}; // { tutoriaId: { selectedOptionId, selectedHorarioId, opciones: [...] } }
  listEl.innerHTML = '';

  tutorias.forEach(tutoria => {
    // Filtrar schedules donde tutorId coincide con creadorId de la tutoria
    const matchedSchedules = horariosAll.filter(h => String(h.tutorId) === String(tutoria.creadorId));
    // Convertir cada slot en opción
    const opciones = [];
    matchedSchedules.forEach(s => {
      if (Array.isArray(s.slots) && s.slots.length) {
        s.slots.forEach((slot, si) => {
          opciones.push({
            horarioId: s.id,
            optionId: `${s.id}::${si}`,
            day: slot.day,
            horaInicio: slot.horaInicio,
            horaFin: slot.horaFin,
            lugar: slot.lugar || null
          });
        });
      }
    });

    estado[String(tutoria.id)] = { selectedOptionId: null, selectedHorarioId: null, opciones };

    const card = document.createElement('div');
    card.className = 'card mb-3 p-3';
    const title = document.createElement('h5');
    title.textContent = tutoria.titulo || tutoria.nombre || ('Tutoria ' + tutoria.id);
    card.appendChild(title);
    if (tutoria.descripcion) {
      const p = document.createElement('p'); p.className = 'text-muted mb-2'; p.textContent = tutoria.descripcion; card.appendChild(p);
    }

    if (opciones.length === 0) {
      const noH = document.createElement('div');
      noH.className = 'p-3 bg-warning-subtle border rounded text-muted';
      noH.textContent = 'No se encontraron horarios asociados a esta tutoría.';
      card.appendChild(noH);
    } else {
      const ul = document.createElement('div'); ul.className = 'list-group';
      opciones.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        item.dataset.optionId = opt.optionId;
        item.dataset.horarioId = opt.horarioId;
        const left = document.createElement('div');
        left.innerHTML = `<strong>${opt.day}</strong> — ${opt.horaInicio} - ${opt.horaFin}${opt.lugar ? ' • ' + opt.lugar : ''}`;
        item.appendChild(left);
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline-primary';
        btn.textContent = 'Seleccionar';
        btn.type = 'button';
        btn.addEventListener('click', () => {
          ul.querySelectorAll('button').forEach(b => { b.className = 'btn btn-sm btn-outline-primary'; b.textContent = 'Seleccionar'; });
          ul.querySelectorAll('.list-group-item').forEach(li => li.classList.remove('active'));
          btn.className = 'btn btn-sm btn-success'; btn.textContent = 'Seleccionado'; item.classList.add('active');
          estado[String(tutoria.id)].selectedOptionId = opt.optionId;
          estado[String(tutoria.id)].selectedHorarioId = opt.horarioId;
          const any = Object.values(estado).some(v => v.selectedOptionId);
          btnConfirmar.disabled = !any;
        });
        item.appendChild(btn);
        ul.appendChild(item);
      });
      card.appendChild(ul);
    }

    const footer = document.createElement('div'); footer.className = 'mt-2 text-muted small'; footer.textContent = 'ID tutoría: ' + tutoria.id; card.appendChild(footer);
    listEl.appendChild(card);
  });

  if (loadingIndicator) loadingIndicator.classList.add('d-none');
  setMessage('Selecciona horario(s) para las tutorías y presiona Confirmar.');

  if (btnVolver) btnVolver.addEventListener('click', () => { location.href = '/seleccionar_tutorias.html'; });

  btnConfirmar.addEventListener('click', async () => {
    const selections = Object.entries(estado)
      .map(([tId, st]) => st.selectedOptionId ? { tutoriaId: tId, horarioId: st.selectedHorarioId } : null)
      .filter(Boolean);

    if (selections.length === 0) { showAlert('Debes seleccionar al menos un horario para confirmar.', 'danger'); return; }

    const body = selections.every(s => s.horarioId)
      ? { userId, inscripciones: selections.map(s => ({ tutoriaId: s.tutoriaId, horarioId: s.horarioId })) }
      : { userId, tutoriaIds: selections.map(s => s.tutoriaId) };

    btnConfirmar.disabled = true;
    const oldTxt = btnConfirmar.textContent; btnConfirmar.textContent = 'Enviando...';

    const res = await safeFetch('/inscripciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

    if (res.ok) {
      showAlert('Inscripciones realizadas correctamente.', 'success');
      sessionStorage.removeItem('selectedTutorias');
      setTimeout(() => location.href = '/gestion_estudiante.html', 900);
    } else {
      console.error('Error al crear inscripciones', res);
      let errMsg = 'No se pudo completar la inscripción.'; if (res.json && res.json.error) errMsg = res.json.error; if (res.status === 401) errMsg = 'No autenticado.';
      showAlert(errMsg, 'danger');
      btnConfirmar.disabled = false; btnConfirmar.textContent = oldTxt;
    }
  });
})();

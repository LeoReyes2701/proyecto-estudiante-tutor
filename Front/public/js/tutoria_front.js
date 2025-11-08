document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('create-form');
  const alertPlaceholder = document.getElementById('alertPlaceholder');
  const clearBtn = document.getElementById('clearBtn');

  function showAlert(message, type = 'success') {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>`;
    alertPlaceholder.innerHTML = '';
    alertPlaceholder.append(wrapper);
  }

  function isoFromDateTimeLocal(value) {
    return value ? new Date(value).toISOString() : null;
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const title = form.title.value.trim();
    const description = form.description.value.trim();
    const startTime = isoFromDateTimeLocal(form.start.value);
    const endTime = isoFromDateTimeLocal(form.end.value);
    const weekday = form.weekday.value || null;
    const capacity = form.capacity.value ? Number(form.capacity.value) : undefined;

    if (!title || !startTime || !endTime) {
      showAlert('Título, inicio y fin son obligatorios.', 'warning');
      return;
    }

    if (new Date(startTime) >= new Date(endTime)) {
      showAlert('La hora de fin debe ser posterior a la de inicio.', 'warning');
      return;
    }

    const payload = { title, description, startTime, endTime, weekday, capacity };
    const token = localStorage.getItem('token') || '';

    try {
      const res = await fetch('/tutorias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        showAlert(`Tutoría creada. ID: ${data.id}`, 'success');
        form.reset();
      } else {
        const err = await res.json();
        showAlert(`Error: ${err.error || err.message}`, 'danger');
      }
    } catch (e) {
      showAlert(`Error de red: ${e.message}`, 'danger');
    }
  });

  clearBtn.addEventListener('click', () => form.reset());
});

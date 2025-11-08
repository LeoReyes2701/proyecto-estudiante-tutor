document.addEventListener('DOMContentLoaded', () => {
    const scheduleCards = document.querySelectorAll('.schedule-card');
    const form = document.getElementById('createTutoriaForm');
    const horarioError = document.getElementById('horarioError');

    // Selección de horarios
    scheduleCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('selected');

            const selectedCount = document.querySelectorAll('.schedule-card.selected').length;
            if (horarioError) {
                horarioError.classList.toggle('d-none', selectedCount > 0);
            }
        });
    });

    // Envío del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        let isValid = true;

        const nombre = document.getElementById('nombreTutoria').value.trim();
        const descripcion = document.getElementById('descripcionTutoria').value.trim();
        const numCuposInput = document.getElementById('numeroCupos');
        const numCupos = parseInt(numCuposInput.value);
        const selectedSchedules = document.querySelectorAll('.schedule-card.selected');

        // Validaciones
        if (!nombre || !descripcion) {
            console.error("Error: Nombre y descripción son obligatorios.");
            isValid = false;
        }

        if (isNaN(numCupos) || numCupos < 10 || numCupos > 20) {
            console.error("Error: El número de cupos debe estar entre 10 y 20.");
            isValid = false;
        }

        if (selectedSchedules.length === 0) {
            if (horarioError) horarioError.classList.remove('d-none');
            console.error("Error: Debe seleccionar al menos un horario.");
            isValid = false;
        } else {
            if (horarioError) horarioError.classList.add('d-none');
        }

        // Envío al backend
        if (isValid) {
            const horariosSeleccionados = Array.from(selectedSchedules).map(card => ({
                dia: card.getAttribute('data-dia'),
                hora: card.getAttribute('data-hora')
            }));

            const body = {
                nombre,
                cupos: numCupos,
                descripcion,
                horarios: horariosSeleccionados
            };

            console.log("Enviando datos al backend:", body);

            fetch('/tutorias', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })
            .then(async res => {
                const data = await res.json();
                if (res.ok) {
                    alert(data.message || 'Tutoría creada exitosamente');
                    form.reset();
                    document.querySelectorAll('.schedule-card.selected').forEach(card => card.classList.remove('selected'));
                } else {
                    alert(data.error || 'Error al crear la tutoría');
                }
            })
            .catch(err => {
                console.error('Error de conexión:', err);
                alert('No se pudo conectar con el servidor');
            });
        }
    });
});

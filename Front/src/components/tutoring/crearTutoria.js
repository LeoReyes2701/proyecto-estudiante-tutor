document.addEventListener('DOMContentLoaded', () => {
    const scheduleCards = document.querySelectorAll('.schedule-card');
    const form = document.getElementById('createTutoriaForm');
    
    const horarioError = document.getElementById('horarioError');

    scheduleCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('selected');
            
            const selectedCount = document.querySelectorAll('.schedule-card.selected').length;
            if (horarioError) {
                if (selectedCount > 0) {
                    horarioError.classList.add('d-none');
                }
            }
        });
    });

    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;

        const numCuposInput = document.getElementById('numeroCupos');
        const numCupos = parseInt(numCuposInput.value);
        
        if (numCupos < 10 || numCupos > 20 || isNaN(numCupos)) {
            console.error("Error de Validación: El número de cupos debe estar entre 10 y 20.");
            isValid = false;
        }

        const selectedSchedules = document.querySelectorAll('.schedule-card.selected');
        
        if (selectedSchedules.length === 0) {
            if (horarioError) {
                horarioError.classList.remove('d-none'); 
            }
            isValid = false;
            console.error("Error de Validación: Debe seleccionar al menos un horario.");
        } else {
            if (horarioError) {
                horarioError.classList.add('d-none'); 
            }
        }

        if (isValid) {
            const horariosSeleccionados = Array.from(selectedSchedules).map(card => ({
                dia: card.getAttribute('data-dia'),
                hora: card.getAttribute('data-hora')
            }));

            console.log("¡Tutoría validada y lista para ser creada!");
            console.log("--- Datos a enviar ---");
            console.log("Nombre:", document.getElementById('nombreTutoria').value);
            console.log("Cupos:", numCupos);
            console.log("Descripción:", document.getElementById('descripcionTutoria').value);
            console.log("Horarios:", horariosSeleccionados);
            console.log("----------------------");
            
            // Aquí se integraría la lógica para enviar los datos a un backend real.
        }
    });
});
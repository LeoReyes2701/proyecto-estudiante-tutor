document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createHorarioForm');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const inicio = document.getElementById('horaInicio').value;
        const fin = document.getElementById('horaFin').value;
        const dia = document.getElementById('diaSemana').value.toLowerCase(); // backend espera en minúsculas
        
        let isValid = true;
        
        // Validación de campos vacíos
        if (inicio === "" || fin === "" || dia === "") {
            alertPlaceholder('Por favor, selecciona un día, hora de inicio y hora de fin.', 'warning');
            isValid = false;
        } 
        
        // Validación de lógica: La hora de inicio debe ser estrictamente anterior a la hora de fin.
        if (isValid && inicio >= fin) {
            console.error("Error: La hora de inicio debe ser anterior a la hora de fin.");
            alertPlaceholder('Error: La hora de inicio debe ser anterior a la hora de fin.', 'danger');
            isValid = false;
        }

        if (isValid) {
            try {
                // 🚀 Enviar al backend
                const response = await fetch("http://localhost:3000/schedules", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        day: dia,
                        start: inicio,
                        end: fin
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    alertPlaceholder("❌ Error al crear horario: " + errorData.error, "danger");
                    return;
                }

                const data = await response.json();
                alertPlaceholder("✅ Horario creado con éxito: " + dia + ", de " + inicio + " a " + fin, "success");
                console.log("Horario guardado en backend:", data);
                form.reset();

            } catch (err) {
                console.error("Error de conexión:", err);
                alertPlaceholder("❌ No se pudo conectar con el servidor", "danger");
            }
        }
    });

    // Función para mostrar un mensaje temporal (reemplaza alert())
    function alertPlaceholder(message, type) {
        let alertDiv = document.getElementById('tempAlert');
        
        if (alertDiv) {
            alertDiv.remove();
        }

        alertDiv = document.createElement('div');
        alertDiv.id = 'tempAlert';
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 w-75 w-md-50`;
        alertDiv.role = 'alert';
        alertDiv.style.zIndex = '1050'; 

        alertDiv.innerHTML = `<strong>${message}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            const currentAlert = document.getElementById('tempAlert');
            if(currentAlert) {
                new bootstrap.Alert(currentAlert).close();
            }
        }, 4000);
    }
});
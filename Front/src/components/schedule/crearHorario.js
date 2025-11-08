document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('createHorarioForm');

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const inicio = document.getElementById('horaInicio').value;
                const fin = document.getElementById('horaFin').value;
                const dia = document.getElementById('diaSemana').value;
                
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
                    // Simulación de envío exitoso
                    alertPlaceholder('Horario creado con éxito: ' + dia + ', de ' + inicio + ' a ' + fin, 'success');
                    console.log("Horario válido. Datos a enviar:", { dia, inicio, fin });
                    form.reset();
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
                // Posición fija centrada en la parte superior
                alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 w-75 w-md-50`;
                alertDiv.role = 'alert';
                alertDiv.style.zIndex = '1050'; 

                alertDiv.innerHTML = `<strong>${message}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
                
                document.body.appendChild(alertDiv);
                
                // Desaparecer automáticamente después de 4 segundos
                setTimeout(() => {
                    const currentAlert = document.getElementById('tempAlert');
                    if(currentAlert) {
                        new bootstrap.Alert(currentAlert).close();
                    }
                }, 4000);
            }
});
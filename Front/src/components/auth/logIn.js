function setupPasswordToggle() {
    const togglePassword = document.querySelector('#togglePassword');
    const passwordInput = document.querySelector('#passwordInput');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function (e) {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
        });
    }
}


document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggle();
    
    // NOTA: Aquí iría la lógica de inicio de sesión cuando se presiona el botón Submit.
});
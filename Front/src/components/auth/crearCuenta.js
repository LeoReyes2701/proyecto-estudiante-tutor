function setupPasswordToggle(toggleId, inputId) {
    const toggle = document.querySelector(`#${toggleId}`);
    const input = document.querySelector(`#${inputId}`);
    
    if (toggle && input) {
        // El toggle es invisible (controlado por CSS), pero el cursor indica que es cliqueable.
        toggle.addEventListener('click', function (e) {
            // Alterna entre el tipo 'password' y 'text'
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
        });
    }
}

function setupRoleSelection() {
    const roleButtons = document.querySelectorAll('.role-selection .btn');

    roleButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.add('active-role');
        });
    });
}

function setupFormValidation() {
    form.addEventListener('submit', function(e) {
        const isRoleSelected = Array.from(roleButtons).some(btn => btn.classList.contains('active-role'));

        if (!isRoleSelected) {
            e.preventDefault(); 
        }
    });
}


document.addEventListener('DOMContentLoaded', function() {
    
    setupPasswordToggle('togglePassword1', 'passwordInput');
    setupPasswordToggle('togglePassword2', 'confirmPasswordInput');
    setupRoleSelection();
});
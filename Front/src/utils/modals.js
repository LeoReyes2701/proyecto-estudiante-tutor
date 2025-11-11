// Utility para crear modales de confirmación y alertas estilizados
class ModalManager {
  constructor() {
    this.modalCounter = 0;
    this.ensureModalContainer();
  }

  ensureModalContainer() {
    if (!document.getElementById('modal-container')) {
      const container = document.createElement('div');
      container.id = 'modal-container';
      document.body.appendChild(container);
    }
  }

  createModal(options = {}) {
    const {
      title = 'Confirmación',
      message = '',
      type = 'info', // info, success, warning, error, confirm
      confirmText = 'Aceptar',
      cancelText = 'Cancelar',
      showCancel = false,
      size = '', // sm, lg, xl
      icon = null
    } = options;

    const modalId = `modal-${++this.modalCounter}`;
    const sizeClass = size ? `modal-${size}` : '';
    
    // Iconos por tipo
    const icons = {
      info: '<i class="bi bi-info-circle-fill text-info"></i>',
      success: '<i class="bi bi-check-circle-fill text-success"></i>',
      warning: '<i class="bi bi-exclamation-triangle-fill text-warning"></i>',
      error: '<i class="bi bi-x-circle-fill text-danger"></i>',
      confirm: '<i class="bi bi-question-circle-fill text-primary"></i>'
    };

    const modalIcon = icon || icons[type] || icons.info;

    // Clases de botón por tipo
    const buttonClasses = {
      info: 'btn-primary',
      success: 'btn-success',
      warning: 'btn-warning',
      error: 'btn-danger',
      confirm: 'btn-primary'
    };

    const confirmButtonClass = buttonClasses[type] || 'btn-primary';

    const modalHTML = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog ${sizeClass} modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title d-flex align-items-center">
                ${modalIcon}
                <span class="ms-2">${title}</span>
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body pt-2">
              <p class="mb-0">${message}</p>
            </div>
            <div class="modal-footer border-0 pt-2">
              ${showCancel ? `<button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">${cancelText}</button>` : ''}
              <button type="button" class="btn ${confirmButtonClass}" id="${modalId}-confirm">${confirmText}</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('modal-container');
    container.insertAdjacentHTML('beforeend', modalHTML);

    const modalElement = document.getElementById(modalId);
    const modal = new bootstrap.Modal(modalElement);

    return { modal, modalElement, modalId };
  }

  // Método para mostrar alerta simple
  showAlert(message = '', options = {}) {
    return new Promise((resolve) => {
      const { modal, modalElement, modalId } = this.createModal({
        title: options.title || 'Información',
        message,
        type: options.type || 'info',
        confirmText: options.confirmText || 'Entendido',
        showCancel: false,
        ...options
      });

      const confirmBtn = document.getElementById(`${modalId}-confirm`);
      
      const handleConfirm = () => {
        modal.hide();
        resolve(true);
      };

      confirmBtn.addEventListener('click', handleConfirm);

      modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
        resolve(true);
      });

      modal.show();
    });
  }

  // Método para mostrar confirmación
  showConfirm(message = '', options = {}) {
    return new Promise((resolve) => {
      const { modal, modalElement, modalId } = this.createModal({
        title: options.title || 'Confirmar acción',
        message,
        type: options.type || 'confirm',
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        showCancel: true,
        ...options
      });

      const confirmBtn = document.getElementById(`${modalId}-confirm`);
      
      const handleConfirm = () => {
        modal.hide();
        resolve(true);
      };

      const handleCancel = () => {
        modal.hide();
        resolve(false);
      };

      confirmBtn.addEventListener('click', handleConfirm);

      modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
      });

      // Agregar listener a botones de cancelar
      modalElement.querySelectorAll('[data-bs-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', handleCancel);
      });

      modal.show();
    });
  }

  // Método para mostrar modal de éxito con animación
  showSuccess(message = '', options = {}) {
    return this.showAlert(message, {
      title: options.title || '¡Éxito!',
      type: 'success',
      confirmText: options.confirmText || '¡Genial!',
      ...options
    });
  }

  // Método para mostrar modal de error
  showError(message = '', options = {}) {
    return this.showAlert(message, {
      title: options.title || 'Error',
      type: 'error',
      confirmText: options.confirmText || 'Entendido',
      ...options
    });
  }

  // Método para mostrar modal de advertencia
  showWarning(message = '', options = {}) {
    return this.showAlert(message, {
      title: options.title || 'Advertencia',
      type: 'warning',
      confirmText: options.confirmText || 'Entendido',
      ...options
    });
  }

  // Modal de carga/procesando
  showLoading(message = 'Procesando...', options = {}) {
    const { modal, modalElement, modalId } = this.createModal({
      title: options.title || 'Procesando',
      message: `
        <div class="d-flex align-items-center">
          <div class="spinner-border spinner-border-sm text-primary me-3" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <span>${message}</span>
        </div>
      `,
      type: 'info',
      confirmText: '',
      showCancel: false,
      ...options
    });

    // Remover botones del footer para modal de carga
    const footer = modalElement.querySelector('.modal-footer');
    if (footer) footer.style.display = 'none';

    // Prevenir cierre con ESC o click fuera
    modalElement.setAttribute('data-bs-backdrop', 'static');
    modalElement.setAttribute('data-bs-keyboard', 'false');

    modal.show();

    return {
      close: () => {
        modal.hide();
        setTimeout(() => modalElement.remove(), 300);
      }
    };
  }
}

// Crear instancia global
const modalManager = new ModalManager();

// Exportar funciones de conveniencia
window.showAlert = (message, options) => modalManager.showAlert(message, options);
window.showConfirm = (message, options) => modalManager.showConfirm(message, options);
window.showSuccess = (message, options) => modalManager.showSuccess(message, options);
window.showError = (message, options) => modalManager.showError(message, options);
window.showWarning = (message, options) => modalManager.showWarning(message, options);
window.showLoading = (message, options) => modalManager.showLoading(message, options);

export { modalManager };
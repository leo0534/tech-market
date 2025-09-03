class Modal {
  constructor(title, content, size = '') {
    this.title = title;
    this.content = content;
    this.size = size;
    this.modalId = `modal-${Date.now()}`;
  }

  show() {
    const modalHTML = `
      <div class="modal fade" id="${this.modalId}" tabindex="-1">
        <div class="modal-dialog ${this.size}">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${this.title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              ${this.content}
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById(this.modalId));
    modal.show();

    // Cleanup after modal is hidden
    document.getElementById(this.modalId).addEventListener('hidden.bs.modal', () => {
      document.getElementById(this.modalId).remove();
    });
  }

  static showError(message) {
    new Modal('Error', `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle"></i> ${message}
      </div>
    `, 'modal-sm').show();
  }

  static showSuccess(message) {
    new Modal('Éxito', `
      <div class="alert alert-success">
        <i class="bi bi-check-circle"></i> ${message}
      </div>
    `, 'modal-sm').show();
  }
}

export default Modal;
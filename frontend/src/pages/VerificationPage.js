class VerificationPage {
  constructor() {
    this.state = {
      step: 'start',
      documentType: 'cedula_colombiana',
      loading: false,
      verificationId: null,
      errors: {},
      status: null,
      extractedData: null
    };
    
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  render() {
    return `
      <div class="container py-5">
        <div class="row justify-content-center">
          <div class="col-lg-8">
            <div class="card shadow">
              <div class="card-header bg-primary text-white">
                <h2 class="h4 mb-0">
                  <i class="bi bi-shield-check"></i> Verificación de Identidad
                </h2>
              </div>
              <div class="card-body">
                ${this.renderCurrentStep()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderCurrentStep() {
    switch (this.state.step) {
      case 'start':
        return this.renderStartStep();
      case 'pending_review':
        return this.renderPendingReviewStep();
      case 'success':
        return this.renderSuccessStep();
      default:
        return this.renderStartStep();
    }
  }

  renderStartStep() {
  return `
    ${this.state.errors.submit ? `
      <div class="alert alert-danger">
        <strong><i class="bi bi-exclamation-triangle"></i> Error:</strong>
        ${this.state.errors.submit}
        ${this.state.errors.extractedData ? `
          <br><br>
          <strong>Datos del documento:</strong> ${this.state.errors.extractedData.firstName} ${this.state.errors.extractedData.lastName}
          <br>
          <strong>Tus datos:</strong> ${this.state.errors.userData?.firstName} ${this.state.errors.userData?.lastName}
        ` : ''}
      </div>
    ` : ''}

    <div class="alert alert-info">
      <strong>¡Hola ${this.getUserName()}!</strong> Para publicar productos, necesitas 
      verificar tu identidad subiendo fotos de tu documento de identidad.
    </div>

    <form id="verification-start-form" enctype="multipart/form-data">
      <div class="mb-3">
        <label class="form-label">Tipo de documento *</label>
        <select class="form-select" name="documentType" required>
          <option value="cedula_colombiana">Cédula de Ciudadanía Colombiana</option>
          <option value="cedula_extranjeria">Cédula de Extranjería</option>
          <option value="pasaporte">Pasaporte</option>
        </select>
      </div>

      <div class="row">
        <div class="col-md-6 mb-3">
          <div class="card">
            <div class="card-header bg-light">
              <h6 class="mb-0">Foto Frontal *</h6>
            </div>
            <div class="card-body text-center">
              <i class="bi bi-card-image display-4 text-muted"></i>
              <p class="text-muted mt-2">Toma una foto clara del frente de tu documento</p>
              <input type="file" name="frontImage" accept="image/*" capture="environment" class="form-control" required>
              <div class="form-text">Formatos: JPG, PNG. Máx: 5MB</div>
            </div>
          </div>
        </div>
        <div class="col-md-6 mb-3">
          <div class="card">
            <div class="card-header bg-light">
              <h6 class="mb-0">Foto Posterior *</h6>
            </div>
            <div class="card-body text-center">
              <i class="bi bi-card-image display-4 text-muted"></i>
              <p class="text-muted mt-2">Toma una foto clara del reverso de tu documento</p>
              <input type="file" name="backImage" accept="image/*" capture="environment" class="form-control" required>
              <div class="form-text">Formatos: JPG, PNG. Máx: 5MB</div>
            </div>
          </div>
        </div>
      </div>

      <div class="alert alert-warning">
        <i class="bi bi-exclamation-triangle"></i>
        <strong>Importante:</strong> 
        <ul class="mb-0 mt-2">
          <li>Asegúrate de que las fotos sean claras y legibles</li>
          <li>Los datos deben coincidir con tu información de registro</li>
          <li>La información se maneja con estrictos protocolos de seguridad</li>
        </ul>
      </div>

      <div class="d-grid">
        <button type="submit" class="btn btn-primary btn-lg" ${this.state.loading ? 'disabled' : ''}>
          ${this.state.loading ? '<span class="spinner-border spinner-border-sm" role="status"></span> Verificando...' : '<i class="bi bi-shield-check"></i> Verificar Documento'}
        </button>
      </div>
    </form>
  `;
}

  renderPendingReviewStep() {
    return `
      <div class="alert alert-info">
        <strong><i class="bi bi-robot"></i> Verificación Automática en Proceso</strong>
      </div>

      <div class="card mb-4">
        <div class="card-header bg-light">
          <h6 class="mb-0">Comparación Automática</h6>
        </div>
        <div class="card-body">
          <p>Nuestro sistema está comparando automáticamente los datos de tu documento con tu información de registro.</p>
          
          <div class="progress mb-3">
            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                 style="width: 75%">Analizando...</div>
          </div>

          <p class="small text-muted">
            <i class="bi bi-info-circle"></i>
            Esto suele tomar unos segundos. Si los datos coinciden, serás verificado automáticamente.
          </p>
        </div>
      </div>

      <div class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Procesando...</span>
        </div>
        <p class="mt-2">Procesando tu documento...</p>
      </div>
    `;
  }

  renderSuccessStep() {
    return `
      <div class="text-center py-4">
        <div class="mb-4">
          <i class="bi bi-check-circle-fill text-success display-1"></i>
        </div>
        <h3 class="text-success">¡Verificación Exitosa!</h3>
        <p class="lead">Tu identidad ha sido verificada correctamente.</p>
        <p>Ahora puedes publicar productos y acceder a todas las funcionalidades de Tech Market.</p>
        
        <div class="d-grid gap-2 col-md-6 mx-auto mt-4">
          <a href="/create-product" data-link class="btn btn-primary">
            <i class="bi bi-plus-circle"></i> Publicar mi Primer Producto
          </a>
          <a href="/products" data-link class="btn btn-outline-primary">
            <i class="bi bi-grid"></i> Explorar Productos
          </a>
        </div>
      </div>
    `;
  }

  getUserName() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.firstName || 'Usuario';
    } catch (e) {
      return 'Usuario';
    }
  }

  async handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  this.setState({ loading: true, errors: {} });
  
  try {
    const token = localStorage.getItem('accessToken');
    console.log('🔄 Enviando verificación...');
    
    const response = await fetch('http://localhost:3000/api/auth/verify/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    console.log('📨 Respuesta recibida:', response.status, response.statusText);
    
    const result = await response.json();
    console.log('📊 Resultado:', result);
    
    if (response.ok) {
      console.log('✅ Verificación exitosa. Actualizando estado...');
      this.setState({
        step: result.data.status === 'pending_review' ? 'pending_review' : 'success',
        verificationId: result.data.verificationId,
        extractedData: result.data.extractedData,
        loading: false
      });

      // Si fue aprobado automáticamente, actualizar usuario
      if (result.data.status === 'approved') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.isVerified = true;
        user.verificationStatus = 'verified';
        user.role = 'verified';
        localStorage.setItem('user', JSON.stringify(user));
      }
    } else {
      // MANEJO MEJORADO DE ERRORES
      let errorMessage = result.message || 'Error al verificar documento';
      
      // Mensajes específicos para diferentes tipos de error
      if (response.status === 409) {
        errorMessage = 'Este documento ya está registrado con otra cuenta. Si es tu documento, contacta con soporte.';
      } else if (response.status === 400 && result.errorType === 'data_mismatch') {
        errorMessage = `
          Los datos del documento no coinciden con tu información de registro.
          <br><br>
          <strong>Documento:</strong> ${result.extractedData.firstName} ${result.extractedData.lastName}
          <br>
          <strong>Registro:</strong> ${result.userData.firstName} ${result.userData.lastName}
          <br><br>
          Por favor, usa tu documento real.
        `;
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('❌ Error en handleSubmit:', error);
    this.setState({
      errors: { 
        submit: error.message,
        showAsAlert: true // Para mostrar como alerta en lugar de texto simple
      },
      loading: false
    });
    
    // Mostrar alerta para errores importantes
    if (error.message.includes('no coinciden') || error.message.includes('documento ya está registrado')) {
      this.showErrorAlert(error.message);
    }
  }
}

// Agrega esta función para mostrar alertas bonitas
showErrorAlert(message) {
  // Crear alerta con Bootstrap
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-dismissible fade show';
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '20px';
  alertDiv.style.right = '20px';
  alertDiv.style.zIndex = '9999';
  alertDiv.style.minWidth = '300px';
  alertDiv.innerHTML = `
    <strong><i class="bi bi-exclamation-triangle"></i> Error de verificación</strong>
    <br>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(alertDiv);
  
  // Auto-cerrar después de 8 segundos
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.parentNode.removeChild(alertDiv);
    }
  }, 8000);
}

  async checkStatus() {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.log('No hay token de autenticación');
        window.location.href = '/login';
        return;
      }

      // Verificar si ya estamos en estado success para evitar loops
      if (this.state.step === 'success') {
        console.log('✅ Ya verificado, omitiendo checkStatus');
        return;
      }

      const response = await fetch('http://localhost:3000/api/auth/verify/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        console.log('Token inválido o expirado');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('El servidor devolvió HTML en lugar de JSON');
        return;
      }

      if (response.ok) {
        const result = await response.json();
        console.log('📊 Estado de verificación:', result.data.status);
        
        // Solo actualizar si el estado es diferente al actual
        if (result.data.status === 'verified' && this.state.step !== 'success') {
          this.setState({ step: 'success' });
        } else if (result.data.status === 'pending_review' && this.state.step !== 'pending_review') {
          this.setState({ 
            step: 'pending_review',
            extractedData: result.data.extractedData
          });
        } else if (result.data.status === 'approved' && this.state.step !== 'success') {
          this.setState({ step: 'success' });
        }
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    }
  }

  init() {
    // Solo verificar estado si no estamos ya en success
    if (this.state.step !== 'success') {
      this.checkStatus();
    }

    const startForm = document.getElementById('verification-start-form');
    if (startForm) startForm.addEventListener('submit', this.handleSubmit);
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    console.log('🔄 Estado actualizado:', {
      step: this.state.step,
      loading: this.state.loading,
      verificationId: this.state.verificationId
    });
    this.rerender();
  }

  rerender() {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = this.render();
      // Solo inicializar si no estamos en success para evitar loops
      if (this.state.step !== 'success') {
        this.init();
      }
    }
  }

  destroy() {
    const form = document.getElementById('verification-start-form');
    if (form) {
      form.removeEventListener('submit', this.handleSubmit);
    }
  }
}

export default VerificationPage;
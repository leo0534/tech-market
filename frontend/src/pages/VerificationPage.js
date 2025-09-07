if (!Element.prototype.replaceWith) {
  Element.prototype.replaceWith = function(...nodes) {
    const parent = this.parentNode;
    const sibling = this.nextSibling;
    
    nodes.forEach(node => {
      if (typeof node === 'string') {
        node = document.createTextNode(node);
      }
      parent.insertBefore(node, sibling);
    });
    
    parent.removeChild(this);
  };
}

class VerificationPage {
  constructor() {
  console.log('🆕 Nueva instancia de VerificationPage creada');
  
  this.state = {
    step: 'start',
    documentType: 'cedula_colombiana',
    loading: false,
    verificationId: null,
    errors: {},
    status: null,
    extractedData: null,
    message: ''
  };
  
  // Bind de métodos
  this.handleSubmit = this.handleSubmit.bind(this);
  this.handleDocumentTypeChange = this.handleDocumentTypeChange.bind(this);
  this.retryVerification = this.retryVerification.bind(this);
  this.startStatusChecking = this.startStatusChecking.bind(this);
  this.stopStatusChecking = this.stopStatusChecking.bind(this);
  this.checkStatus = this.checkStatus.bind(this);
  this.init = this.init.bind(this);
  this.setState = this.setState.bind(this);
  this.rerender = this.rerender.bind(this);
  this.destroy = this.destroy.bind(this);
  
  this.intervalId = null;
  this.timeoutId = null;
  this.checkAttempts = 0;
  this.initAttempts = 0; // ✅ Contador de intentos de init
  this.maxInitAttempts = 5; // ✅ Límite máximo
  
  // Limpiar cualquier intervalo existente al crear nueva instancia
  this.stopStatusChecking();
  
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(this.init, 100);
    });
  } else {
    setTimeout(this.init, 100);
  }
}

  render() {
    return `
      <div class="container py-5">
        <div class="row justify-content-center">
          <div class="col-lg-10">
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
      case 'uploading':
        return this.renderUploadingStep();
      case 'processing':
        return this.renderProcessingStep();
      case 'pending_review':
        return this.renderPendingReviewStep();
      case 'success':
        return this.renderSuccessStep();
      case 'error':
        return this.renderErrorStep();
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
        </div>
      ` : ''}

      ${this.state.message ? `
        <div class="alert alert-info">
          <i class="bi bi-info-circle"></i> ${this.state.message}
        </div>
      ` : ''}

      <div class="alert alert-info">
        <strong>¡Hola ${this.getUserName()}!</strong> Para publicar productos, necesitas 
        verificar tu identidad subiendo fotos de tu documento de identidad.
      </div>

      <form id="verification-start-form" enctype="multipart/form-data">
        <div class="mb-3">
          <label class="form-label">Tipo de documento *</label>
          <select class="form-select" name="documentType" id="document-type-select" required>
            <option value="cedula_colombiana" ${this.state.documentType === 'cedula_colombiana' ? 'selected' : ''}>Cédula de Ciudadanía Colombiana</option>
            <option value="cedula_extranjeria" ${this.state.documentType === 'cedula_extranjeria' ? 'selected' : ''}>Cédula de Extranjería</option>
            <option value="pasaporte" ${this.state.documentType === 'pasaporte' ? 'selected' : ''}>Pasaporte</option>
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
                <input type="file" name="frontImage" id="front-image-input" accept="image/*" capture="environment" 
                       class="form-control" required>
                <div class="form-text">Formatos: JPG, PNG. Máx: 8MB</div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 mb-3">
            <div class="card">
              <div class="card-header bg-light">
                <h6 class="mb-0">Foto Posterior</h6>
              </div>
              <div class="card-body text-center">
                <i class="bi bi-card-image display-4 text-muted"></i>
                <p class="text-muted mt-2">Toma una foto clara del reverso de tu documento</p>
                <input type="file" name="backImage" id="back-image-input" accept="image/*" capture="environment" 
                       class="form-control">
                <div class="form-text">Formatos: JPG, PNG. Máx: 8MB</div>
              </div>
            </div>
          </div>
        </div>

        <div class="alert alert-warning">
          <i class="bi bi-exclamation-triangle"></i>
          <strong>Consejos para fotos claras:</strong> 
          <ul class="mb-0 mt-2">
            <li>Buena iluminación natural o artificial</li>
            <li>Enfoca bien el documento</li>
            <li>Evita reflejos y sombras</li>
            <li>Asegúrate de que todos los datos sean legibles</li>
            <li>Los datos deben coincidir con tu información de registro</li>
          </ul>
        </div>

        <div class="d-grid">
          <button type="submit" class="btn btn-primary btn-lg" ${this.state.loading ? 'disabled' : ''}>
            ${this.state.loading ? '<span class="spinner-border spinner-border-sm" role="status"></span> Verificando...' : '<i class="bi bi-shield-check"></i> Iniciar Verificación'}
          </button>
        </div>
      </form>
    `;
  }

  renderUploadingStep() {
    return `
      <div class="text-center py-5">
        <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
          <span class="visually-hidden">Subiendo...</span>
        </div>
        <h4>Subiendo documentos...</h4>
        <p class="text-muted">Por favor espera mientras subimos tus imágenes.</p>
      </div>
    `;
  }

  renderProcessingStep() {
    return `
      <div class="text-center py-5">
        <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
          <span class="visually-hidden">Procesando...</span>
        </div>
        <h4>Procesando documento</h4>
        <p class="text-muted">Estamos analizando tu documento de identidad.</p>
        
        <div class="progress mb-3 mx-auto" style="max-width: 300px;">
          <div class="progress-bar progress-bar-striped progress-bar-animated" 
               style="width: 75%">Analizando OCR...</div>
        </div>

        <div class="alert alert-info mt-4">
          <i class="bi bi-info-circle"></i>
          <strong>Proceso automático</strong><br>
          Esto puede tomar de 10 a 30 segundos. Te notificaremos cuando se complete.
        </div>
      </div>
    `;
  }

  renderPendingReviewStep() {
    return `
      <div class="alert alert-warning">
        <strong><i class="bi bi-person-check"></i> Verificación en Revisión</strong>
      </div>

      <div class="card mb-4">
        <div class="card-header bg-light">
          <h6 class="mb-0">Comparación de Datos</h6>
        </div>
        <div class="card-body">
          <p>Hemos recibido tu documento y está siendo revisado por nuestro equipo.</p>
          
          ${this.state.extractedData ? `
            <div class="row mt-3">
              <div class="col-md-6">
                <div class="card bg-light">
                  <div class="card-header">
                    <strong>Datos en tu documento:</strong>
                  </div>
                  <div class="card-body">
                    <p class="mb-1"><strong>Nombre:</strong> ${this.state.extractedData.firstName || 'No detectado'}</p>
                    <p class="mb-1"><strong>Apellido:</strong> ${this.state.extractedData.lastName || 'No detectado'}</p>
                    <p class="mb-0"><strong>Documento:</strong> ${this.state.extractedData.documentNumber || 'No detectado'}</p>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card bg-light">
                  <div class="card-header">
                    <strong>Tus datos registrados:</strong>
                  </div>
                  <div class="card-body">
                    <p class="mb-1"><strong>Nombre:</strong> ${this.getUserFullName()}</p>
                    <p class="mb-0"><strong>Email:</strong> ${this.getUserEmail()}</p>
                  </div>
                </div>
              </div>
            </div>
          ` : ''}

          <div class="alert alert-info mt-3">
            <i class="bi bi-clock"></i>
            <strong>Tiempo estimado:</strong> La revisión manual puede tomar hasta 24 horas.
          </div>
        </div>
      </div>
    `;
  }

  renderSuccessStep() {
    return `
      <div class="text-center py-5">
        <div class="mb-4">
          <i class="bi bi-check-circle-fill text-success display-1"></i>
        </div>
        <h3 class="text-success">¡Verificación Exitosa!</h3>
        <p class="lead">Tu identidad ha sido verificada correctamente.</p>
        
        ${this.state.extractedData ? `
          <div class="card mx-auto mb-4" style="max-width: 400px;">
            <div class="card-header">
              <strong>Datos verificados:</strong>
            </div>
            <div class="card-body">
              <p class="mb-1"><strong>Nombre:</strong> ${this.state.extractedData.firstName}</p>
              <p class="mb-1"><strong>Apellido:</strong> ${this.state.extractedData.lastName}</p>
              <p class="mb-0"><strong>Documento:</strong> ${this.state.extractedData.documentNumber}</p>
            </div>
          </div>
        ` : ''}
        
        <p>Ahora puedes publicar productos y acceder a todas las funcionalidades de Tech Market.</p>
        
        <div class="d-grid gap-2 col-md-6 mx-auto mt-4">
  <button type="button" class="btn btn-primary" id="publish-product-btn">
    <i class="bi bi-plus-circle"></i> Publicar mi Primer Producto
  </button>
  <a href="/products" data-link class="btn btn-outline-primary">
    <i class="bi bi-grid"></i> Explorar Productos
  </a>
</div>
      </div>
    `;
  }

  renderErrorStep() {
  return `
    <div class="text-center py-5">
      <div class="mb-4">
        <i class="bi bi-exclamation-triangle-fill text-danger display-1"></i>
      </div>
      <h3 class="text-danger">Error en Verificación</h3>
      <p class="lead">${this.state.errors.submit || 'Ocurrió un error durante el proceso'}</p>
      
      <div class="alert alert-info mt-4 mx-auto" style="max-width: 500px;">
        <i class="bi bi-info-circle"></i>
        <strong>Consejos para una verificación exitosa:</strong>
        <ul class="mb-0 mt-2 text-start">
          <li>Asegúrate de que las fotos sean claras y estén bien enfocadas</li>
          <li>Verifica que los datos en tu perfil sean correctos</li>
          <li>Usa buena iluminación al tomar las fotos</li>
          <li>El documento debe estar a tu nombre</li>
        </ul>
      </div>

      <div class="d-grid gap-2 col-md-6 mx-auto mt-4">
        <button type="button" class="btn btn-primary btn-lg" id="retry-btn">
          <i class="bi bi-arrow-clockwise"></i> Reintentar Verificación
        </button>
        <a href="/profile" data-link class="btn btn-outline-secondary">
          <i class="bi bi-person"></i> Ver mi Perfil
        </a>
        <a href="/" data-link class="btn btn-outline-primary">
          <i class="bi bi-house"></i> Ir al Inicio
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

  getUserFullName() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    } catch (e) {
      return 'Usuario';
    }
  }

  getUserEmail() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.email || '';
    } catch (e) {
      return '';
    }
  }

  handleDocumentTypeChange(event) {
    this.setState({ documentType: event.target.value });
  }

  isTokenValid() {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    
    try {
        // Intentar decodificar el token para ver si está expirado
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convertir a milisegundos
        return Date.now() < expirationTime;
    } catch (error) {
        return false;
    }
}

  async handleSubmit(e) {
  e.preventDefault();
  
  console.log('🔍 Iniciando handleSubmit...');
  
  // Verificar si el token es válido
  const token = localStorage.getItem('accessToken');
  if (!token) {
      console.log('🔐 No hay token, redirigiendo a login...');
      window.location.href = '/login';
      return;
  }
  
  // Crear FormData del formulario
  const form = document.getElementById('verification-start-form');
  if (!form) {
      console.error('❌ Formulario no encontrado');
      this.setState({
          errors: { submit: 'Error del formulario. Por favor recarga la página.' },
          forceRerender: true
      });
      return;
  }
  
  const formData = new FormData(form);
  
  // DEBUG: Verificar contenido del FormData
  console.log('📦 FormData creado. Keys:', Array.from(formData.keys()));
  for (let [key, value] of formData.entries()) {
      console.log(`   ${key}:`, value instanceof File ? 
          `File(${value.name}, ${value.size} bytes)` : value);
  }
  
  // Validación de archivo
  const frontImage = formData.get('frontImage');
  if (!frontImage || !(frontImage instanceof File) || frontImage.size === 0) {
      console.error('❌ No se seleccionó archivo frontal válido');
      this.setState({
          errors: { submit: 'Debes seleccionar al menos la imagen frontal del documento' },
          forceRerender: true
      });
      return;
  }
  
  this.setState({ 
      loading: true, 
      errors: {},
      step: 'uploading',
      forceRerender: true
  });
  
  // Configurar timeout para evitar bloqueos (30 segundos)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('⏰ Timeout de 30 segundos alcanzado, abortando...');
    controller.abort();
  }, 30000);

  try {
      console.log('🔄 Enviando verificación...');
      
      const response = await fetch('http://localhost:3000/api/auth/verify/start', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`
          },
          body: formData,
          signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log('📨 Respuesta recibida:', response.status);
      
      // Si es error 401, redirigir a login
      if (response.status === 401) {
          console.log('🔐 Token inválido, redirigiendo a login...');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
      }
      
      const result = await response.json();
      console.log('📊 Resultado:', result);
      
      if (response.ok) {
          console.log('✅ Verificación exitosa iniciada');
          this.setState({
              step: 'processing',
              verificationId: result.data.verificationId,
              extractedData: result.data.extractedData,
              loading: false,
              forceRerender: true
          });
          
          // Iniciar verificación de estado
          this.startStatusChecking();
      } else {
          let errorMessage = result.message || 'Error al verificar documento';
          
          // Mensajes de error específicos
          if (response.status === 409) {
              errorMessage = 'Este documento ya está registrado con otra cuenta.';
          } else if (response.status === 400 && result.errorType === 'data_mismatch') {
              errorMessage = 'Los datos del documento no coinciden con tu información de registro. Por favor, verifica que estés usando tu documento real.';
          } else if (response.status === 400) {
              errorMessage = 'Datos inválidos. Por favor verifica la información.';
          }
          
          throw new Error(errorMessage);
      }
  } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Error en verificación:', error);
      
      if (error.name === 'AbortError') {
          this.setState({
              step: 'error',
              errors: { submit: 'Tiempo de conexión agotado. El servidor está tardando demasiado. Intenta nuevamente.' },
              loading: false,
              forceRerender: true
          });
      } else if (error.message.includes('Failed to fetch')) {
          this.setState({
              step: 'error',
              errors: { submit: 'Error de conexión con el servidor. Verifica tu internet e intenta nuevamente.' },
              loading: false,
              forceRerender: true
          });
      } else {
          this.setState({
              step: 'error',
              errors: { submit: error.message },
              loading: false,
              forceRerender: true
          });
      }
      
      // Detener cualquier verificación de estado en curso
      this.stopStatusChecking();
  }
}

  startStatusChecking() {
    this.stopStatusChecking();
    this.checkAttempts = 0;
    
    this.intervalId = setInterval(() => {
      this.checkStatus();
    }, 5000);
    
    this.timeoutId = setTimeout(() => {
      this.stopStatusChecking();
      this.setState({
        step: 'error',
        errors: { submit: 'Tiempo de verificación agotado. Por favor intenta nuevamente.' }
      });
    }, 5 * 60 * 1000);
  }

  stopStatusChecking() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  async checkStatus() {
  try {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      console.log('No hay token de autenticación');
      this.stopStatusChecking();
      window.location.href = '/login';
      return;
    }

    const response = await fetch('http://localhost:3000/api/auth/verify/status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      console.log('Token inválido o expirado');
      this.stopStatusChecking();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return;
    }

    if (response.ok) {
      const result = await response.json();
      console.log('📊 Estado de verificación:', result.data.status);
      
      switch (result.data.status) {
        case 'approved':
        case 'verified':
          // ✅ ACTUALIZAR USUARIO EN LOCALSTORAGE
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          const updatedUser = {
            ...currentUser,
            isVerified: true,
            verificationStatus: 'verified',
            role: 'verified'
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // ✅ DISPARAR EVENTO GLOBAL DE ACTUALIZACIÓN
          window.dispatchEvent(new CustomEvent('userVerificationUpdated', {
            detail: { isVerified: true }
          }));
          
          this.setState({ 
            step: 'success',
            extractedData: result.data.extractedData,
            forceRerender: true
          });
          this.stopStatusChecking();
          break;
          
        case 'pending_review':
          this.setState({ 
            step: 'pending_review',
            extractedData: result.data.extractedData,
            forceRerender: true
          });
          break;
          
        case 'rejected':
          this.setState({
            step: 'error',
            errors: { 
              submit: result.data.message || 'Verificación rechazada'
            },
            forceRerender: true
          });
          this.stopStatusChecking();
          break;
          
        case 'processing':
          this.setState({ 
            step: 'processing',
            forceRerender: true 
          });
          break;
          
        default:
          console.log('Estado desconocido:', result.data.status);
      }
    }
  } catch (error) {
    console.error('Error checking verification status:', error);
    if ((this.checkAttempts || 0) > 3) {
      this.stopStatusChecking();
      this.setState({
        step: 'error',
        errors: { submit: 'Error de conexión con el servidor' },
        forceRerender: true
      });
    }
    this.checkAttempts = (this.checkAttempts || 0) + 1;
  }
}

  retryVerification() {
  console.log('🔄 Reintentando verificación...');
  
  // Detener cualquier verificación en curso
  this.stopStatusChecking();
  
  // Resetear completamente el estado
  this.state = {
    step: 'start',
    documentType: 'cedula_colombiana',
    loading: false,
    verificationId: null,
    errors: {},
    status: null,
    extractedData: null,
    message: 'Puedes intentar nuevamente subiendo mejores fotos de tu documento.'
  };
  
  // Forzar re-renderizado completo
  this.rerender();
  
  // Scroll to top para mejor experiencia
  window.scrollTo(0, 0);
}

  init() {
  console.log('🔧 Inicializando VerificationPage...');
  
  let attemptCount = 0;
  const maxAttempts = 8; // Aumentar intentos

  const initForm = () => {
    if (attemptCount >= maxAttempts) {
      console.log('❌ Máximo de intentos alcanzado, formulario no encontrado');
      return;
    }

    attemptCount++;
    
    const startForm = document.getElementById('verification-start-form');
    const retryBtn = document.getElementById('retry-btn');
    const documentTypeSelect = document.getElementById('document-type-select');

    if (startForm) {
      // Remover listener existente para evitar duplicados
      startForm.replaceWith(startForm.cloneNode(true));
      const newForm = document.getElementById('verification-start-form');
      newForm.addEventListener('submit', this.handleSubmit);
      console.log('✅ Formulario encontrado y evento agregado');
    }
    
    if (retryBtn) {
      console.log('🎯 Botón de reintentar encontrado, agregando evento...');
      // Clonar y reemplazar el botón para eliminar event listeners antiguos
      retryBtn.replaceWith(retryBtn.cloneNode(true));
      const newRetryBtn = document.getElementById('retry-btn');
      newRetryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('🖱️ Click en botón de reintentar');
        this.retryVerification();
      });
      console.log('✅ Botón de reintentar configurado correctamente');
    }
    
    if (documentTypeSelect) {
      documentTypeSelect.addEventListener('change', this.handleDocumentTypeChange);
    }

    // Si no encontramos los elementos, reintentar
    if ((!startForm || !retryBtn) && attemptCount < maxAttempts) {
      console.log(`⏳ Elementos no encontrados (intento ${attemptCount}/${maxAttempts})`);
      setTimeout(initForm, 200);
    }
  };

  const publishProductBtn = document.getElementById('publish-product-btn');
if (publishProductBtn) {
  publishProductBtn.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('🚀 Intentando acceder a crear producto...');
    
    // Forzar actualización de la verificación primero
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.isVerified) {
      // Navegar directamente
      window.router.navigate('/create-product');
    } else {
      // Verificar estado actual
      this.checkStatus();
      setTimeout(() => {
        window.router.navigate('/create-product');
      }, 1000);
    }
  });
}

  // Iniciar después de un breve delay
  setTimeout(initForm, 150);
}

  setState(newState) {
  const oldStep = this.state.step;
  this.state = { ...this.state, ...newState };
  
  // Solo re-renderizar si el paso cambió o si es necesario
  if (oldStep !== this.state.step || newState.forceRerender) {
    this.rerender();
  }
}

  rerender() {
  const app = document.getElementById('app');
  if (app) {
    // Guardar el scroll position antes de renderizar
    const scrollPosition = window.scrollY;
    
    app.innerHTML = this.render();
    
    // Restaurar el scroll position después de renderizar
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
      this.init();
    }, 50);
  }
}

  destroy() {
  console.log('🧹 Iniciando cleanup de VerificationPage...');
  
  this.stopStatusChecking();
  
  // Remover todos los event listeners de manera más agresiva
  const form = document.getElementById('verification-start-form');
  const retryBtn = document.getElementById('retry-btn');
  const documentTypeSelect = document.getElementById('document-type-select');
  
  if (form) {
    form.removeEventListener('submit', this.handleSubmit);
    console.log('✅ Event listener del formulario removido');
  }
  
  if (retryBtn) {
    // Crear un nuevo botón sin event listeners
    const newRetryBtn = retryBtn.cloneNode(true);
    retryBtn.parentNode.replaceChild(newRetryBtn, retryBtn);
    console.log('✅ Botón de reintentar limpiado');
  }
  
  if (documentTypeSelect) {
    documentTypeSelect.removeEventListener('change', this.handleDocumentTypeChange);
  }
  
  console.log('🧹 VerificationPage limpiada correctamente');
}
}

export default VerificationPage;
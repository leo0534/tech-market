import api from '../../utils/api';
import { validateEmail, validatePassword } from '../../utils/validation';
import Modal from '../common/Modal';

class RegisterForm {
  constructor() {
    this.initialized = false;
    this.handleSubmit = this.handleSubmit.bind(this); // Fix binding issue
  }

  render() {
    return `
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card shadow">
            <div class="card-body p-5">
              <h2 class="card-title text-center mb-4">Crear Cuenta</h2>
              
              <form id="register-form">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="firstName" class="form-label">Nombre</label>
                    <input type="text" class="form-control" id="firstName" required>
                  </div>

                  <div class="col-md-6 mb-3">
                    <label for="lastName" class="form-label">Apellido</label>
                    <input type="text" class="form-control" id="lastName" required>
                  </div>
                </div>

                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" class="form-control" id="email" required>
                </div>

                <div class="mb-3">
                  <label for="phone" class="form-label">Teléfono</label>
                  <input type="tel" class="form-control" id="phone" placeholder="+573001234567">
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label">Contraseña</label>
                  <input type="password" class="form-control" id="password" required>
                  <div class="form-text">Mínimo 6 caracteres</div>
                </div>

                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">Confirmar Contraseña</label>
                  <input type="password" class="form-control" id="confirmPassword" required>
                </div>

                <button type="submit" class="btn btn-primary w-100 mb-3" id="register-btn">
                  Crear Cuenta
                </button>

                <div class="text-center">
                  <a href="/login" class="text-decoration-none">¿Ya tienes cuenta? Inicia sesión</a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    if (!this.initialized) {
      const form = document.getElementById('register-form');
      if (form) {
        form.addEventListener('submit', this.handleSubmit);
      }
      this.initialized = true;
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    console.log('📝 Iniciando proceso de registro...');
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validaciones
    if (!validateEmail(email)) {
      Modal.showError('Por favor ingresa un email válido');
      return;
    }

    if (!validatePassword(password)) {
      Modal.showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      Modal.showError('Las contraseñas no coinciden');
      return;
    }

    const submitBtn = document.getElementById('register-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creando cuenta...';
    }

    try {
      console.log('📤 Enviando datos al servidor...', {
        firstName,
        lastName,
        email,
        phone,
        password: '***' // No mostrar password real
      });

      const response = await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        phone: phone || undefined, // Enviar solo si tiene valor
        password
      });

      console.log('✅ Respuesta del servidor:', response);

      // Verificar la estructura de la respuesta
      if (response.data && response.data.data) {
        const { accessToken, user } = response.data.data;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));

        Modal.showSuccess('¡Cuenta creada exitosamente!');
        setTimeout(() => {
          window.location.href = '/verification';
        }, 1500);
      } else {
        throw new Error('Estructura de respuesta inesperada');
      }

    } catch (error) {
      console.error('❌ Error completo:', error);
      
      let errorMessage = 'Error al crear la cuenta';
      
      if (error.response) {
        // El servidor respondió con un error
        console.error('📊 Datos del error:', error.response.data);
        console.error('🔧 Status del error:', error.response.status);
        
        errorMessage = error.response.data?.message || 
                      error.response.data?.error ||
                      `Error ${error.response.status}: ${error.response.statusText}`;
                      
      } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        console.error('🌐 Error de conexión:', error.request);
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.';
      } else {
        // Error en la configuración de la petición
        errorMessage = error.message;
      }
      
      Modal.showError(errorMessage);
    } finally {
      const submitBtn = document.getElementById('register-btn');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Crear Cuenta';
      }
    }
  }

  init() {
    this.setupEventListeners();
  }

  destroy() {
    const form = document.getElementById('register-form');
    if (form) {
      form.removeEventListener('submit', this.handleSubmit);
    }
    this.initialized = false;
  }
}

export default RegisterForm;
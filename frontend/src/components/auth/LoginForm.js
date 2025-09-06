import api from '../../utils/api';
import { validateEmail } from '../../utils/validation';
import Modal from '../common/Modal';

class LoginForm {
  constructor() {
    this.initialized = false;
  }

  render() {
    return `
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="card shadow">
            <div class="card-body p-5">
              <h2 class="card-title text-center mb-4">Iniciar Sesión</h2>
              
              <form id="login-form">
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" class="form-control" id="email" required>
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label">Contraseña</label>
                  <input type="password" class="form-control" id="password" required>
                </div>

                <button type="submit" class="btn btn-primary w-100 mb-3">
                  Iniciar Sesión
                </button>

                <div class="text-center">
                  <a href="/register" class="text-decoration-none">¿No tienes cuenta? Regístrate</a>
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
      const form = document.getElementById('login-form');
      if (form) {
        form.addEventListener('submit', this.handleSubmit.bind(this));
      }
      this.initialized = true;
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!validateEmail(email)) {
      Modal.showError('Por favor ingresa un email válido');
      return;
    }

    if (password.length < 6) {
      Modal.showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Iniciando sesión...';

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { accessToken, user } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      Modal.showSuccess('¡Inicio de sesión exitoso!');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);

    } catch (error) {
      const message = error.response?.data?.message || 'Error al iniciar sesión';
      Modal.showError(message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Iniciar Sesión';
    }
  }

  init() {
    this.setupEventListeners();
  }

  destroy() {
    const form = document.getElementById('login-form');
    if (form) {
      form.removeEventListener('submit', this.handleSubmit.bind(this));
    }
    this.initialized = false;
  }
}

export default LoginForm;
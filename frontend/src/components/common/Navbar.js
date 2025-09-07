import { isAuthenticated, getCurrentUser, logout } from '../../utils/auth';

class Navbar {
  constructor() {
    this.isAuth = isAuthenticated();
    this.user = getCurrentUser();
    this.initialized = false;
    this.logoutHandler = this.handleLogout.bind(this);
    this.verificationUpdateHandler = this.handleVerificationUpdate.bind(this);
  }

  render() {
    const user = this.user || {};
    const isVerified = user.isVerified || false;
    const verificationStatus = user.verificationStatus || 'not_started';
    
    return `
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
          <a class="navbar-brand fw-bold" href="/" data-link>
            <i class="bi bi-shop"></i> Tech Market
          </a>
          
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
              <li class="nav-item">
                <a class="nav-link" href="/" data-link>Inicio</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="/products" data-link>Productos</a>
              </li>
              ${this.isAuth ? `
                <li class="nav-item">
                  <a class="nav-link" href="/create-product" data-link>Publicar</a>
                </li>
              ` : ''}
            </ul>

            <ul class="navbar-nav">
              ${this.isAuth ? `
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle" href="#" role="button" 
                     id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false"
                     onclick="event.stopPropagation()">
                    <i class="bi bi-person-circle"></i> ${user.firstName || 'Usuario'}
                    <span class="verification-status ms-1 ${isVerified ? 'text-success' : 'text-danger'}">
                      <i class="bi ${isVerified ? 'bi-patch-check-fill' : 'bi-exclamation-triangle-fill'}"></i>
                      ${isVerified ? 'Verificado' : 'No verificado'}
                    </span>
                  </a>
                  <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                    <li><a class="dropdown-item" href="/profile" data-link>Mi Perfil</a></li>
                    ${!isVerified ? `
                      <li><a class="dropdown-item" href="/verification" data-link>
                        <i class="bi bi-shield-check"></i> Verificar Cuenta
                      </a></li>
                    ` : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li>
                      <button class="dropdown-item" id="logout-btn" type="button">
                        <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                      </button>
                    </li>
                  </ul>
                </li>
              ` : `
                <li class="nav-item">
                  <a class="nav-link" href="/login" data-link>Iniciar Sesión</a>
                </li>
                <li class="nav-item">
                  <a class="btn btn-outline-light ms-2" href="/register" data-link>Registrarse</a>
                </li>
              `}
            </ul>
          </div>
        </div>
      </nav>
    `;
  }

  setupEventListeners() {
    if (!this.initialized) {
      document.addEventListener('click', this.logoutHandler);
      window.addEventListener('userVerificationUpdated', this.verificationUpdateHandler);
      this.initialized = true;
    }
  }

  handleVerificationUpdate(event) {
    console.log('🔄 Evento de verificación recibido en Navbar');
    this.updateVerificationStatus(event.detail.isVerified);
  }

  updateVerificationStatus(isVerified) {
    console.log('🎯 Actualizando estado de verificación en Navbar:', isVerified);
    
    // Actualizar usuario en localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = {
      ...currentUser,
      isVerified: isVerified,
      verificationStatus: isVerified ? 'verified' : 'not_verified'
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    this.user = updatedUser;
    
    // Actualizar UI
    const verificationBadge = document.querySelector('.verification-status');
    if (verificationBadge) {
      if (isVerified) {
        verificationBadge.innerHTML = '<i class="bi bi-patch-check-fill"></i> Verificado';
        verificationBadge.classList.remove('text-danger');
        verificationBadge.classList.add('text-success');
      } else {
        verificationBadge.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i> No verificado';
        verificationBadge.classList.remove('text-success');
        verificationBadge.classList.add('text-danger');
      }
    }
    
    // Actualizar dropdown
    const dropdown = document.querySelector('.dropdown-menu');
    if (dropdown) {
      const verificationLink = dropdown.querySelector('a[href="/verification"]');
      if (verificationLink) {
        verificationLink.style.display = isVerified ? 'none' : 'block';
      }
    }
  }

  handleLogout(e) {
    if (e.target.id === 'logout-btn') {
      e.preventDefault();
      e.stopPropagation();
      
      if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        logout();
      }
    }
  }

  init() {
    this.setupEventListeners();
    this.initializeDropdowns();
    
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        this.closeAllDropdowns();
      }
    });
  }

  initializeDropdowns() {
    setTimeout(() => {
      const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
      
      dropdownToggles.forEach(toggle => {
        const clone = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(clone, toggle);
        
        clone.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const dropdown = clone.closest('.dropdown');
          const menu = dropdown.querySelector('.dropdown-menu');
          
          this.closeAllDropdowns();
          
          menu.classList.add('show');
          dropdown.classList.add('show');
        });
      });
    }, 100);
  }

  closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu.show, .dropdown.show').forEach(element => {
      element.classList.remove('show');
    });
  }

  destroy() {
    if (this.initialized) {
      document.removeEventListener('click', this.logoutHandler);
      window.removeEventListener('userVerificationUpdated', this.verificationUpdateHandler);
      this.initialized = false;
    }
  }
}

export default Navbar;
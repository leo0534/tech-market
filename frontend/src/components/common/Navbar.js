import { isAuthenticated, getCurrentUser, logout } from '../../utils/auth';

class Navbar {
  constructor() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    const user = getCurrentUser();
    const isAuth = isAuthenticated();

    return `
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
          <a class="navbar-brand fw-bold" href="/">
            <i class="bi bi-shop"></i> Tech Market
          </a>
          
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav me-auto">
              <li class="nav-item">
                <a class="nav-link" href="/">Inicio</a>
              </li>
              ${isAuth ? `
                <li class="nav-item">
                  <a class="nav-link" href="/products">Productos</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="/create-product">Publicar</a>
                </li>
              ` : ''}
            </ul>

            <ul class="navbar-nav">
              ${isAuth ? `
                <li class="nav-item dropdown">
                  <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle"></i> ${user.firstName}
                    ${user.isVerified ? '<span class="badge bg-success ms-1">Verificado</span>' : ''}
                  </a>
                  <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="/profile">Mi Perfil</a></li>
                    ${!user.isVerified ? '<li><a class="dropdown-item" href="/verification">Verificar Cuenta</a></li>' : ''}
                    <li><hr class="dropdown-divider"></li>
                    <li><button class="dropdown-item" id="logout-btn">Cerrar Sesión</button></li>
                  </ul>
                </li>
              ` : `
                <li class="nav-item">
                  <a class="nav-link" href="/login">Iniciar Sesión</a>
                </li>
                <li class="nav-item">
                  <a class="btn btn-outline-light ms-2" href="/register">Registrarse</a>
                </li>
              `}
            </ul>
          </div>
        </div>
      </nav>
    `;
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.id === 'logout-btn') {
        e.preventDefault();
        logout();
      }
    });
  }
}

export default Navbar;
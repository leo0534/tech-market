import { isAuthenticated, getCurrentUser } from '../utils/auth';

class HomePage {
  constructor() {
    this.render();
  }

  render() {
    const isAuth = isAuthenticated();
    const user = getCurrentUser();

    return `
      <div class="container mt-4">
        <!-- Hero Section -->
        <div class="row align-items-center py-5">
          <div class="col-lg-6">
            <h1 class="display-4 fw-bold text-primary mb-4">
              Compra y vende sin comisiones en Colombia
            </h1>
            <p class="lead mb-4">
              Tech Market es el marketplace seguro con verificación de identidad 
              donde tú ganas el 100% de tus ventas.
            </p>
            ${!isAuth ? `
              <div class="d-flex gap-3">
                <a href="/register" class="btn btn-primary btn-lg">Comenzar ahora</a>
                <a href="/login" class="btn btn-outline-primary btn-lg">Iniciar sesión</a>
              </div>
            ` : `
              <div class="d-flex gap-3">
                <a href="/products" class="btn btn-primary btn-lg">Ver productos</a>
                <a href="/create-product" class="btn btn-outline-primary btn-lg">Publicar producto</a>
              </div>
            `}
          </div>
          <div class="col-lg-6">
            <img src="/api/placeholder/600/400" class="img-fluid rounded shadow" alt="Tech Market">
          </div>
        </div>

        <!-- Features Section -->
        <div class="row py-5">
          <div class="col-12 text-center mb-5">
            <h2 class="fw-bold">¿Por qué elegir Tech Market?</h2>
          </div>
          
          <div class="col-md-4 mb-4">
            <div class="text-center">
              <div class="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;">
                <i class="bi bi-shield-check text-white fs-3"></i>
              </div>
              <h4>Verificación segura</h4>
              <p>Todos nuestros usuarios son verificados para tu seguridad.</p>
            </div>
          </div>

          <div class="col-md-4 mb-4">
            <div class="text-center">
              <div class="bg-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;">
                <i class="bi bi-percent text-white fs-3"></i>
              </div>
              <h4>Sin comisiones</h4>
              <p>Gana el 100% de tus ventas, sin costos ocultos.</p>
            </div>
          </div>

          <div class="col-md-4 mb-4">
            <div class="text-center">
              <div class="bg-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;">
                <i class="bi bi-chat-dots text-white fs-3"></i>
              </div>
              <h4>Chat integrado</h4>
              <p>Comunícate directamente con compradores y vendedores.</p>
            </div>
          </div>
        </div>

        ${isAuth && !user?.isVerified ? `
          <!-- Verification Prompt -->
          <div class="alert alert-warning mt-5">
            <div class="d-flex align-items-center">
              <i class="bi bi-shield-exclamation fs-3 me-3"></i>
              <div>
                <h5 class="mb-1">¡Verifica tu cuenta!</h5>
                <p class="mb-0">Completa la verificación de identidad para acceder a todas las funcionalidades.</p>
              </div>
              <a href="/verification" class="btn btn-warning ms-auto">Verificar ahora</a>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

export default HomePage;
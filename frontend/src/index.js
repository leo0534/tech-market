// ==================================================
// Tech Market Frontend - Versión Corregida
// Fixed: Loading infinito
// ==================================================

console.log('🚀 Iniciando Tech Market Frontend...');

// Función para cargar recursos dinámicamente
function loadResource(type, url) {
  return new Promise((resolve, reject) => {
    console.log(`📦 Cargando ${type}: ${url}`);
    
    let element;
    
    switch (type) {
      case 'css':
        element = document.createElement('link');
        element.rel = 'stylesheet';
        element.href = url;
        break;
        
      case 'js':
        element = document.createElement('script');
        element.src = url;
        break;
        
      default:
        reject(new Error(`Tipo de recurso no soportado: ${type}`));
        return;
    }
    
    element.onload = () => {
      console.log(`✅ ${type} cargado: ${url}`);
      resolve();
    };
    
    element.onerror = () => {
      console.error(`❌ Error cargando ${type}: ${url}`);
      reject(new Error(`Failed to load ${url}`));
    };
    
    document.head.appendChild(element);
  });
}

// Función principal para inicializar la aplicación
async function initializeApp() {
  try {
    console.log('🎯 Inicializando aplicación...');
    
    // Mostrar loading inicial
    showLoading();
    
    // 1. Cargar Bootstrap CSS
    await loadResource('css', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
    
    // 2. Cargar Bootstrap Icons
    await loadResource('css', 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css');
    
    // 3. Cargar Bootstrap JS
    await loadResource('js', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js');
    
    console.log('✅ Todos los recursos cargados correctamente');
    
    // Ocultar loading
    hideLoading();
    
    // 4. Renderizar la interfaz de usuario
    renderBasicUI();
    
    console.log('🎉 Aplicación inicializada correctamente');
    
  } catch (error) {
    console.error('💥 Error crítico durante la inicialización:', error);
    hideLoading();
    renderErrorUI(error);
  }
}

// Mostrar loading
function showLoading() {
  const loadingHTML = `
    <div id="global-loading" class="position-fixed top-0 start-0 w-100 h-100 bg-white d-flex justify-content-center align-items-center" style="z-index: 9999;">
      <div class="text-center">
        <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p>Cargando Tech Market...</p>
      </div>
    </div>
  `;
  document.body.innerHTML = loadingHTML;
}

// Ocultar loading
function hideLoading() {
  const loadingElement = document.getElementById('global-loading');
  if (loadingElement) {
    loadingElement.remove();
  }
}

// Renderizar interfaz básica
function renderBasicUI() {
  console.log('🎨 Renderizando interfaz de usuario...');
  
  document.body.innerHTML = `
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow">
      <div class="container">
        <a class="navbar-brand fw-bold" href="/">
          <i class="bi bi-shop me-2"></i>Tech Market
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link active" href="/">Inicio</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="/products">Productos</a>
            </li>
          </ul>
          
          <ul class="navbar-nav">
            <li class="nav-item">
              <a class="nav-link" href="/login">Iniciar Sesión</a>
            </li>
            <li class="nav-item">
              <a class="btn btn-outline-light ms-2" href="/register">Registrarse</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Contenido Principal -->
    <main class="container my-5">
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-6">
          <div class="card shadow">
            <div class="card-body text-center p-5">
              <div class="mb-4">
                <i class="bi bi-shop display-1 text-primary"></i>
              </div>
              
              <h1 class="card-title h2 mb-3">¡Bienvenido a Tech Market!</h1>
              <p class="card-text text-muted mb-4">
                Marketplace seguro con verificación de identidad para Colombia
              </p>
              
              <div class="d-grid gap-3">
                <a href="/login" class="btn btn-primary btn-lg">
                  <i class="bi bi-box-arrow-in-right me-2"></i>Iniciar Sesión
                </a>
                
                <a href="/register" class="btn btn-outline-primary btn-lg">
                  <i class="bi bi-person-plus me-2"></i>Crear Cuenta
                </a>
              </div>
              
              <hr class="my-4">
              
              <div class="row text-start">
                <div class="col-md-6">
                  <h6 class="fw-bold mb-3">✨ Características</h6>
                  <ul class="list-unstyled">
                    <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>Sin comisiones</li>
                    <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>Verificación segura</li>
                    <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>Chat integrado</li>
                  </ul>
                </div>
                
                <div class="col-md-6">
                  <h6 class="fw-bold mb-3">🛡️ Seguridad</h6>
                  <ul class="list-unstyled">
                    <li class="mb-2"><i class="bi bi-shield-check text-primary me-2"></i>Datos protegidos</li>
                    <li class="mb-2"><i class="bi bi-coin text-warning me-2"></i>0% de comisión</li>
                    <li class="mb-2"><i class="bi bi-star-fill text-info me-2"></i>Sistema de reputación</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="bg-dark text-light py-4 mt-5">
      <div class="container">
        <div class="row">
          <div class="col-md-6">
            <h5>Tech Market</h5>
            <p class="text-muted">Compra y vende sin comisiones en Colombia</p>
          </div>
          <div class="col-md-6 text-md-end">
            <p class="text-muted mb-0">&copy; 2024 Tech Market. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  `;
}

// Renderizar pantalla de error
function renderErrorUI(error) {
  console.error('🆘 Mostrando pantalla de error...');
  
  document.body.innerHTML = `
    <div class="min-vh-100 bg-light d-flex align-items-center">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-6">
            <div class="card shadow">
              <div class="card-body text-center p-5">
                <div class="mb-4">
                  <i class="bi bi-exclamation-triangle display-1 text-danger"></i>
                </div>
                
                <h1 class="h2 mb-3">Error de Carga</h1>
                <p class="text-muted mb-4">
                  Ha ocurrido un error al cargar la aplicación.
                </p>
                
                <div class="alert alert-danger text-start">
                  <strong>Detalles:</strong><br>
                  <code>${error.message || 'Error desconocido'}</code>
                </div>
                
                <button onclick="window.location.reload()" class="btn btn-primary">
                  <i class="bi bi-arrow-clockwise me-2"></i>Recargar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

console.log('📋 Script index.js cargado');
// src/main.js
console.log('🎯 TECH-MARKET - Punto de entrada PRINCIPAL');

// Importar componentes
import Router from './utils/router.js';
import Navbar from './components/common/Navbar.js';

// Importar páginas estáticas
import HomePage from './pages/HomePage.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import ProductsPage from './pages/ProductsPage.js';
import VerificationPage from './pages/VerificationPage.js';

// Función global para verificar estado
window.checkVerificationStatus = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    
    const response = await fetch('http://localhost:3000/api/auth/verify/status', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      const result = await response.json();
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (result.data.status === 'approved' || result.data.status === 'verified') {
        const updatedUser = { 
          ...user, 
          isVerified: true, 
          verificationStatus: 'verified' 
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Disparar evento global
        window.dispatchEvent(new CustomEvent('userVerificationUpdated', {
          detail: { isVerified: true }
        }));
        
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error verificando estado:', error);
    return false;
  }
};

async function loadPage(pageName) {
  try {
    console.log(`📦 Cargando ${pageName}...`);
    const module = await import(`./pages/${pageName}.js`);
    console.log(`✅ ${pageName} cargado correctamente`);
    return module.default;
  } catch (error) {
    console.error(`❌ Error cargando ${pageName}:`, error);
    return class { 
      render() { return `
        <div class="container mt-4">
          <div class="card">
            <div class="card-body text-center">
              <h2>${pageName.replace('Page', '')}</h2>
              <p class="text-muted">Página en desarrollo</p>
              <a href="/products" data-link class="btn btn-primary">Volver a productos</a>
            </div>
          </div>
        </div>
      `; } 
      init() {} 
      destroy() {} 
    };
  }
}

async function initializeApp() {
  console.log('🚀 Inicializando aplicación...');
  
  try {
    const [CreateProductPage, ProfilePage] = await Promise.all([
      loadPage('CreateProductPage'),
      loadPage('ProfilePage')
    ]);
    
    // 1. Inicializar navbar primero
    const navbar = new Navbar();
    const navbarContainer = document.getElementById('navbar');
    if (navbarContainer) {
      navbarContainer.innerHTML = navbar.render();
      navbar.init();
      window.NavbarComponent = navbar; // Hacerlo global
    }

    // 2. Crear router después
    const router = new Router();
    
    // Configurar rutas
    router.addRoute('/', HomePage);
    router.addRoute('/login', LoginPage);
    router.addRoute('/register', RegisterPage);
    router.addRoute('/products', ProductsPage);
    router.addRoute('/create-product', CreateProductPage, { auth: true, verified: true });
    router.addRoute('/profile', ProfilePage, { auth: true });
    router.addRoute('/verification', VerificationPage, { auth: true });
    
    console.log('🗺️ Rutas configuradas:', Object.keys(router.routes));
    
    // 3. Inicializar router
    router.init();
    window.router = router;
    
    console.log('✅ Aplicación inicializada correctamente');
    
  } catch (error) {
    console.error('💥 Error inicializando app:', error);
    document.body.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger">
          <h4>Error de inicialización</h4>
          <p>${error.message}</p>
          <button onclick="location.reload()" class="btn btn-primary">Reintentar</button>
        </div>
      </div>
    `;
  }
}

// Manejo de enlaces de emergencia
function setupGlobalLinkHandler() {
  document.addEventListener('click', function(e) {
    const link = e.target.closest('[data-link]');
    if (link && link.href) {
      const href = link.getAttribute('href');
      
      if (href === '#' || href === 'javascript:void(0)' || 
          link.classList.contains('dropdown-toggle')) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      
      if (window.router && typeof window.router.navigate === 'function') {
        window.router.navigate(href);
      } else {
        window.history.pushState({}, '', href);
        window.dispatchEvent(new Event('popstate'));
      }
    }
  });
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setTimeout(setupGlobalLinkHandler, 1000);
  });
} else {
  initializeApp();
  setTimeout(setupGlobalLinkHandler, 1000);
}
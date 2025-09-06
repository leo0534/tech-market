// utils/router.js
import { isAuthenticated, isVerified } from './auth';

class Router {
  constructor() {
    this.routes = {};
    this.currentComponent = null;
    this.isRendering = false;
    this.navigationQueue = []; // Cola para manejar navegaciones
    
    this.currentPath = this.getCleanPath(window.location.pathname);
    console.log('🔄 Router creado');
    console.log('📍 Ruta inicial:', this.currentPath);
  }

  getCleanPath(path) {
    const cleanPath = path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path;
    return cleanPath;
  }

  addRoute(path, component, options = {}) {
    const cleanPath = this.getCleanPath(path);
    const componentName = component?.name || 'Anonymous';
    
    console.log(`➕ Agregando ruta: ${cleanPath}, Componente: ${componentName}`);
    
    this.routes[cleanPath] = {
      component,
      auth: options.auth || false,
      verified: options.verified || false
    };
  }

  async navigate(path) {
    // Si ya está renderizando, encolar la navegación
    if (this.isRendering) {
      console.log('⏸️  Navegación encolada (ya en renderizado):', path);
      this.navigationQueue.push(path);
      return;
    }
    
    console.log('🧭 Navegando a:', path);
    const cleanPath = this.getCleanPath(path);
    
    if (cleanPath !== this.getCleanPath(window.location.pathname)) {
      window.history.pushState({}, '', cleanPath);
    }
    
    this.currentPath = cleanPath;
    await this.render();
    
    // Procesar cola de navegación después de terminar
    if (this.navigationQueue.length > 0) {
      const nextPath = this.navigationQueue.shift();
      setTimeout(() => this.navigate(nextPath), 100);
    }
  }

  async checkAuthRequirements(route) {
    if (route.auth && !isAuthenticated()) {
      console.log('🔒 Redirigiendo a login - requiere autenticación');
      setTimeout(() => this.navigate('/login'), 10);
      return false;
    }

    if (route.verified && !isVerified()) {
      console.log('🔒 Redirigiendo a verification - requiere verificación');
      setTimeout(() => this.navigate('/verification'), 10);
      return false;
    }

    return true;
  }

  show404(path) {
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div class="container mt-5">
          <div class="row justify-content-center">
            <div class="col-md-6 text-center">
              <h1>Página no encontrada</h1>
              <p class="text-muted mb-4">La página "${path}" no existe.</p>
              <div class="d-grid gap-2 d-md-block">
                <a href="/" data-link class="btn btn-primary me-2">Volver al Inicio</a>
                <a href="/products" data-link class="btn btn-outline-primary">Ver Productos</a>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  async render() {
    if (this.isRendering) {
      console.log('⏸️  Render omitido (ya en progreso)');
      return;
    }
    
    this.isRendering = true;
    const currentPath = this.getCleanPath(this.currentPath);
    
    console.log('🎨 Iniciando render de:', currentPath);
    
    const app = document.getElementById('app');
    if (!app) {
      console.error('❌ No se encontró el elemento #app');
      this.isRendering = false;
      return;
    }

    const route = this.routes[currentPath];
    
    if (route) {
      try {
        const canAccess = await this.checkAuthRequirements(route);
        if (!canAccess) {
          this.isRendering = false;
          return;
        }

        if (this.currentComponent && this.currentComponent.destroy) {
          this.currentComponent.destroy();
        }
        
        this.currentComponent = new route.component();
        app.innerHTML = this.currentComponent.render();
        
        if (this.currentComponent.init) {
          this.currentComponent.init();
        }
        
        console.log('✅ Render completado exitosamente');
        
      } catch (error) {
        console.error('❌ Error durante el render:', error);
        app.innerHTML = `
          <div class="container mt-5">
            <div class="alert alert-danger">
              <h4>Error al cargar la página</h4>
              <p>${error.message}</p>
              <button onclick="window.location.reload()" class="btn btn-primary">Reintentar</button>
            </div>
          </div>
        `;
      }
    } else {
      console.log('❌ Ruta no configurada:', currentPath);
      this.show404(currentPath);
    }
    
    this.isRendering = false;
  }

  init() {
    console.log('🔄 Inicializando router...');
    
    window.addEventListener('popstate', () => {
      this.currentPath = this.getCleanPath(window.location.pathname);
      console.log('↩️  Navegación histórica a:', this.currentPath);
      this.render();
    });

    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-link]');
      if (link && link.hasAttribute('href')) {
        const href = link.getAttribute('href');
        
        // Ignorar enlaces especiales y dropdowns
        if (href === '#' || href === 'javascript:void(0)' || 
            link.classList.contains('dropdown-toggle')) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔗 Click en enlace:', href);
        this.navigate(href);
      }
    });

    console.log('🚀 Iniciando render inicial');
    this.render();
  }
}

export default Router;
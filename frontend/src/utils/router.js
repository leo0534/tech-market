class Router {
  constructor() {
    this.routes = {};
    this.currentPath = window.location.pathname;
    this.init();
  }

  addRoute(path, component) {
    this.routes[path] = component;
  }

  async navigate(path) {
    window.history.pushState({}, '', path);
    this.currentPath = path;
    await this.render();
  }

  async render() {
    const app = document.getElementById('app');
    const component = this.routes[this.currentPath] || this.routes['/404'];
    
    if (component) {
      app.innerHTML = await new component().render();
    } else {
      app.innerHTML = '<h1>Página no encontrada</h1>';
    }
  }

  init() {
    window.addEventListener('popstate', () => {
      this.currentPath = window.location.pathname;
      this.render();
    });

    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-link]')) {
        e.preventDefault();
        this.navigate(e.target.href);
      }
    });

    this.render();
  }
}

export default Router;
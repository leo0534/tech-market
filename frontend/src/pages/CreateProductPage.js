class CreateProductPage {
  constructor() {
    this.initialized = false;
  }

  render() {
    return `
      <div class="container mt-4">
        <h2>Crear Producto</h2>
        <p>Formulario para crear nuevo producto</p>
      </div>
    `;
  }

  init() {
    this.initialized = true;
    console.log('CreateProductPage inicializado');
  }

  destroy() {
    this.initialized = false;
  }
}

// VERIFICA que tenga export default
export default CreateProductPage;
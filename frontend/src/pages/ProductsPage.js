class ProductsPage {
  constructor() {
    this.initialized = false;
  }

  render() {
    return `
      <div class="container mt-4">
        <div class="row">
          <div class="col-12">
            <h1 class="mb-4">Productos Disponibles</h1>
            <p class="text-muted">Explora todos los productos disponibles en Tech Market.</p>
          </div>
        </div>

        <div class="row" id="products-container">
          <div class="col-md-4 mb-4">
            <div class="card h-100">
              <img src="https://via.placeholder.com/300x200" class="card-img-top" alt="iPhone 13 Pro">
              <div class="card-body">
                <h5 class="card-title">iPhone 13 Pro</h5>
                <p class="card-text">Excelente estado, con todos los accesorios originales.</p>
                <p class="fw-bold text-primary">$2.500.000</p>
              </div>
              <div class="card-footer">
                <small class="text-muted">Bogotá</small>
              </div>
            </div>
          </div>

          <div class="col-md-4 mb-4">
            <div class="card h-100">
              <img src="https://via.placeholder.com/300x200" class="card-img-top" alt="MacBook Air M1">
              <div class="card-body">
                <h5 class="card-title">MacBook Air M1</h5>
                <p class="card-text">8GB RAM, 256GB SSD, casi nueva con garantía.</p>
                <p class="fw-bold text-primary">$3.200.000</p>
              </div>
              <div class="card-footer">
                <small class="text-muted">Medellín</small>
              </div>
            </div>
          </div>

          <div class="col-md-4 mb-4">
            <div class="card h-100">
              <img src="https://via.placeholder.com/300x200" class="card-img-top" alt="Samsung Galaxy S21">
              <div class="card-body">
                <h5 class="card-title">Samsung Galaxy S21</h5>
                <p class="card-text">128GB, color negro, con funda y protector de pantalla.</p>
                <p class="fw-bold text-primary">$1.800.000</p>
              </div>
              <div class="card-footer">
                <small class="text-muted">Cali</small>
              </div>
            </div>
          </div>
        </div>

        <div class="row mt-4">
          <div class="col-12 text-center">
            <button class="btn btn-outline-primary">Cargar más productos</button>
          </div>
        </div>
      </div>
    `;
  }

  init() {
    if (!this.initialized) {
      console.log('✅ ProductsPage inicializado');
      this.initialized = true;
      
      // Verificar que los productos se muestren
      const productsContainer = document.getElementById('products-container');
      if (productsContainer) {
        console.log('✅ Productos renderizados correctamente');
      } else {
        console.error('❌ No se encontró el contenedor de productos');
      }
    }
  }

  destroy() {
    this.initialized = false;
  }
}

export default ProductsPage;
class Footer {
  constructor() {
    this.render();
  }

  render() {
    return `
      <footer class="bg-dark text-light py-4 mt-5">
        <div class="container">
          <div class="row">
            <div class="col-md-4">
              <h5>Tech Market</h5>
              <p>Marketplace seguro con verificación de identidad para Colombia.</p>
            </div>
            <div class="col-md-4">
              <h5>Enlaces</h5>
              <ul class="list-unstyled">
                <li><a href="/" class="text-light">Inicio</a></li>
                <li><a href="/about" class="text-light">Acerca de</a></li>
                <li><a href="/contact" class="text-light">Contacto</a></li>
              </ul>
            </div>
            <div class="col-md-4">
              <h5>Legal</h5>
              <ul class="list-unstyled">
                <li><a href="/terms" class="text-light">Términos de Servicio</a></li>
                <li><a href="/privacy" class="text-light">Política de Privacidad</a></li>
              </ul>
            </div>
          </div>
          <hr>
          <div class="text-center">
            <p>&copy; 2024 Tech Market. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    `;
  }
}

export default Footer;
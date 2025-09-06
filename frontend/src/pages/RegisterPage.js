import RegisterForm from '../components/auth/RegisterForm';

class RegisterPage {
  constructor() {
    this.registerForm = new RegisterForm();
    this.initialized = false;
  }

  render() {
    return `
      <div class="container py-5">
        ${this.registerForm.render()}
      </div>
    `;
  }

  init() {
    if (!this.initialized) {
      this.registerForm.init();
      this.initialized = true;
    }
  }

  destroy() {
    if (this.initialized && this.registerForm.destroy) {
      this.registerForm.destroy();
    }
    this.initialized = false;
  }
}

export default RegisterPage;
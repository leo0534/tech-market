import LoginForm from '../components/auth/LoginForm';

class LoginPage {
  constructor() {
    this.loginForm = new LoginForm();
    this.initialized = false;
  }

  render() {
    return `
      <div class="container py-5">
        ${this.loginForm.render()}
      </div>
    `;
  }

  init() {
    if (!this.initialized) {
      this.loginForm.init();
      this.initialized = true;
    }
  }

  destroy() {
    if (this.initialized && this.loginForm.destroy) {
      this.loginForm.destroy();
    }
    this.initialized = false;
  }
}

export default LoginPage;
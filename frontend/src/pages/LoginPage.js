import LoginForm from '../components/auth/LoginForm';

class LoginPage {
  constructor() {
    this.render();
  }

  render() {
    return `
      <div class="container py-5">
        ${new LoginForm().render()}
      </div>
    `;
  }
}

export default LoginPage;
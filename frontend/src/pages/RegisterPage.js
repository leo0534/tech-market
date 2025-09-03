import RegisterForm from '../components/auth/RegisterForm';

class RegisterPage {
  constructor() {
    this.render();
  }

  render() {
    return `
      <div class="container py-5">
        ${new RegisterForm().render()}
      </div>
    `;
  }
}

export default RegisterPage;
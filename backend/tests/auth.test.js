const request = require('supertest');
const { app } = require('../server');
const { createTestUser, clearDatabase, loginAndGetToken } = require('./testUtils');

describe('Auth API', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('debe registrar un nuevo usuario exitosamente', async () => {
      const userData = {
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'juan.perez@example.com',
        password: 'Password123!',
        phone: '+573001234567'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('debe fallar al registrar usuario con email duplicado', async () => {
      // Primer usuario
      const userData = {
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@example.com',
        password: 'Password123!',
        phone: '+573001234568'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Segundo usuario con mismo email
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email');
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe hacer login exitosamente con credenciales válidas', async () => {
      // Primero crear usuario
      const userData = {
        email: 'login.test@example.com',
        password: 'Password123!',
        firstName: 'Login',
        lastName: 'Test'
      };

      await createTestUser(userData);

      // Luego hacer login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data.user.email).toBe(userData.email);
    });

    it('debe fallar login con credenciales inválidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noexiste@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('debe obtener perfil con token válido', async () => {
      // Crear usuario y obtener token
      const user = await createTestUser();
      const token = await loginAndGetToken(app, user.email, 'password123');

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // ✅ CORREGIDO: response.body.data.user.email en lugar de response.body.data.email
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('debe fallar sin token de autenticación', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('debe fallar con token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token-invalido-123');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
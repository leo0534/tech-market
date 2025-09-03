const request = require('supertest');
const { app } = require('../server');
const { User } = require('../src/models');
const { clearDatabase, createTestUser, getAuthToken } = require('./testUtils');

// Pequeña delay entre tests para evitar rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('Auth API', () => {
  beforeEach(async () => {
    await clearDatabase();
    await delay(100); // Pequeña pausa entre tests
  });

  describe('POST /api/auth/register', () => {
    it('debe registrar un nuevo usuario exitosamente', async () => {
      const userData = {
        email: 'nuevo@example.com',
        password: 'password123',
        firstName: 'Nuevo',
        lastName: 'Usuario',
        phone: '+573001234567'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('_id');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.firstName).toBe(userData.firstName);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('debe fallar al registrar usuario con email duplicado', async () => {
      // Primero crear un usuario
      await createTestUser({ email: 'duplicado@example.com' });
      await delay(50);

      const userData = {
        email: 'duplicado@example.com',
        password: 'password123',
        firstName: 'Duplicado',
        lastName: 'Usuario'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('email ya está registrado');
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe hacer login exitosamente con credenciales válidas', async () => {
      // Crear usuario de prueba
      await createTestUser({
        email: 'login@example.com',
        password: 'mipassword'
      });
      await delay(50);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'mipassword'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('debe fallar login con credenciales inválidas', async () => {
      await delay(50);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inexistente@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Credenciales inválidas');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('debe obtener perfil con token válido', async () => {
      const token = await getAuthToken(app);
      await delay(50);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('debe fallar sin token de autenticación', async () => {
      await delay(50);
      
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('debe fallar con token inválido', async () => {
      await delay(50);
      
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer token-invalido');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
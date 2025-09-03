const request = require('supertest');
const { app } = require('../server');
const { User, Verification } = require('../src/models');
const { clearDatabase, createTestUser, getAuthToken } = require('./testUtils');

// Pequeña delay entre tests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('Verification API', () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    await clearDatabase();
    
    // Crear usuario de prueba
    testUser = await createTestUser({
      email: 'verify@example.com',
      password: 'password123',
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+573001234567'
    });

    authToken = await getAuthToken(app, {
      email: 'verify@example.com',
      password: 'password123'
    });

    await delay(100);
  });

  describe('POST /api/verification/start', () => {
    it('debe iniciar verificación con cédula válida', async () => {
      const response = await request(app)
        .post('/api/verification/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ documentNumber: '100000' }); // Cédula única

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('verificationId');
      expect(response.body.data.nextStep).toBe('verify_otp');
    });

    it('debe fallar con cédula inválida', async () => {
      const response = await request(app)
        .post('/api/verification/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ documentNumber: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debe fallar si ya existe verificación pendiente', async () => {
      // Primera verificación
      await request(app)
        .post('/api/verification/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ documentNumber: '200000' }); // Cédula única

      // Segunda verificación - debería fallar
      const response = await request(app)
        .post('/api/verification/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ documentNumber: '300000' }); // Cédula única

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/verification/verify-otp', () => {
    it('debe verificar OTP correctamente', async () => {
      // Primero iniciar verificación
      const startResponse = await request(app)
        .post('/api/verification/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ documentNumber: '400000' }); // Cédula única

      // Verificar que la respuesta sea exitosa
      if (startResponse.status !== 200) {
        throw new Error(`Start verification failed: ${JSON.stringify(startResponse.body)}`);
      }

      await delay(500);

      const verificationId = startResponse.body.data.verificationId;

      // Obtener OTP de la base de datos
      const verification = await Verification.findById(verificationId).select('+otpCode');
      const otpCode = verification.otpCode;

      const response = await request(app)
        .post('/api/verification/verify-otp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ verificationId, otpCode });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.verified).toBe(true);
    });

    it('debe fallar con OTP incorrecto', async () => {
      // Iniciar verificación
      const startResponse = await request(app)
        .post('/api/verification/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ documentNumber: '500000' }); // Cédula única

      // Verificar que la respuesta sea exitosa
      if (startResponse.status !== 200) {
        throw new Error(`Start verification failed: ${JSON.stringify(startResponse.body)}`);
      }

      await delay(500);

      const verificationId = startResponse.body.data.verificationId;

      // Usar OTP incorrecto
      const response = await request(app)
        .post('/api/verification/verify-otp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ verificationId, otpCode: '000000' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/verification/status', () => {
    it('debe obtener estado de verificación', async () => {
      const response = await request(app)
        .get('/api/verification/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
    });

    it('debe mostrar estado approved después de verificación exitosa', async () => {
      // Completar verificación exitosamente
      const startResponse = await request(app)
        .post('/api/verification/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ documentNumber: '600000' }); // Cédula única

      // Verificar que la respuesta sea exitosa
      if (startResponse.status !== 200) {
        throw new Error(`Start verification failed: ${JSON.stringify(startResponse.body)}`);
      }

      await delay(500);

      const verificationId = startResponse.body.data.verificationId;
      const verification = await Verification.findById(verificationId).select('+otpCode');
      const otpCode = verification.otpCode;

      await request(app)
        .post('/api/verification/verify-otp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ verificationId, otpCode });

      // Verificar estado
      const statusResponse = await request(app)
        .get('/api/verification/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.data.status).toBe('approved');
    });
  });
});
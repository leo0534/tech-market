const { User, Verification } = require('../src/models');
const jwt = require('jsonwebtoken');
const request = require('supertest');

// Limpiar base de datos completamente
const clearDatabase = async () => {
  try {
    await Verification.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Base de datos limpiada completamente');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
};

// Crear usuario de prueba
const createTestUser = async (userData = {}) => {
  const uniqueEmail = `test${Date.now()}@example.com`;
  
  const defaultUser = {
    email: uniqueEmail,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    phone: '+573001234567',
    isVerified: false
  };

  const user = new User({ ...defaultUser, ...userData });
  await user.save();
  return user;
};

// Obtener token mediante login real
const loginAndGetToken = async (app, email, password) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  
  if (response.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(response.body)}`);
  }
  
  return response.body.data.accessToken;
};

module.exports = {
  clearDatabase,
  createTestUser,
  loginAndGetToken
};
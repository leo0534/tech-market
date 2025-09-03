const { User, Verification } = require('../src/models'); // ← Añadir /src/

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
  const defaultUser = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    phone: '+573001234567'
  };

  const user = new User({ ...defaultUser, ...userData });
  await user.save();
  return user;
};

// Obtener token de autenticación
const getAuthToken = async (app, userCredentials = null) => {
  const credentials = userCredentials || {
    email: 'test@example.com',
    password: 'password123'
  };

  // Crear usuario si no existe
  let user = await User.findOne({ email: credentials.email });
  if (!user) {
    user = await createTestUser(credentials);
  }

  // Hacer login
  const response = await require('supertest')(app)
    .post('/api/auth/login')
    .send(credentials);

  if (response.status !== 200) {
    throw new Error(`Login failed: ${JSON.stringify(response.body)}`);
  }

  return response.body.data.accessToken;
};

module.exports = {
  clearDatabase,
  createTestUser,
  getAuthToken
};
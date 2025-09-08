// tests/setup.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { clearDatabase } = require('./testUtils');

let mongoServer;

// --- AÑADIDO: CONFIGURACIÓN DE VARIABLES DE ENTORNO PARA JEST ---
// Esto asegura que las variables JWT_SECRET y JWT_REFRESH_SECRET estén disponibles para todas las pruebas.
process.env.JWT_SECRET = 'test_jwt_secret_para_pruebas_12345';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_para_pruebas_67890';
// ---------------------------------------------------------------

// Configuración global antes de todas las pruebas
beforeAll(async () => {
  // Usar MongoDB en memoria para pruebas
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Configurar mongoose para usar la DB en memoria
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  console.log('✅ MongoDB en memoria iniciado para pruebas');
  
  // ✅ Limpiar base de datos antes de comenzar
  await clearDatabase();
}, 30000);

// ✅ Limpiar después de cada suite de tests
afterEach(async () => {
  await clearDatabase();
});

// Limpieza después de todas las pruebas
afterAll(async () => {
  // Cerrar conexión de MongoDB
  await mongoose.connection.close();
  
  // Detener servidor en memoria
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('✅ MongoDB en memoria detenido');
}, 30000);

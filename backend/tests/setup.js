const mongoose = require('mongoose');
const { initializeApp, closeServer } = require('../server');

// Timeout aumentado para MongoDB Atlas
jest.setTimeout(30000);

// Configuración global antes de todas las pruebas
beforeAll(async () => {
  // Cargar variables de entorno de test
  require('dotenv').config({ path: '.env.test' });
  
  // Inicializar la aplicación (conexión a DB y servidor)
  await initializeApp();
}, 30000);

// Limpieza después de todas las pruebas
afterAll(async () => {
  // Cerrar servidor
  await closeServer();
  
  // Cerrar conexión de MongoDB
  await mongoose.connection.close();
}, 30000);
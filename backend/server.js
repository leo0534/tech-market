const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Variable para controlar el servidor
let server;

// 1. Middleware de seguridad con Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "http://localhost:3001", "http://localhost:3000"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// 2. Configurar CORS para desarrollo y producción - CORREGIDO
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tech-market.com'] 
    : ['http://localhost:3001', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Cache-Control', // ✅ Añadir este header
    'Pragma'
  ]
};
app.use(cors(corsOptions));

// 3. Manejar preflight requests
app.options('*', cors(corsOptions));

// 4. Cookie parser
app.use(cookieParser());

// 5. Parseo de JSON con límite de tamaño - MOVIDO ARRIBA
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Prevenir Parameter Pollution
app.use(hpp());

// 7. Sanitización contra inyección NoSQL
app.use(mongoSanitize({
  replaceWith: '_'
}));

// 8. Límite de tasa de solicitudes para APIs sensibles
let generalLimiter, authLimiter;

if (process.env.NODE_ENV === 'test') {
  generalLimiter = (req, res, next) => next();
  authLimiter = (req, res, next) => next();
} else {
  generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente en 15 minutos.',
    skip: (req) => req.method === 'OPTIONS' // Saltar preflight requests
  });

  authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Demasiados intentos de login, intenta nuevamente en 15 minutos.',
    skip: (req) => req.method === 'OPTIONS'
  });
}

//app.use('/api/', generalLimiter);
//app.use('/api/auth/', authLimiter);

// 9. Logs con Morgan
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// 10. Servir archivos estáticos para las imágenes subidas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 11. Ruta de salud básica
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Tech Market API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// 12. Ruta de información de la API
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Tech Market API',
    version: '1.0.0',
    description: 'Marketplace seguro con verificación de identidad',
    environment: process.env.NODE_ENV,
    baseUrl: `http://localhost:${PORT}`
  });
});

// 13. Conexión a MongoDB Atlas - MODIFICADA PARA JEST
const connectDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGO_URI;
      
      // ✅ SOLUCIÓN: Validar que MONGO_URI existe en modo no-test
      if (!mongoUri && process.env.NODE_ENV !== 'test') {
        throw new Error('MONGO_URI no está definida en las variables de entorno');
      }
      
      // ✅ SOLUCIÓN: Solo conectar si no estamos en modo test o si hay URI
      if (process.env.NODE_ENV !== 'test' && mongoUri) {
        await mongoose.connect(mongoUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          retryWrites: true,
          w: 'majority'
        });
        
        console.log('✅ Conectado a MongoDB Atlas exitosamente');
      } else if (process.env.NODE_ENV === 'test') {
        // ✅ En modo test, la conexión se maneja en tests/setup.js
        console.log('🟡 Modo test: Conexión a DB manejada por Jest');
      }
    }
  } catch (error) {
    console.error('❌ Error de conexión a MongoDB Atlas:', error.message);
    
    // ✅ SOLUCIÓN: En modo test, no salir del proceso (solo lanzar error)
    if (process.env.NODE_ENV === 'test') {
      throw error; // Jest atrapará este error
    } else {
      process.exit(1);
    }
  }
};

// 14. Importar y usar rutas
const authRoutes = require('./src/routes/auth');
const verificationRoutes = require('./src/routes/verification');
const productRoutes = require('./src/routes/products');

// Usar rutas - ORDEN CORRECTO
app.use('/api/auth', authRoutes);
app.use('/api/auth/verify', verificationRoutes);
app.use('/api/products', productRoutes);

// 15. Middleware para debug de rutas
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  }
  next();
});

// 16. Ruta para testing de verificación
app.get('/api/auth/verify/test', (req, res) => {
  res.json({
    success: true,
    message: 'Ruta de verificación funcionando correctamente',
    data: {
      status: 'not_started',
      timestamp: new Date().toISOString()
    }
  });
});

// 17. Manejo de errores global
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('🔥 Error no manejado:', err.stack);
  }
  
  // Asegurar que siempre se devuelva JSON
  res.status(err.status || 500).json({ 
    success: false,
    message: 'Algo salió mal!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 18. Ruta para manejar endpoints no existentes - DEBE IR AL FINAL
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    availableEndpoints: [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/verify/start',
      '/api/auth/verify/otp',
      '/api/auth/verify/status',
      '/api/products',
      '/health'
    ]
  });
});

// 19. Función para iniciar el servidor
const startServer = () => {
  return new Promise((resolve, reject) => {
    // ✅ SOLUCIÓN: No iniciar servidor en modo test
    if (process.env.NODE_ENV === 'test') {
      console.log('🟡 Modo test: Servidor no iniciado (manejado por Jest)');
      resolve({}); // Resolver con objeto vacío para tests
      return;
    }
    
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Verification test: http://localhost:${PORT}/api/auth/verify/test`);
      console.log(`📧 API Base: http://localhost:${PORT}/api`);
      resolve(server);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ El puerto ${PORT} está en uso. Intenta con otro puerto.`);
        process.exit(1);
      }
      reject(err);
    });
  });
};

// 20. Función para cerrar el servidor
const closeServer = () => {
  return new Promise((resolve, reject) => {
    if (server) {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          if (process.env.NODE_ENV !== 'test') {
            console.log('Servidor cerrado');
          }
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

// 21. Inicializar la aplicación
const initializeApp = async () => {
  try {
    await connectDatabase();
    
    if (process.env.NODE_ENV !== 'test') {
      await startServer();
    }
  } catch (error) {
    console.error('Error inicializando la aplicación:', error);
    
    // ✅ SOLUCIÓN: En modo test, no salir del proceso
    if (process.env.NODE_ENV === 'test') {
      throw error; // Jest manejará este error
    } else {
      process.exit(1);
    }
  }
};

// 22. Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🛑 Recibida señal de interrupción (SIGINT)');
  await closeServer();
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recibida señal de terminación (SIGTERM)');
  await closeServer();
  await mongoose.connection.close();
  process.exit(0);
});

// 23. Solo iniciar automáticamente si no es test
if (process.env.NODE_ENV !== 'test') {
  initializeApp().catch(console.error);
}

// 24. Exportar para testing
module.exports = {
  app,
  startServer,
  closeServer,
  initializeApp,
  mongooseConnection: mongoose.connection
};
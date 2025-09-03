const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Variable para controlar el servidor
let server;

// 1. Middleware de seguridad con Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// 2. Configurar CORS para desarrollo y producción
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://tech-market.com']  // Cambia por tu dominio real
    : ['http://localhost:3001', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 3. Cookie parser
app.use(cookieParser());

// 4. Prevenir Parameter Pollution
app.use(hpp());

// 5. Sanitización contra inyección NoSQL
app.use(mongoSanitize({
  replaceWith: '_'
}));

// 6. Límite de tasa de solicitudes para APIs sensibles
let generalLimiter, authLimiter;

if (process.env.NODE_ENV === 'test') {
  // En testing, usar middleware dummy sin rate limiting
  generalLimiter = (req, res, next) => next();
  authLimiter = (req, res, next) => next();
} else {
  // En producción/desarrollo, usar rate limiting real
  generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // límite de 100 solicitudes por ventana
    message: 'Demasiadas solicitudes desde esta IP, intenta nuevamente en 15 minutos.'
  });

  authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // Solo 5 intentos de login cada 15 minutos
    message: 'Demasiados intentos de login, intenta nuevamente en 15 minutos.'
  });
}

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// 7. Logs con Morgan
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// 8. Parseo de JSON con límite de tamaño
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 9. Ruta de salud básica
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Tech Market API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 10. Ruta de información de la API
app.get('/api/info', (req, res) => {
  res.json({
    name: 'Tech Market API',
    version: '1.0.0',
    description: 'Marketplace seguro con verificación de identidad',
    environment: process.env.NODE_ENV
  });
});

// 11. Conexión a MongoDB Atlas
const connectDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        retryWrites: true,
        w: 'majority'
      });
      
      if (process.env.NODE_ENV !== 'test') {
        console.log('✅ Conectado a MongoDB Atlas exitosamente');
      }
    }
  } catch (error) {
    console.error('❌ Error de conexión a MongoDB Atlas:', error.message);
    process.exit(1);
  }
};

// 12. Importar y usar rutas
const authRoutes = require('./src/routes/auth');
const verificationRoutes = require('./src/routes/verification'); // ← NUEVA LÍNEA

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/verification', verificationRoutes); // ← NUEVA LÍNEA

// 13. Manejo de errores global
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('🔥 Error no manejado:', err.stack);
  }
  
  res.status(500).json({ 
    message: 'Algo salió mal!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor'
  });
});

// 14. Ruta para manejar endpoints no existentes
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// 15. Función para iniciar el servidor
const startServer = () => {
  return new Promise((resolve, reject) => {
    server = app.listen(PORT, () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
        console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      }
      resolve(server);
    });
  });
};

// 16. Función para cerrar el servidor
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

// 17. Inicializar la aplicación
const initializeApp = async () => {
  try {
    await connectDatabase();
    
    if (process.env.NODE_ENV !== 'test') {
      await startServer();
    }
  } catch (error) {
    console.error('Error inicializando la aplicación:', error);
    process.exit(1);
  }
};

// 18. Manejo de cierre graceful
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

// 19. Solo iniciar automáticamente si no es test
if (process.env.NODE_ENV !== 'test') {
  initializeApp().catch(console.error);
}

// 20. Exportar para testing
module.exports = {
  app,
  startServer,
  closeServer,
  initializeApp,
  mongooseConnection: mongoose.connection
};
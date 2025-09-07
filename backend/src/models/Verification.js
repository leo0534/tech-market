const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  documentType: {
    type: String,
    enum: ['cedula_colombiana', 'cedula_extranjeria', 'pasaporte'],
    required: true
  },
  
  documentNumber: {
    type: String,
    required: function() {
      // Solo requerido si el estado es approved, rejected, o pending_review
      return ['approved', 'rejected', 'pending_review'].includes(this.status);
    },
    validate: {
      validator: function(v) {
        if (!v) return true; // No validar si está vacío
        return /^\d{6,10}$/.test(v.replace(/\D/g, ''));
      },
      message: 'El número de documento debe contener entre 6 y 10 dígitos'
    }
  },
  
  documentHash: {
  type: String,
  unique: true,
  sparse: true
},
  
  frontImage: {
    type: String,
    required: true
  },
  
  backImage: {
    type: String,
    required: false
  },
  
  status: {
    type: String,
    enum: ['pending', 'processing', 'pending_review', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },
  
  verificationMethod: {
    type: String,
    enum: ['ocr', 'enhanced_ocr', 'manual', 'api', 'forced'],
    default: 'ocr'
  },
  
  extractedData: {
    firstName: String,
    lastName: String,
    documentNumber: String,
    issueDate: Date,
    expirationDate: Date,
    confidence: Number
  },
  
  verificationDate: {
    type: Date,
    required: function() {
      return this.status === 'approved';
    }
  },
  
  rejectionReason: String,
  reviewReason: String,
  
  previousAttempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Verification'
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  reviewedAt: Date,
  
  attempts: {
    type: Number,
    default: 1
  },
  
  errorDetails: mongoose.Schema.Types.Mixed
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejor performance
verificationSchema.index({ userId: 1, status: 1 });
verificationSchema.index({ status: 1 });
verificationSchema.index({ createdAt: 1 });

// Virtual para verificar si está activa
verificationSchema.virtual('isActive').get(function() {
  return ['pending', 'processing', 'pending_review'].includes(this.status);
});

// Virtual para verificar si está completada
verificationSchema.virtual('isCompleted').get(function() {
  return ['approved', 'rejected', 'expired'].includes(this.status);
});

// Método estático para encontrar verificaciones activas
verificationSchema.statics.findActiveVerification = function(userId) {
  return this.findOne({
    userId,
    status: { $in: ['pending', 'processing', 'pending_review'] }
  });
};

// Método estático para contar intentos recientes
verificationSchema.statics.countRecentAttempts = function(userId, hours = 24) {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);
  
  return this.countDocuments({
    userId,
    createdAt: { $gte: cutoffDate }
  });
};

// Middleware pre-save para generar documentHash si hay documentNumber
verificationSchema.pre('save', function(next) {
  if (this.isModified('documentNumber')) {
    if (this.documentNumber) {
      try {
        const { generateDocumentHash } = require('../utils/encryption');
        this.documentHash = generateDocumentHash(this.documentNumber);
      } catch (error) {
        this.documentHash = null;
      }
    } else {
      // ✅ FORZAR null explícitamente
      this.documentHash = null;
    }
  }
  next();
});

// Middleware para manejar errores de índice único
verificationSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    console.error('❌ Error de índice único:', error.message);
    
    // Si es error de documentHash, intentar con validateBeforeSave: false
    if (error.keyPattern && error.keyPattern.documentHash) {
      console.log('🔄 Intentando guardar sin validación de índice...');
      this.constructor.findByIdAndUpdate(
        this._id,
        { $set: { documentHash: null } },
        { runValidators: false }
      )
      .then(() => next())
      .catch(err => next(err));
    } else {
      next(error);
    }
  } else {
    next(error);
  }
});

// Método de instancia para aprobar verificación
verificationSchema.methods.approve = function(reviewerId = null) {
  this.status = 'approved';
  this.verificationDate = new Date();
  if (reviewerId) {
    this.reviewedBy = reviewerId;
    this.reviewedAt = new Date();
  }
  return this.save();
};

// Método de instancia para rechazar verificación
verificationSchema.methods.reject = function(reason, reviewerId = null) {
  this.status = 'rejected';
  this.rejectionReason = reason;
  if (reviewerId) {
    this.reviewedBy = reviewerId;
    this.reviewedAt = new Date();
  }
  return this.save();
};

// Método de instancia para marcar como expirada
verificationSchema.methods.expire = function() {
  this.status = 'expired';
  this.rejectionReason = 'Verificación expirada por inactividad';
  return this.save();
};

// Método estático para limpiar índices problemáticos
verificationSchema.statics.cleanupIndexes = async function() {
  try {
    const collection = this.collection;
    
    // Listar todos los índices
    const indexes = await collection.indexes();
    
    // Buscar índice problemático de documentHash sin sparse
    const problematicIndex = indexes.find(index => 
      index.key && index.key.documentHash === 1 && 
      index.unique && !index.sparse
    );
    
    if (problematicIndex) {
      console.log('🗑️ Eliminando índice problemático...');
      await collection.dropIndex(problematicIndex.name);
      console.log('✅ Índice problemático eliminado:', problematicIndex.name);
    }
    
    // Crear índice sparse si no existe
    const sparseIndexExists = indexes.find(index => 
      index.key && index.key.documentHash === 1 && 
      index.unique && index.sparse
    );
    
    if (!sparseIndexExists) {
      console.log('🔄 Creando índice sparse...');
      await collection.createIndex(
        { documentHash: 1 },
        { unique: true, sparse: true, background: true }
      );
      console.log('✅ Índice sparse creado exitosamente');
    }
    
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
      console.log('ℹ️ Índice no encontrado, creando nuevo índice sparse...');
      await this.collection.createIndex(
        { documentHash: 1 },
        { unique: true, sparse: true, background: true }
      );
    } else {
      console.error('❌ Error en cleanupIndexes:', error);
    }
  }
};

// Ejecutar cleanup al iniciar la aplicación
if (process.env.NODE_ENV !== 'test') {
  mongoose.connection.on('connected', async () => {
    try {
      await mongoose.model('Verification').cleanupIndexes();
    } catch (error) {
      console.error('❌ Error ejecutando cleanup de índices:', error);
    }
  });
}

module.exports = mongoose.model('Verification', verificationSchema);
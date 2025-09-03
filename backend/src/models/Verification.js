const mongoose = require('mongoose');
const crypto = require('crypto');

const verificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentType: {
    type: String,
    enum: ['cedula_colombiana'],
    default: 'cedula_colombiana'
  },
  // Hash del número de documento (no almacenamos el número real)
  documentHash: {
    type: String,
    required: true,
    unique: true
  },
  documentNumber: {
    type: String,
    required: true,
    select: false // Solo accessible explícitamente
  },
  // Datos cifrados para máxima seguridad
  encryptedData: {
    type: String,
    required: true,
    select: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },
  verificationMethod: {
    type: String,
    enum: ['manual', 'api_kyc', 'otp'],
    default: 'manual'
  },
  // Metadata de la verificación
  verificationDate: {
    type: Date
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  // Para verificación por OTP
  otpCode: {
    type: String,
    select: false
  },
  otpExpires: {
    type: Date,
    select: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  // Selfie y documento
  selfieImage: {
    type: String // URL o path a la imagen
  },
  documentImage: {
    type: String // URL o path a la imagen
  }
}, {
  timestamps: true
});

// Índices
verificationSchema.index({ userId: 1 });
verificationSchema.index({ documentHash: 1 });
verificationSchema.index({ status: 1, createdAt: 1 });
verificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 * 30 }); // Auto-borrar después de 30 días

// Método para generar hash del documento
verificationSchema.methods.generateDocumentHash = function(documentNumber) {
  const salt = process.env.DOCUMENT_SALT || 'default_salt_change_in_production';
  return crypto
    .createHash('sha256')
    .update(documentNumber + salt)
    .digest('hex');
};

module.exports = mongoose.model('Verification', verificationSchema);
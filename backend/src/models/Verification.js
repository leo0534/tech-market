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
    enum: ['cedula_colombiana', 'cedula_extranjeria', 'pasaporte'],
    default: 'cedula_colombiana'
  },
  documentHash: {
    type: String,
    required: true,
    unique: true
  },
  documentNumber: {
    type: String,
    required: true,
    select: false
  },
  // Campos para almacenar datos extraídos de la cédula
  extractedData: {
    firstName: String,
    lastName: String,
    documentNumber: String,
    issueDate: Date,
    expirationDate: Date,
    confidence: Number // Nivel de confianza de la extracción
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'pending_review'], // ELIMINADO: 'expired', 'pending_otp'
    default: 'pending'
  },
  verificationMethod: {
    type: String,
    enum: ['manual', 'api_kyc', 'ocr'], // ELIMINADO: 'otp'
    default: 'ocr'
  },
  verificationDate: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5
  },
  // Imágenes de la cédula
  frontImage: {
    type: String,
    required: true
  },
  backImage: {
    type: String,
    required: true
  },
  // Selfie para comparación facial (opcional)
  selfieImage: {
    type: String
  }
}, {
  timestamps: true
});

// Índices
verificationSchema.index({ userId: 1 });
verificationSchema.index({ documentHash: 1 });
verificationSchema.index({ status: 1, createdAt: 1 });

// Método para comparar con datos del usuario
verificationSchema.methods.compareWithUserData = function(user) {
  const similarities = {};
  
  if (this.extractedData.firstName && user.firstName) {
    similarities.firstName = this.calculateSimilarity(
      this.extractedData.firstName.toLowerCase(),
      user.firstName.toLowerCase()
    );
  }
  
  if (this.extractedData.lastName && user.lastName) {
    similarities.lastName = this.calculateSimilarity(
      this.extractedData.lastName.toLowerCase(),
      user.lastName.toLowerCase()
    );
  }
  
  return similarities;
};

// Método para calcular similitud entre strings
verificationSchema.methods.calculateSimilarity = function(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  return (longer.length - this.editDistance(longer, shorter)) / parseFloat(longer.length);
};

// Distancia de edición para cálculo de similitud
verificationSchema.methods.editDistance = function(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
};

module.exports = mongoose.model('Verification', verificationSchema);
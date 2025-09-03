const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedItem: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  itemType: {
    type: String,
    enum: ['user', 'product', 'review', 'message'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'fraud',
      'inappropriate_content',
      'harassment',
      'fake_product',
      'wrong_category',
      'personal_info',
      'other'
    ]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved', 'dismissed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  // Para seguimiento
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  resolution: {
    type: String,
    trim: true
  },
  resolutionDetails: {
    type: String,
    trim: true
  },
  // Evitar reportes duplicados
  evidence: [{
    type: String // URLs de imágenes o capturas
  }]
}, {
  timestamps: true
});

// Índices
reportSchema.index({ reportedItem: 1, itemType: 1 });
reportSchema.index({ status: 1, priority: -1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ createdAt: -1 });

// Método para verificar reportes duplicados
reportSchema.statics.findDuplicate = async function(reportedItem, itemType, reporter) {
  return await this.findOne({
    reportedItem,
    itemType,
    reporter,
    createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Últimas 24 horas
  });
};

module.exports = mongoose.model('Report', reportSchema);
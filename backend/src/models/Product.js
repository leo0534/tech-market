const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es requerido'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es requerida'],
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  currency: {
    type: String,
    default: 'COP',
    enum: ['COP', 'USD']
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: [
      'tecnologia',
      'hogar',
      'ropa',
      'deportes',
      'vehiculos',
      'inmuebles',
      'empleos',
      'servicios',
      'otros'
    ]
  },
  condition: {
    type: String,
    required: true,
    enum: ['nuevo', 'usado', 'reacondicionado'],
    default: 'usado'
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    thumbnail: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  status: {
    type: String,
    enum: ['active', 'sold', 'reserved', 'inactive', 'deleted'],
    default: 'active'
  },
  isNegotiable: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  },
  // Para productos vendidos
  soldAt: {
    type: Date
  },
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Metadata de moderación
  isApproved: {
    type: Boolean,
    default: true
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices para búsquedas
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ 'location.coordinates': '2dsphere' });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ status: 1, createdAt: -1 });

// Método para marcar como vendido
productSchema.methods.markAsSold = function(buyerId) {
  this.status = 'sold';
  this.soldAt = new Date();
  this.soldTo = buyerId;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
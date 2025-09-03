const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: 'La calificación debe ser un número entero'
    }
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'El comentario no puede exceder 500 caracteres']
  },
  type: {
    type: String,
    enum: ['buyer', 'seller'],
    required: true
  },
  isRecommended: {
    type: Boolean,
    default: true
  },
  // Moderación
  isApproved: {
    type: Boolean,
    default: true
  },
  reported: {
    type: Boolean,
    default: false
  },
  reportReason: {
    type: String,
    trim: true
  },
  response: {
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'La respuesta no puede exceder 500 caracteres']
    },
    respondedAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Índices
reviewSchema.index({ product: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ reviewedUser: 1, type: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Middleware para actualizar el rating del usuario
reviewSchema.post('save', async function() {
  const User = mongoose.model('User');
  
  const stats = await this.constructor.aggregate([
    { $match: { reviewedUser: this.reviewedUser, isApproved: true } },
    {
      $group: {
        _id: '$reviewedUser',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await User.findByIdAndUpdate(this.reviewedUser, {
      rating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
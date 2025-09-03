const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Para bloqueo de conversaciones
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blockReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices
conversationSchema.index({ participants: 1 });
conversationSchema.index({ product: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ participants: 1, product: 1 }, { unique: true });

// Método estático para encontrar o crear conversación
conversationSchema.statics.findOrCreate = async function(participants, productId) {
  let conversation = await this.findOne({
    participants: { $all: participants },
    product: productId,
    isActive: true
  }).populate('participants', 'firstName lastName avatar isVerified');

  if (!conversation) {
    conversation = await this.create({
      participants,
      product: productId
    });
    conversation = await conversation.populate('participants', 'firstName lastName avatar isVerified');
  }

  return conversation;
};

module.exports = mongoose.model('Conversation', conversationSchema);
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'El mensaje no puede exceder 1000 caracteres']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'offer', 'system'],
    default: 'text'
  },
  // Para mensajes de oferta
  offerAmount: {
    type: Number,
    min: 0
  },
  offerStatus: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'countered'],
    default: 'pending'
  },
  // Para archivos adjuntos
  attachments: [{
    url: String,
    filename: String,
    mimetype: String,
    size: Number
  }],
  // Para tracking de lectura
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  // Para mensajes eliminados
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Índices
messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ createdAt: -1 });

// Middleware para actualizar lastMessage en la conversación
messageSchema.post('save', async function() {
  const Conversation = mongoose.model('Conversation');
  await Conversation.findByIdAndUpdate(this.conversation, {
    lastMessage: this._id,
    lastMessageAt: this.createdAt
  });
});

module.exports = mongoose.model('Message', messageSchema);
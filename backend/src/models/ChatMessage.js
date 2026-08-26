import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emergencyRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmergencyRequest'
    },
    messageType: {
      type: String,
      enum: ['Text', 'System', 'Location'],
      default: 'Text'
    },
    content: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

chatMessageSchema.index({ emergencyRequest: 1 });
chatMessageSchema.index({ sender: 1, receiver: 1 });
chatMessageSchema.index({ createdAt: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export default ChatMessage;

import mongoose from 'mongoose';

const mentionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  startPosition: {
    type: Number,
    required: true
  },
  endPosition: {
    type: Number,
    required: true
  }
});

const chatMessageSchema = new mongoose.Schema({
  sender: {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    avatar: {
      type: String
    },
    role: {
      type: String,
      enum: ['admin', 'rescue-team', 'user'],
      required: true
    },
    teamId: {
      type: String
    }
  },
  content: {
    type: String,
    required: true
  },
  mentions: [mentionSchema],
  isSuper: {
    type: Boolean,
    default: false
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage; 
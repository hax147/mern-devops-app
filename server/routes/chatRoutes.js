import express from 'express';
import ChatMessage from '../models/chatMessage.js';
import { optionalAuthenticateJWT } from '../middleware/auth.js';

const router = express.Router();

// Get all chat messages with pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await ChatMessage.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Return messages in chronological order for display
    const totalMessages = await ChatMessage.countDocuments();
    
    res.status(200).json({
      messages: messages.reverse(),
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Post a new message
router.post('/', optionalAuthenticateJWT, async (req, res) => {
  try {
    const { content, mentions, sender, isAnnouncement } = req.body;
    
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Message content is required' });
    }
    
    // Ensure role is either admin or rescue-team
    const senderRole = sender?.role;
    if (senderRole !== 'admin' && senderRole !== 'rescue-team') {
      return res.status(403).json({ 
        message: 'Access denied. Only admin and rescue-team users can post messages.'
      });
    }
    
    // Ensure announcements can only be made by admins
    if (isAnnouncement && senderRole !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Only admin users can make announcements.'
      });
    }
    
    // If user is not authenticated but we're in development, allow using a mock sender
    if (!req.user && sender && process.env.NODE_ENV !== 'production') {
      const newMessage = new ChatMessage({
        content,
        mentions: mentions || [],
        sender,
        isSuper: sender.role === 'admin',
        isAnnouncement: isAnnouncement && sender.role === 'admin' // Only admins can make announcements
      });
      
      await newMessage.save();
      
      // Emit the message to all connected clients
      if (req.io) {
        req.io.emit('new_message', newMessage);
      }
      
      return res.status(201).json(newMessage);
    }
    
    // In production, user must be authenticated to send messages
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required to send messages' });
    }
    
    // Verify authenticated user's role
    if (req.user.role !== 'admin' && req.user.role !== 'rescue-team') {
      return res.status(403).json({ 
        message: 'Access denied. Only admin and rescue-team users can post messages.'
      });
    }
    
    // Create a new message
    const newMessage = new ChatMessage({
      content,
      mentions: mentions || [],
      sender: {
        id: req.user.id || req.user._id || req.user.email, // Accept different ID formats
        name: req.user.name,
        avatar: req.user.avatar,
        role: req.user.role,
        teamId: req.user.teamId
      },
      isSuper: req.user.role === 'admin', // Super messages for admins
      isAnnouncement: isAnnouncement && req.user.role === 'admin' // Only admins can make announcements
    });
    
    await newMessage.save();
    
    // Emit the message to all connected clients
    if (req.io) {
      req.io.emit('new_message', newMessage);
    }
    
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating chat message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get chat history by date range
router.get('/history', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const messages = await ChatMessage.find(query)
      .sort({ timestamp: 1 })
      .lean();
      
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router; 
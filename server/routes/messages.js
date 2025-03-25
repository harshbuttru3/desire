const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Room = require('../models/Room');
const { auth } = require('../middleware/auth');
const mongoose = require('mongoose');

// Get room messages
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is banned
    const isBanned = room.bannedUsers.some(
      ban => ban.user.toString() === req.user._id.toString()
    );
    if (isBanned) {
      return res.status(403).json({ error: 'You are banned from this room' });
    }

    // Get messages and check expiration
    const messages = await Message.find({
      room: req.params.roomId,
      deleted: false,
      isExpired: false
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate('mentions', 'username');

    // Check expiration for each message
    for (const message of messages) {
      if (message.checkExpiration()) {
        await message.save();
      }
    }

    // Filter out expired messages
    const activeMessages = messages.filter(msg => !msg.isExpired);

    res.json(activeMessages);
  } catch (error) {
    console.error('Error fetching room messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get private messages
router.get('/private/:userId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ],
      isPrivate: true,
      deleted: false
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar');

    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get room messages (using roomId query parameter)
router.get('/', auth, async (req, res) => {
  try {
    const { roomId, page = 1, limit = 50 } = req.query;
    
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ error: 'Invalid room ID format' });
    }
    
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is banned
    const isBanned = room.bannedUsers && room.bannedUsers.some(
      ban => ban.user.toString() === req.user._id.toString()
    );
    if (isBanned) {
      return res.status(403).json({ error: 'You are banned from this room' });
    }

    // Get messages and check expiration
    const messages = await Message.find({
      room: roomId,
      deleted: false,
      isExpired: false
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate('mentions', 'username');

    // Check expiration for each message
    for (const message of messages) {
      if (message.checkExpiration()) {
        await message.save();
      }
    }

    // Filter out expired messages
    const activeMessages = messages.filter(msg => !msg.isExpired);

    res.json(activeMessages);
  } catch (error) {
    console.error('Error fetching room messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send message (using roomId in request body)
router.post('/', auth, async (req, res) => {
  try {
    const { roomId, content, type = 'text', fileUrl, fileName, fileSize, fileType } = req.body;
    
    if (!content && type === 'text') {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ error: 'Invalid room ID format' });
    }
    
    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is banned
    const isBanned = room.bannedUsers && room.bannedUsers.some(
      ban => ban.user.toString() === req.user._id.toString()
    );
    if (isBanned) {
      return res.status(403).json({ error: 'You are banned from this room' });
    }

    // Check if user is a member
    const isMember = room.members.some(
      member => member.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      room.members.push(req.user._id);
      await room.save();
    }

    const message = new Message({
      sender: req.user._id,
      room: roomId,
      content,
      type,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    });

    await message.save();
    await message.populate('sender', 'username avatar');

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Send private message
router.post('/private/:userId', auth, async (req, res) => {
  try {
    const { content, type = 'text', fileUrl, fileName, fileSize, fileType } = req.body;

    const message = new Message({
      sender: req.user._id,
      receiver: req.params.userId,
      content,
      type,
      isPrivate: true,
      fileUrl,
      fileName,
      fileSize,
      fileType
    });

    await message.save();

    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Edit message
router.patch('/:messageId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if user is the sender or admin
    if (
      message.sender.toString() !== req.user._id.toString() &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// React to message
router.post('/:messageId/react', auth, async (req, res) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Remove existing reaction from user if exists
    message.reactions = message.reactions.filter(
      reaction => reaction.user.toString() !== req.user._id.toString()
    );

    // Add new reaction
    message.reactions.push({
      user: req.user._id,
      emoji
    });

    await message.save();

    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark messages as read
router.post('/read', auth, async (req, res) => {
  try {
    const { messageIds, roomId } = req.body;

    // Update room messages
    if (roomId) {
      const room = await Room.findById(roomId);
      if (room) {
        const memberIndex = room.members.findIndex(
          member => member.user.toString() === req.user._id.toString()
        );
        if (memberIndex !== -1) {
          room.members[memberIndex].lastRead = new Date();
          await room.save();
        }
      }
    }

    // Update private messages
    if (messageIds && messageIds.length > 0) {
      await Message.updateMany(
        {
          _id: { $in: messageIds },
          receiver: req.user._id,
          isPrivate: true
        },
        {
          $addToSet: {
            readBy: {
              user: req.user._id,
              readAt: new Date()
            }
          }
        }
      );
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 
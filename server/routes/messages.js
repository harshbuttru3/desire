const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Room = require('../models/Room');
const { auth } = require('../middleware/auth');

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

    const messages = await Message.find({
      room: req.params.roomId,
      deleted: false
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'username avatar')
      .populate('mentions', 'username');

    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

// Send message to room
router.post('/room/:roomId', auth, async (req, res) => {
  try {
    const { content, type = 'text', fileUrl, fileName, fileSize, fileType } = req.body;
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

    // Check if user is a member
    const isMember = room.members.some(
      member => member.user.toString() === req.user._id.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: 'You must be a member to send messages' });
    }

    const message = new Message({
      sender: req.user._id,
      room: req.params.roomId,
      content,
      type,
      fileUrl,
      fileName,
      fileSize,
      fileType
    });

    await message.save();

    // Update last read for sender
    const memberIndex = room.members.findIndex(
      member => member.user.toString() === req.user._id.toString()
    );
    if (memberIndex !== -1) {
      room.members[memberIndex].lastRead = new Date();
      await room.save();
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
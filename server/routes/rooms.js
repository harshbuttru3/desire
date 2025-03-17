const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { auth, adminAuth } = require('../middleware/auth');

// Get all rooms
router.get('/', auth, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('creator', 'username')
      .populate('members', 'username')
      .sort('-createdAt');
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create room
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, isPrivate, password } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    // Check if room name already exists
    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ error: 'Room name already exists' });
    }

    // Validate password for private rooms
    if (isPrivate && !password) {
      return res.status(400).json({ error: 'Password is required for private rooms' });
    }

    const room = new Room({
      name,
      description,
      isPrivate,
      password,
      creator: req.user._id,
      members: [req.user._id]
    });

    await room.save();

    // Add room to user's rooms
    req.user.rooms.push(room._id);
    await req.user.save();

    const populatedRoom = await room
      .populate('creator', 'username')
      .populate('members', 'username');

    res.status(201).json(populatedRoom);
  } catch (error) {
    console.error('Room creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get room by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('creator', 'username')
      .populate('members', 'username');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Join room
router.post('/:id/join', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.isPrivate && room.password !== req.body.password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    if (!room.members.includes(req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }

    const populatedRoom = await room
      .populate('creator', 'username')
      .populate('members', 'username');

    res.json(populatedRoom);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Leave room
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    room.members = room.members.filter(
      memberId => memberId.toString() !== req.user._id.toString()
    );

    await room.save();

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete room
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await room.remove();

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update room settings (admin/moderator only)
router.patch('/:id/settings', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is admin or moderator
    const isAdmin = req.user.isAdmin;
    const isModerator = room.moderators.some(
      moderator => moderator.toString() === req.user._id.toString()
    );

    if (!isAdmin && !isModerator) {
      return res.status(403).json({ error: 'Not authorized to update room settings' });
    }

    // Update settings
    Object.assign(room.settings, req.body);
    await room.save();

    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Ban user from room (admin/moderator only)
router.post('/:id/ban', auth, async (req, res) => {
  try {
    const { userId, reason, duration } = req.body;
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is admin or moderator
    const isAdmin = req.user.isAdmin;
    const isModerator = room.moderators.some(
      moderator => moderator.toString() === req.user._id.toString()
    );

    if (!isAdmin && !isModerator) {
      return res.status(403).json({ error: 'Not authorized to ban users' });
    }

    // Add user to banned list
    room.bannedUsers.push({
      user: userId,
      reason,
      bannedUntil: duration ? new Date(Date.now() + duration * 1000) : null
    });

    // Remove user from members
    room.members = room.members.filter(
      member => member.user.toString() !== userId
    );

    await room.save();

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Unban user from room (admin/moderator only)
router.post('/:id/unban', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is admin or moderator
    const isAdmin = req.user.isAdmin;
    const isModerator = room.moderators.some(
      moderator => moderator.toString() === req.user._id.toString()
    );

    if (!isAdmin && !isModerator) {
      return res.status(403).json({ error: 'Not authorized to unban users' });
    }

    // Remove user from banned list
    room.bannedUsers = room.bannedUsers.filter(
      ban => ban.user.toString() !== userId
    );

    await room.save();

    res.json({ message: 'User unbanned successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 
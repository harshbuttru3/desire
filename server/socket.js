const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Room = require('./models/Room');
const Message = require('./models/Message');

const setupSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST']
    }
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Store active users
  const activeUsers = new Map();

  io.on('connection', (socket) => {
    console.log('User connected:', socket.user.username);

    // Store user's socket ID
    activeUsers.set(socket.user._id.toString(), socket.id);

    // Join user's rooms if they exist
    if (socket.user.rooms && socket.user.rooms.length > 0) {
      socket.user.rooms.forEach(roomId => {
        socket.join(roomId);
      });
    }

    // Handle joining a room
    socket.on('join_room', async (roomId) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user has access to the room
        if (room.isPrivate && !room.members.includes(socket.user._id)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(roomId);
        
        // Add room to user's rooms if not already present
        if (!socket.user.rooms.includes(roomId)) {
          socket.user.rooms.push(roomId);
          await socket.user.save();
        }
        
        socket.emit('room_joined', roomId);
      } catch (error) {
        socket.emit('error', { message: 'Error joining room' });
      }
    });

    // Handle leaving a room
    socket.on('leave_room', async (roomId) => {
      try {
        socket.leave(roomId);
        
        // Remove room from user's rooms
        socket.user.rooms = socket.user.rooms.filter(id => id.toString() !== roomId);
        await socket.user.save();
        
        socket.emit('room_left', roomId);
      } catch (error) {
        socket.emit('error', { message: 'Error leaving room' });
      }
    });

    // Handle new message
    socket.on('message', async (message) => {
      try {
        const room = await Room.findById(message.roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user has access to the room
        if (room.isPrivate && !room.members.includes(socket.user._id)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Create and save the message
        const newMessage = new Message({
          content: message.content,
          sender: socket.user._id,
          room: message.roomId,
          type: message.type || 'text',
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          fileSize: message.fileSize,
          fileType: message.fileType
        });

        await newMessage.save();

        // Populate sender information
        await newMessage.populate('sender', 'username avatar');

        // Broadcast message to room
        io.to(message.roomId).emit('message', newMessage);
      } catch (error) {
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Handle message edit
    socket.on('message_edited', async (message) => {
      try {
        const room = await Room.findById(message.roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user has access to the room
        if (room.isPrivate && !room.members.includes(socket.user._id)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Update message in database
        const updatedMessage = await Message.findByIdAndUpdate(
          message._id,
          {
            content: message.content,
            edited: true,
            editedAt: new Date()
          },
          { new: true }
        ).populate('sender', 'username avatar');

        // Broadcast edited message to room
        io.to(message.roomId).emit('message_edited', updatedMessage);
      } catch (error) {
        socket.emit('error', { message: 'Error editing message' });
      }
    });

    // Handle message deletion
    socket.on('message_deleted', async (messageId) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        const room = await Room.findById(message.roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user has access to the room
        if (room.isPrivate && !room.members.includes(socket.user._id)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Soft delete the message
        message.deleted = true;
        message.deletedAt = new Date();
        await message.save();

        // Broadcast message deletion to room
        io.to(message.roomId).emit('message_deleted', messageId);
      } catch (error) {
        socket.emit('error', { message: 'Error deleting message' });
      }
    });

    // Handle typing status
    socket.on('typing', (roomId) => {
      socket.to(roomId).emit('user_typing', {
        userId: socket.user._id,
        username: socket.user.username
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.username);
      activeUsers.delete(socket.user._id.toString());
    });
  });

  return io;
};

module.exports = setupSocket; 
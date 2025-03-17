require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Join a room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    io.to(roomId).emit('user_joined', {
      userId: socket.id,
      timestamp: new Date()
    });
  });

  // Leave a room
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    io.to(roomId).emit('user_left', {
      userId: socket.id,
      timestamp: new Date()
    });
  });

  // Handle new messages
  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', {
      ...data,
      timestamp: new Date()
    });
  });

  // Handle private messages
  socket.on('send_private_message', (data) => {
    io.to(data.receiverId).emit('receive_private_message', {
      ...data,
      timestamp: new Date()
    });
  });

  // Handle typing status
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', {
      userId: socket.id,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes will be added here
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/messages', require('./routes/messages'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 
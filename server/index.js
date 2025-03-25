require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const setupSocket = require('./socket');

const app = express();
const server = http.createServer(app);

// Configure CORS for both REST API and Socket.IO
const corsOptions = {
  origin: process.env.CLIENT_URL || ['http://localhost:3000', 'http://192.168.29.220:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Set up Socket.IO
const io = setupSocket(server);

// Enable CORS for Express
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/messages', require('./routes/messages'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the server at:`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- Network: http://<your-ip-address>:${PORT}`);
}); 
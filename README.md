# Desire Chat Application

A real-time chat application built with React.js, Node.js, Express.js, Socket.IO, and MongoDB.

## Features

- User authentication (register, login, guest login)
- Real-time messaging
- Public and private chat rooms
- Message editing and deletion
- Dark/light mode
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/desire-chat.git
cd desire-chat
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

4. Configure environment variables:

Server (.env):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/desire-chat
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:3000
```

Client (.env):
```
REACT_APP_API_URL=http://localhost:5000
```

## Running the Application

1. Start MongoDB:
```bash
mongod
```

2. Start the server:
```bash
cd server
npm start
```

3. Start the client:
```bash
cd client
npm start
```

The application will be available at:
- Client: http://localhost:3000
- Server: http://localhost:5000

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user
- POST /api/auth/guest - Guest login

### Users
- GET /api/users - Get all users
- GET /api/users/:id - Get user by ID
- PATCH /api/users/:id - Update user
- DELETE /api/users/:id - Delete user

### Rooms
- GET /api/rooms - Get all rooms
- POST /api/rooms - Create a new room
- GET /api/rooms/:id - Get room by ID
- PATCH /api/rooms/:id - Update room
- DELETE /api/rooms/:id - Delete room
- POST /api/rooms/:id/join - Join a room
- POST /api/rooms/:id/leave - Leave a room

### Messages
- GET /api/messages/:roomId - Get messages for a room
- POST /api/messages - Send a new message
- PATCH /api/messages/:id - Edit a message
- DELETE /api/messages/:id - Delete a message

## Socket.IO Events

### Client to Server
- join_room - Join a chat room
- leave_room - Leave a chat room
- message - Send a new message
- message_edited - Edit a message
- message_deleted - Delete a message
- typing - User typing status

### Server to Client
- message - New message received
- message_edited - Message edited
- message_deleted - Message deleted
- user_typing - User typing status
- error - Error message

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
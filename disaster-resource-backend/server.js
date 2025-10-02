require('dotenv').config();
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const connectDB = require('./db');

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

// Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(express.json());

// Register auth routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinRoom', (userId) => {
    socket.join(userId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Function to notify volunteer
const notifyVolunteer = (volunteerId, task) => {
  io.to(volunteerId.toString()).emit('newDeliveryTask', task);
};

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

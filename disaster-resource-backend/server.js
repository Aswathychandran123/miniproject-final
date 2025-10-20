require('dotenv').config();
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');
const connectDB = require('./db');

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

// Connect to MongoDB
connectDB();

// CORS - Allow frontend to connect
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Middleware to parse JSON
app.use(express.json());

// Register routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

const adminRoutes = require('./routes/admin');
app.use('/admin', adminRoutes);

const resourceRoutes = require('./routes/resources');
app.use('/resources', resourceRoutes);

const requestRoutes = require('./routes/requests');
app.use('/requests', requestRoutes);

const { router: deliveryRoutes } = require('./routes/deliveryTasks');
app.use('/delivery-tasks', deliveryRoutes);

const disputeRoutes = require('./routes/disputes');
app.use('/disputes', disputeRoutes);

const alertRoutes = require('./routes/alerts');
app.use('/alerts', alertRoutes);

// Make io accessible to routes
app.set('io', io);

// Run fraud detection checks every 30 minutes
const fraudDetection = require('./utils/fraudDetection');
setInterval(() => {
  fraudDetection.runAllChecks().catch(err => 
    console.error('Scheduled fraud detection error:', err)
  );
}, 30 * 60 * 1000); // 30 minutes

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinRoom', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
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

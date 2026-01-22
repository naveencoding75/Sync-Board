const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const authMiddleware = require('./middleware/authMiddleware'); // Import Middleware
const authRoutes = require('./routes/auth');
const Board = require('./models/Board');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// SOCKET IO LOGIC
io.on('connection', (socket) => {
  // 1. Join a specific "Room" based on Board ID
  socket.on('joinBoard', (boardId) => {
    socket.join(boardId);
    console.log(`User joined board: ${boardId}`);
  });

  // 2. Listen for updates and broadcast ONLY to that room
  socket.on('updateBoard', async (data) => {
    const { boardId, newBoardData } = data;
    
    await Board.findByIdAndUpdate(boardId, newBoardData);

    // Broadcast to everyone in the room EXCEPT sender
    socket.to(boardId).emit('boardUpdated', newBoardData);
  });
});

// API: Get My Board (Protected Route)
app.get('/api/board', authMiddleware, async (req, res) => {
  try {
    // Find board belonging to THIS user
    let board = await Board.findOne({ userId: req.user.id });
    
    if (!board) {
      // Create default board for this new user
      board = await Board.create({
        userId: req.user.id, // Assign to user
        title: "My Personal Board",
        tasks: {
          'task-1': { id: 'task-1', content: 'My First Task' }
        },
        columns: {
          'column-1': { id: 'column-1', title: 'To Do', taskIds: ['task-1'] },
          'column-2': { id: 'column-2', title: 'In Progress', taskIds: [] },
          'column-3': { id: 'column-3', title: 'Done', taskIds: [] },
        },
        columnOrder: ['column-1', 'column-2', 'column-3'],
      });
    }
    res.json(board);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

server.listen(5000, () => {
  console.log('🚀 Server running on port 5000');
});
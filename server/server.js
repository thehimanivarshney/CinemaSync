/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CinemaSync - Backend Server
 *  Node.js + Express + Socket.io
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  HOW TO RUN LOCALLY:
 *  1. cd server
 *  2. npm install
 *  3. node server.js   (or: npm run dev  if you add nodemon)
 *
 *  HOW TO DEPLOY FREE on Render.com:
 *  1. Push this 'server' folder to a GitHub repo
 *  2. Create a new "Web Service" on render.com
 *  3. Set Build Command: npm install
 *  4. Set Start Command: node server.js
 *  5. It's free! Copy the URL and set VITE_SOCKET_URL in your frontend env.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// ─── CORS Configuration ───────────────────────────────────────────────────
// Replace the origin with your frontend URL when deployed
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ─── In-Memory Room Store ─────────────────────────────────────────────────
// Structure: { [roomId]: { users: Map<socketId, { id, name, peerId }> } }
const rooms = new Map();

function getRoomUsers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.users.values());
}

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '🎬 CinemaSync Server is running!',
    rooms: rooms.size,
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// ─── Socket.io Events ─────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  let currentRoomId = null;
  let currentUserName = null;

  // ── Join Room ────────────────────────────────────────────────────────────
  socket.on('room:join', ({ roomId, userName, peerId }) => {
    // Leave previous room if any
    if (currentRoomId) {
      socket.leave(currentRoomId);
      const room = rooms.get(currentRoomId);
      if (room) {
        room.users.delete(socket.id);
        if (room.users.size === 0) {
          rooms.delete(currentRoomId);
        } else {
          io.to(currentRoomId).emit('room:users', getRoomUsers(currentRoomId));
        }
      }
    }

    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { users: new Map() });
      console.log(`🏠 Room created: ${roomId}`);
    }

    const room = rooms.get(roomId);

    // Add user to room
    room.users.set(socket.id, {
      id: socket.id,
      name: userName,
      peerId: peerId || null,
    });

    socket.join(roomId);
    currentRoomId = roomId;
    currentUserName = userName;

    console.log(`👤 ${userName} joined room ${roomId} (PeerID: ${peerId || 'none'})`);

    // Send updated user list to everyone in the room
    io.to(roomId).emit('room:users', getRoomUsers(roomId));

    // Confirm join to the user
    socket.emit('room:joined', { roomId, userId: socket.id });
  });

  // ── Chat Message ─────────────────────────────────────────────────────────
  socket.on('chat:message', ({ text }) => {
    if (!currentRoomId || !text?.trim()) return;

    const room = rooms.get(currentRoomId);
    if (!room) return;

    const user = room.users.get(socket.id);
    if (!user) return;

    const message = {
      id: uuidv4(),
      senderId: socket.id,
      senderName: user.name,
      text: text.trim().slice(0, 500), // Max 500 chars
      timestamp: Date.now(),
    };

    // Broadcast to everyone in the room (including sender)
    io.to(currentRoomId).emit('chat:message', message);
    console.log(`💬 [${currentRoomId}] ${user.name}: ${text.slice(0, 50)}`);
  });

  // ── Video Sync ────────────────────────────────────────────────────────────
  // Relay sync events to everyone EXCEPT the sender
  socket.on('video:sync', (event) => {
    if (!currentRoomId) return;

    const validTypes = ['play', 'pause', 'seek'];
    if (!validTypes.includes(event.type)) return;

    // Validate currentTime
    const currentTime = parseFloat(event.currentTime);
    if (isNaN(currentTime) || currentTime < 0) return;

    const syncEvent = {
      type: event.type,
      currentTime,
      timestamp: Date.now(),
    };

    // Send to everyone else in the room
    socket.to(currentRoomId).emit('video:sync', syncEvent);
    console.log(`🎬 [${currentRoomId}] Sync: ${event.type} @ ${currentTime.toFixed(2)}s`);
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id} (${currentUserName || 'unknown'})`);

    if (currentRoomId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.users.delete(socket.id);
        if (room.users.size === 0) {
          rooms.delete(currentRoomId);
          console.log(`🗑️  Room ${currentRoomId} deleted (empty)`);
        } else {
          io.to(currentRoomId).emit('room:users', getRoomUsers(currentRoomId));
        }
      }
    }
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('');
  console.log('  🎬 CinemaSync Backend Server');
  console.log('  ─────────────────────────────');
  console.log(`  ✅ Running on port ${PORT}`);
  console.log(`  🌐 http://localhost:${PORT}`);
  console.log('');
});

# 🎬 CinemaSync — Watch Together, Feel Together ❤️

A **free, private synchronized video player** with built-in text chat and WebRTC video calling — perfect for long-distance couples! This app syncs play/pause/seek between two people watching the same video file on their own devices, bypassing DRM restrictions entirely.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎬 **Synced Video Player** | Both people select their own copy of the same video file (MP4/WebM) or paste a direct URL |
| ▶️ **Perfect Sync** | Play, pause, and seek events are instantly synced via WebSockets |
| 📹 **Video Call** | WebRTC (PeerJS) picture-in-picture video/audio call in the sidebar |
| 💬 **Live Chat** | Real-time text chat with timestamps |
| 🏠 **Private Rooms** | Create a room and share the 8-character Room ID with your partner |
| 🆓 **100% Free** | No subscriptions, no accounts, no servers to pay for |

---

## 🗂️ Project Structure

```
cinemasync/
├── src/                        ← Frontend (React + Vite + Tailwind)
│   ├── components/
│   │   ├── HomePage.tsx        ← Landing page (create/join room)
│   │   ├── RoomPage.tsx        ← Main room layout
│   │   ├── VideoPlayer.tsx     ← HTML5 video player with sync
│   │   ├── ChatPanel.tsx       ← Real-time text chat
│   │   ├── VideoCallPanel.tsx  ← WebRTC video call UI
│   │   ├── RoomHeader.tsx      ← Header with room info
│   │   └── ConnectionBanner.tsx← Offline warning
│   ├── hooks/
│   │   ├── useSocket.ts        ← Socket.io client hook
│   │   └── usePeerJS.ts        ← PeerJS WebRTC hook
│   └── types/index.ts          ← TypeScript types
│
└── server/                     ← Backend (Node.js + Express + Socket.io)
    ├── server.js               ← Main server file
    └── package.json
```

---

## 🚀 STEP 1 — Local Development Setup

### A. Clone / Download the project

```bash
# If using git
git clone https://github.com/yourusername/cinemasync.git
cd cinemasync
```

### B. Setup the Frontend

```bash
# In the root directory (cinemasync/)
npm install

# Create your local env file
cp .env.example .env.local
# Edit .env.local and set: VITE_SOCKET_URL=http://localhost:3001

# Start the frontend dev server
npm run dev
# Frontend runs at: http://localhost:5173
```

### C. Setup the Backend (in a NEW terminal)

```bash
# Navigate to the server folder
cd server

# Install backend dependencies
npm install

# Start the backend server
npm start
# OR for auto-reload during development:
# npm run dev   (uses nodemon)

# Backend runs at: http://localhost:3001
```

That's it! Open `http://localhost:5173` in two browser tabs to test.

---

## 📦 STEP 2 — Understanding the Backend (`server/server.js`)

The backend does **3 things only**:

1. **Room Management** — tracks who is in which room (in-memory, no database needed)
2. **Video Sync** — receives `play/pause/seek` events from one user and relays them to the other
3. **Chat** — receives messages and broadcasts them to everyone in the room

**Socket.io Events:**

| Event | Direction | Description |
|---|---|---|
| `room:join` | Client → Server | Join a room with your name and PeerJS ID |
| `room:users` | Server → Client | Updated list of users in the room |
| `chat:message` | Both | Send/receive chat messages |
| `video:sync` | Both | Relay play/pause/seek events |

---

## 🎥 STEP 3 — How the Video Player Works

Both people must have **the same video file** saved on their computers (or use the same direct URL).

1. Click **"📁 Local File"** and select your MP4 file
2. The video plays **locally** on each device — no file is uploaded anywhere
3. When you click Play/Pause or drag the seek bar, a sync event is sent via Socket.io
4. Your partner's player receives the event and applies it silently

> **MKV Note:** MKV containers may not play in Chrome/Firefox. Convert to MP4 first using HandBrake (free) or VLC.

---

## 📹 STEP 4 — How the Video Call Works (WebRTC / PeerJS)

The video call uses **peer-to-peer WebRTC** via PeerJS. No video is routed through any server.

1. Click **"📹 Start Camera"** — this gets your camera/mic permission and generates a PeerJS ID
2. Your PeerJS ID is shared automatically with your partner via the Socket.io room
3. Click **"📞 Call [Partner's Name]"** — a WebRTC connection is established directly
4. Your partner's app automatically answers the call

> **Firewall issues?** The app uses a free TURN server (openrelay.metered.ca). If calls still fail, try on a mobile hotspot or different network.

---

## ☁️ STEP 5 — Free Deployment

### Deploy the Backend to Render.com (FREE)

1. Create a free account at [render.com](https://render.com)
2. Click **"New Web Service"**
3. Connect your GitHub repo (push `server/` contents to a new repo, or use a monorepo)
4. Settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
5. Add Environment Variable:
   - `FRONTEND_URL` = `https://your-frontend.vercel.app`
6. Click Deploy! Your server URL will be: `https://your-app.onrender.com`

> ⚠️ Free Render instances **spin down after 15 min of inactivity**. The first connection may take 30-60 seconds to wake up. Consider adding a free uptime monitor like [UptimeRobot](https://uptimerobot.com) to ping your server every 5 minutes.

---

### Deploy the Frontend to Vercel (FREE)

1. Create a free account at [vercel.com](https://vercel.com)
2. Click **"Import Project"** and connect your GitHub repo
3. Add Environment Variable:
   - `VITE_SOCKET_URL` = `https://your-app.onrender.com`
4. Click Deploy!

---

### Alternative: Deploy Backend to Railway (FREE tier)

```bash
npm install -g railway
railway login
cd server
railway init
railway up
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---|---|
| "Connecting to sync server..." shows forever | Make sure your backend is running and `VITE_SOCKET_URL` is correct |
| Video doesn't sync | Both users must be in the same room (check the Room ID) |
| MKV file doesn't play | Convert to MP4 using HandBrake or VLC |
| Video call doesn't connect | Allow camera/microphone permissions in your browser |
| Black screen on video call | Check that your camera isn't being used by another app |
| Partner's video is out of sync | Click play/pause once to re-trigger a sync event |

---

## 💡 Tips for the Best Experience

- 🎧 **Use headphones** during video calls to prevent audio echo
- 📁 **Use MP4 files** — best browser compatibility  
- 🌐 **Same network = faster sync** — but it works across the world too!
- 📱 **Works on mobile** — both of you can join from your phones
- 🔒 **Private by default** — room IDs are random and not listed anywhere

---

## 📝 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4 |
| Real-time Sync | Socket.io (client + server) |
| Video Calling | WebRTC via PeerJS |
| Backend | Node.js, Express, Socket.io |
| Frontend Hosting | Vercel (free) |
| Backend Hosting | Render.com (free) |

---

Made with ❤️ for long-distance couples everywhere 🌍💕

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface HomePageProps {
  onJoinRoom: (roomId: string, userName: string) => void;
}

export default function HomePage({ onJoinRoom }: HomePageProps) {
  const [userName, setUserName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState('');

  const handleCreate = () => {
    if (!userName.trim()) {
      setError('Please enter your name first 💕');
      return;
    }
    const newRoomId = uuidv4().slice(0, 8).toUpperCase();
    onJoinRoom(newRoomId, userName.trim());
  };

  const handleJoin = () => {
    if (!userName.trim()) {
      setError('Please enter your name first 💕');
      return;
    }
    if (!roomIdInput.trim()) {
      setError('Please enter the room ID 💕');
      return;
    }
    onJoinRoom(roomIdInput.trim().toUpperCase(), userName.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#1a0a2e] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-700 opacity-20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-rose-700 opacity-15 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-600 opacity-10 rounded-full blur-3xl animate-pulse delay-500" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎬</div>
          <h1 className="font-playfair text-5xl font-bold text-white mb-2 tracking-tight">
            CinemaSync
          </h1>
          <p className="text-rose-300 text-lg font-light tracking-wide">
            Watch together, feel together ❤️
          </p>
          <p className="text-purple-300/70 text-sm mt-2">
            Synchronized movie nights for long-distance couples
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-purple-200 text-sm font-medium mb-2">
              ✨ Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Aria or James..."
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
              maxLength={20}
            />
          </div>

          {error && (
            <p className="text-rose-400 text-sm mb-4 text-center">{error}</p>
          )}

          {/* Action Buttons */}
          {!mode && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('create')}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-rose-900/40 hover:shadow-rose-900/60 hover:scale-[1.02] active:scale-[0.98]"
              >
                🎬 Create a Room
              </button>
              <button
                onClick={() => setMode('join')}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 hover:scale-[1.02] active:scale-[0.98]"
              >
                🔗 Join a Room
              </button>
            </div>
          )}

          {mode === 'create' && (
            <div className="space-y-3">
              <p className="text-purple-200/80 text-sm text-center mb-4">
                A unique room will be created. Share the Room ID with your
                partner 💌
              </p>
              <button
                onClick={handleCreate}
                className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                ✨ Create & Enter Room
              </button>
              <button
                onClick={() => {
                  setMode(null);
                  setError('');
                }}
                className="w-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-medium py-3 rounded-xl transition-all"
              >
                ← Back
              </button>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-3">
              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">
                  🔑 Room ID
                </label>
                <input
                  type="text"
                  value={roomIdInput}
                  onChange={(e) => {
                    setRoomIdInput(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="Enter Room ID (e.g. A1B2C3D4)"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all font-mono tracking-widest uppercase"
                  maxLength={8}
                />
              </div>
              <button
                onClick={handleJoin}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                🚀 Join Room
              </button>
              <button
                onClick={() => {
                  setMode(null);
                  setError('');
                }}
                className="w-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-medium py-3 rounded-xl transition-all"
              >
                ← Back
              </button>
            </div>
          )}
        </div>

        {/* Footer features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '🎥', label: 'Synced Video' },
            { icon: '📹', label: 'Video Call' },
            { icon: '💬', label: 'Live Chat' },
          ].map((f) => (
            <div key={f.label} className="text-purple-300/60">
              <div className="text-2xl mb-1">{f.icon}</div>
              <div className="text-xs">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

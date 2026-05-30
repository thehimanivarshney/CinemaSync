import { RoomUser } from '../types';

interface RoomHeaderProps {
  roomId: string;
  myName: string;
  connectedUsers: RoomUser[];
  isSocketConnected: boolean;
  onLeave: () => void;
}

export default function RoomHeader({
  roomId,
  myName,
  connectedUsers,
  isSocketConnected,
  onLeave,
}: RoomHeaderProps) {
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-[#0e0620]/80 backdrop-blur-sm border-b border-white/10 z-10">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <span className="text-xl">🎬</span>
        <div>
          <h1 className="text-white font-bold text-sm font-playfair tracking-wide">CinemaSync</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSocketConnected ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <span className="text-white/40 text-[10px]">
              {isSocketConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Room ID & Users */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:block bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
          <span className="text-white/40 text-xs">Room: </span>
          <span className="text-purple-300 font-mono font-bold text-xs tracking-widest">
            {roomId}
          </span>
        </div>

        {/* Online users */}
        <div className="flex items-center gap-1">
          {connectedUsers.slice(0, 4).map((user, i) => (
            <div
              key={user.id}
              title={user.name + (user.name === myName ? ' (You)' : '')}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                user.name === myName
                  ? 'bg-rose-600 border-rose-400 text-white'
                  : 'bg-purple-700 border-purple-500 text-white'
              }`}
              style={{ zIndex: 4 - i, marginLeft: i > 0 ? '-8px' : '0' }}
            >
              {user.name[0]?.toUpperCase()}
            </div>
          ))}
          <span className="text-white/40 text-xs ml-2">
            {connectedUsers.length} online
          </span>
        </div>
      </div>

      {/* Right: Leave */}
      <button
        onClick={onLeave}
        className="px-3 py-1.5 bg-red-900/40 hover:bg-red-700/50 border border-red-700/30 text-red-300 hover:text-red-200 text-xs rounded-xl transition-all"
      >
        Leave Room
      </button>
    </header>
  );
}

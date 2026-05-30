import { useEffect, useRef, useState } from 'react';
import { RoomUser } from '../types';

interface VideoCallPanelProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callStatus: 'idle' | 'calling' | 'connected' | 'error';
  isMicMuted: boolean;
  isCamOff: boolean;
  myPeerId: string;
  connectedUsers: RoomUser[];
  myName: string;
  onInitCall: () => void;
  onCallPeer: (peerId: string) => void;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onEndCall: () => void;
}

export default function VideoCallPanel({
  localStream,
  remoteStream,
  callStatus,
  isMicMuted,
  isCamOff,
  myPeerId,
  connectedUsers,
  myName,
  onInitCall,
  onCallPeer,
  onToggleMic,
  onToggleCam,
  onEndCall,
}: VideoCallPanelProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const partners = connectedUsers.filter((u) => u.name !== myName);

  const statusColor = {
    idle: 'bg-gray-500',
    calling: 'bg-yellow-500 animate-pulse',
    connected: 'bg-green-500',
    error: 'bg-red-500',
  }[callStatus];

  const statusLabel = {
    idle: 'Not in call',
    calling: 'Connecting...',
    connected: 'Connected ❤️',
    error: 'Call failed',
  }[callStatus];

  return (
    <div className="bg-[#12082a]/80 backdrop-blur-sm border-t border-white/10 flex flex-col">
      {/* Toggle Header */}
      <button
        onClick={() => setIsExpanded((p) => !p)}
        className="flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold">📹 Video Call</span>
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="text-white/40 text-xs">{statusLabel}</span>
        </div>
        <svg
          className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Video feeds */}
          <div className="grid grid-cols-2 gap-2">
            {/* Local video */}
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              {localStream && !isCamOff ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
                  <div className="text-center">
                    <div className="text-2xl mb-1">{isCamOff ? '🚫' : '👤'}</div>
                    <p className="text-white/60 text-xs">You</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1.5 py-0.5">
                <span className="text-white text-[10px] font-medium">
                  {myName} (You)
                </span>
              </div>
              {isMicMuted && (
                <div className="absolute top-1 right-1 bg-red-600 rounded-full p-0.5">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Remote video */}
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              {remoteStream && callStatus === 'connected' ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-900 to-pink-900">
                  <div className="text-center">
                    <div className="text-2xl mb-1">
                      {callStatus === 'calling' ? '⏳' : '❤️'}
                    </div>
                    <p className="text-white/60 text-xs">
                      {callStatus === 'calling'
                        ? 'Connecting...'
                        : partners[0]?.name || 'Partner'}
                    </p>
                  </div>
                </div>
              )}
              {partners[0] && (
                <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1.5 py-0.5">
                  <span className="text-white text-[10px] font-medium">
                    {partners[0].name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Call controls */}
          <div className="flex items-center justify-center gap-2">
            {callStatus === 'idle' && !localStream && (
              <button
                onClick={onInitCall}
                className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-medium rounded-xl transition-all"
              >
                📹 Start Camera
              </button>
            )}

            {callStatus === 'idle' && localStream && partners.length > 0 && partners[0].peerId && (
              <button
                onClick={() => onCallPeer(partners[0].peerId!)}
                className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-medium rounded-xl transition-all"
              >
                📞 Call {partners[0].name}
              </button>
            )}

            {callStatus === 'idle' && localStream && partners.length === 0 && (
              <p className="text-white/40 text-xs text-center py-1">
                Waiting for partner to join...
              </p>
            )}

            {(callStatus === 'calling' || callStatus === 'connected') && (
              <>
                <button
                  onClick={onToggleMic}
                  className={`p-2 rounded-xl text-white text-xs transition-all ${
                    isMicMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title={isMicMuted ? 'Unmute' : 'Mute'}
                >
                  {isMicMuted ? '🔇' : '🎤'}
                </button>
                <button
                  onClick={onToggleCam}
                  className={`p-2 rounded-xl text-white text-xs transition-all ${
                    isCamOff ? 'bg-red-600 hover:bg-red-500' : 'bg-white/10 hover:bg-white/20'
                  }`}
                  title={isCamOff ? 'Show Camera' : 'Hide Camera'}
                >
                  {isCamOff ? '📵' : '📷'}
                </button>
                <button
                  onClick={onEndCall}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-xl transition-all"
                >
                  📵 End Call
                </button>
              </>
            )}

            {callStatus === 'error' && (
              <div className="flex-1 text-center">
                <p className="text-red-400 text-xs mb-1">Call failed. Check camera permissions.</p>
                <button
                  onClick={onInitCall}
                  className="px-3 py-1.5 bg-white/10 text-white text-xs rounded-lg hover:bg-white/20 transition-all"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>

          {/* Peer ID for manual calling */}
          {myPeerId && partners.length > 0 && !partners[0].peerId && (
            <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-lg p-2">
              <p className="text-yellow-300/70 text-xs">
                ⚠️ Partner connected but their peer ID isn't visible yet. Wait a moment or refresh.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

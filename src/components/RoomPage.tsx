import { useEffect, useRef, useCallback, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { usePeerJS } from '../hooks/usePeerJS';
import VideoPlayer, { VideoPlayerHandle } from './VideoPlayer';
import ChatPanel from './ChatPanel';
import VideoCallPanel from './VideoCallPanel';
import RoomHeader from './RoomHeader';
import ConnectionBanner from './ConnectionBanner';
import { SyncEvent } from '../types';

interface RoomPageProps {
  roomId: string;
  myName: string;
  onLeave: () => void;
}

export default function RoomPage({ roomId, myName, onLeave }: RoomPageProps) {
  const videoPlayerRef = useRef<VideoPlayerHandle>(null);
  const [sidebarTab, setSidebarTab] = useState<'chat' | 'call'>('chat');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing'>('idle');

  const {
    isConnected,
    connectedUsers,
    messages,
    sendMessage,
    sendSync,
    joinRoom,
    onSyncEvent,
    offSyncEvent,
  } = useSocket();

  const {
    myPeerId,
    localStream,
    remoteStream,
    callStatus,
    isMicMuted,
    isCamOff,
    initPeer,
    callPeer,
    toggleMic,
    toggleCam,
    endCall,
  } = usePeerJS();

  // Join room on mount / when connected
  useEffect(() => {
    if (isConnected) {
      joinRoom(roomId, myName, myPeerId);
    }
  }, [isConnected, roomId, myName, myPeerId, joinRoom]);

  // Re-join if peer ID updates
  useEffect(() => {
    if (isConnected && myPeerId) {
      joinRoom(roomId, myName, myPeerId);
    }
  }, [myPeerId, isConnected, roomId, myName, joinRoom]);

  // Listen for sync events from partner
  useEffect(() => {
    onSyncEvent((event: SyncEvent) => {
      setSyncStatus('syncing');
      videoPlayerRef.current?.applySync(event);
      setTimeout(() => setSyncStatus('idle'), 800);
    });
    return () => offSyncEvent();
  }, [onSyncEvent, offSyncEvent]);

  const handleSyncEvent = useCallback(
    (event: SyncEvent) => {
      sendSync(event);
    },
    [sendSync]
  );

  const handleInitCall = useCallback(async () => {
    try {
      const peerId = await initPeer();
      if (isConnected) joinRoom(roomId, myName, peerId);
    } catch (e) {
      console.error('Failed to init peer:', e);
    }
  }, [initPeer, isConnected, joinRoom, roomId, myName]);

  const partners = connectedUsers.filter((u) => u.name !== myName);
  const hasPartner = partners.length > 0;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#0e0620] via-[#150930] to-[#0e0620] overflow-hidden">
      {/* Header */}
      <RoomHeader
        roomId={roomId}
        myName={myName}
        connectedUsers={connectedUsers}
        isSocketConnected={isConnected}
        onLeave={onLeave}
      />
      <ConnectionBanner isConnected={isConnected} />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Video Player Area */}
        <div className="flex-1 flex flex-col min-w-0 p-2 gap-2">
          {/* Sync banner */}
          {syncStatus === 'syncing' && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-purple-800/90 backdrop-blur-sm text-white text-xs px-4 py-2 rounded-full shadow-lg border border-purple-500/50 animate-pulse pointer-events-none">
              🔄 Syncing with partner...
            </div>
          )}

          {/* Partner waiting notice */}
          {!hasPartner && (
            <div className="bg-rose-900/20 border border-rose-700/30 rounded-xl px-4 py-2.5 flex items-center gap-3">
              <div className="text-xl animate-pulse">💌</div>
              <div>
                <p className="text-rose-300 text-sm font-medium">
                  Waiting for your partner...
                </p>
                <p className="text-rose-400/60 text-xs">
                  Share the Room ID{' '}
                  <span className="font-mono font-bold text-rose-300">{roomId}</span>{' '}
                  with them to join!
                </p>
              </div>
            </div>
          )}

          {/* Video player */}
          <div className="flex-1 min-h-0">
            <VideoPlayer
              ref={videoPlayerRef}
              onSyncEvent={handleSyncEvent}
              partnerName={partners[0]?.name || 'your partner'}
            />
          </div>
        </div>

        {/* Sidebar (desktop) */}
        <div className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-white/10 flex-shrink-0">
          {/* Tab switcher */}
          <div className="flex-shrink-0 flex border-b border-white/10">
            <button
              onClick={() => setSidebarTab('chat')}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                sidebarTab === 'chat'
                  ? 'text-white border-b-2 border-rose-500 bg-rose-900/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setSidebarTab('call')}
              className={`flex-1 py-2.5 text-sm font-medium transition-all ${
                sidebarTab === 'call'
                  ? 'text-white border-b-2 border-purple-500 bg-purple-900/20'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              📹 Call
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {sidebarTab === 'chat' ? (
              <ChatPanel
                messages={messages}
                onSend={sendMessage}
                myName={myName}
                roomId={roomId}
              />
            ) : (
              <div className="h-full overflow-y-auto">
                <VideoCallPanel
                  localStream={localStream}
                  remoteStream={remoteStream}
                  callStatus={callStatus}
                  isMicMuted={isMicMuted}
                  isCamOff={isCamOff}
                  myPeerId={myPeerId}
                  connectedUsers={connectedUsers}
                  myName={myName}
                  onInitCall={handleInitCall}
                  onCallPeer={callPeer}
                  onToggleMic={toggleMic}
                  onToggleCam={toggleCam}
                  onEndCall={endCall}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom bar */}
      <div className="lg:hidden flex-shrink-0 border-t border-white/10 bg-[#0e0620]/90">
        <div className="flex">
          <button
            onClick={() => {
              setIsMobileSidebarOpen(true);
              setSidebarTab('chat');
            }}
            className="flex-1 py-3 text-white/60 hover:text-white text-sm flex items-center justify-center gap-2"
          >
            💬 Chat
            {messages.length > 0 && (
              <span className="bg-rose-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {messages.length > 9 ? '9+' : messages.length}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              setIsMobileSidebarOpen(true);
              setSidebarTab('call');
            }}
            className="flex-1 py-3 text-white/60 hover:text-white text-sm flex items-center justify-center gap-2"
          >
            📹 Video Call
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col"
          style={{ background: 'rgba(14,6,32,0.97)' }}
        >
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex">
              <button
                onClick={() => setSidebarTab('chat')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  sidebarTab === 'chat'
                    ? 'bg-rose-600/30 text-rose-300'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setSidebarTab('call')}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                  sidebarTab === 'call'
                    ? 'bg-purple-600/30 text-purple-300'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                📹 Call
              </button>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="text-white/50 hover:text-white p-2"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            {sidebarTab === 'chat' ? (
              <ChatPanel
                messages={messages}
                onSend={sendMessage}
                myName={myName}
                roomId={roomId}
              />
            ) : (
              <div className="h-full overflow-y-auto">
                <VideoCallPanel
                  localStream={localStream}
                  remoteStream={remoteStream}
                  callStatus={callStatus}
                  isMicMuted={isMicMuted}
                  isCamOff={isCamOff}
                  myPeerId={myPeerId}
                  connectedUsers={connectedUsers}
                  myName={myName}
                  onInitCall={handleInitCall}
                  onCallPeer={callPeer}
                  onToggleMic={toggleMic}
                  onToggleCam={toggleCam}
                  onEndCall={endCall}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

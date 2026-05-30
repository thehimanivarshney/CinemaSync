import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatMessage, SyncEvent, RoomUser } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT FOR BEGINNERS:
//   In production replace this URL with your deployed backend URL, e.g.:
//   'https://your-app-name.onrender.com'
//   For local development: 'http://localhost:3001'
// ─────────────────────────────────────────────────────────────────────────────
const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string) || 'http://localhost:3001';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  connectedUsers: RoomUser[];
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  sendSync: (event: SyncEvent) => void;
  joinRoom: (roomId: string, userName: string, peerId: string) => void;
  onSyncEvent: (cb: (event: SyncEvent) => void) => void;
  offSyncEvent: () => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const syncCallbackRef = useRef<((event: SyncEvent) => void) | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<RoomUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('room:users', (users: RoomUser[]) => {
      setConnectedUsers(users);
    });

    socket.on('chat:message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('video:sync', (event: SyncEvent) => {
      if (syncCallbackRef.current) {
        syncCallbackRef.current(event);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = useCallback(
    (roomId: string, userName: string, peerId: string) => {
      socketRef.current?.emit('room:join', { roomId, userName, peerId });
    },
    []
  );

  const sendMessage = useCallback((text: string) => {
    socketRef.current?.emit('chat:message', { text });
  }, []);

  const sendSync = useCallback((event: SyncEvent) => {
    socketRef.current?.emit('video:sync', event);
  }, []);

  const onSyncEvent = useCallback((cb: (event: SyncEvent) => void) => {
    syncCallbackRef.current = cb;
  }, []);

  const offSyncEvent = useCallback(() => {
    syncCallbackRef.current = null;
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    connectedUsers,
    messages,
    sendMessage,
    sendSync,
    joinRoom,
    onSyncEvent,
    offSyncEvent,
  };
}

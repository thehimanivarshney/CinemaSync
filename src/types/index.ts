export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface SyncEvent {
  type: 'play' | 'pause' | 'seek';
  currentTime: number;
  timestamp: number;
}

export interface RoomUser {
  id: string;
  name: string;
  peerId?: string;
}

export interface RoomState {
  roomId: string;
  users: RoomUser[];
  isPlaying: boolean;
  currentTime: number;
}

export type AppPage = 'home' | 'room';

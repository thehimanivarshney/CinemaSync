import { useState } from 'react';
import HomePage from './components/HomePage';
import RoomPage from './components/RoomPage';
import { AppPage } from './types';

interface RoomInfo {
  roomId: string;
  userName: string;
}

export default function App() {
  const [page, setPage] = useState<AppPage>('home');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);

  const handleJoinRoom = (roomId: string, userName: string) => {
    setRoomInfo({ roomId, userName });
    setPage('room');
  };

  const handleLeaveRoom = () => {
    setRoomInfo(null);
    setPage('home');
  };

  if (page === 'room' && roomInfo) {
    return (
      <RoomPage
        roomId={roomInfo.roomId}
        myName={roomInfo.userName}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return <HomePage onJoinRoom={handleJoinRoom} />;
}

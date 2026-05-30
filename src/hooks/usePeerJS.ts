import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { MediaConnection } from 'peerjs';

interface UsePeerJSReturn {
  myPeerId: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callStatus: 'idle' | 'calling' | 'connected' | 'error';
  isMicMuted: boolean;
  isCamOff: boolean;
  initPeer: () => Promise<string>;
  callPeer: (remotePeerId: string) => void;
  toggleMic: () => void;
  toggleCam: () => void;
  endCall: () => void;
}

export function usePeerJS(): UsePeerJSReturn {
  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentCallRef = useRef<MediaConnection | null>(null);

  const [myPeerId, setMyPeerId] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<
    'idle' | 'calling' | 'connected' | 'error'
  >('idle');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      currentCallRef.current?.close();
      peerRef.current?.destroy();
    };
  }, []);

  const getLocalMedia = useCallback(async (): Promise<MediaStream> => {
    if (localStreamRef.current) return localStreamRef.current;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240, facingMode: 'user' },
      audio: true,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const handleCall = useCallback((call: MediaConnection) => {
    currentCallRef.current = call;
    setCallStatus('calling');

    call.on('stream', (stream) => {
      setRemoteStream(stream);
      setCallStatus('connected');
    });

    call.on('close', () => {
      setRemoteStream(null);
      setCallStatus('idle');
      currentCallRef.current = null;
    });

    call.on('error', () => {
      setCallStatus('error');
    });
  }, []);

  const initPeer = useCallback(async (): Promise<string> => {
    // Get media first
    await getLocalMedia();

    return new Promise((resolve, reject) => {
      // Use the public PeerJS cloud server (free, no self-hosting needed)
      const peer = new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
              urls: 'turn:openrelay.metered.ca:80',
              username: 'openrelayproject',
              credential: 'openrelayproject',
            },
          ],
        },
      });

      peerRef.current = peer;

      peer.on('open', (id) => {
        setMyPeerId(id);
        resolve(id);
      });

      peer.on('call', async (call) => {
        const stream = await getLocalMedia();
        call.answer(stream);
        handleCall(call);
      });

      peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        setCallStatus('error');
        reject(err);
      });
    });
  }, [getLocalMedia, handleCall]);

  const callPeer = useCallback(
    async (remotePeerId: string) => {
      if (!peerRef.current || !remotePeerId) return;
      const stream = await getLocalMedia();
      const call = peerRef.current.call(remotePeerId, stream);
      handleCall(call);
    },
    [getLocalMedia, handleCall]
  );

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsMicMuted((prev) => !prev);
  }, []);

  const toggleCam = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setIsCamOff((prev) => !prev);
  }, []);

  const endCall = useCallback(() => {
    currentCallRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('idle');
    peerRef.current?.destroy();
    peerRef.current = null;
    setMyPeerId('');
  }, []);

  return {
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
  };
}

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { SyncEvent } from '../types';

export interface VideoPlayerHandle {
  applySync: (event: SyncEvent) => void;
}

interface VideoPlayerProps {
  onSyncEvent: (event: SyncEvent) => void;
  partnerName: string;
}

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ onSyncEvent, partnerName }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [urlInput, setUrlInput] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [sourceMode, setSourceMode] = useState<'file' | 'url' | null>(null);
    const [urlError, setUrlError] = useState('');
    const [buffered, setBuffered] = useState(0);

    const isSyncingRef = useRef(false); // prevent sync echo
    const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const localFileUrlRef = useRef<string | null>(null);

    // Expose applySync to parent
    useImperativeHandle(ref, () => ({
      applySync(event: SyncEvent) {
        const video = videoRef.current;
        if (!video) return;

        isSyncingRef.current = true;

        // Seek first, then play/pause
        if (Math.abs(video.currentTime - event.currentTime) > 1.5) {
          video.currentTime = event.currentTime;
        }

        if (event.type === 'seek') {
          video.currentTime = event.currentTime;
        } else if (event.type === 'play') {
          video.currentTime = event.currentTime;
          video.play().catch(() => {});
        } else if (event.type === 'pause') {
          video.currentTime = event.currentTime;
          video.pause();
        }

        setTimeout(() => {
          isSyncingRef.current = false;
        }, 500);
      },
    }));

    const resetControlsTimer = useCallback(() => {
      setShowControls(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    }, [isPlaying]);

    // Video event listeners
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handlePlay = () => {
        setIsPlaying(true);
        if (!isSyncingRef.current) {
          onSyncEvent({ type: 'play', currentTime: video.currentTime, timestamp: Date.now() });
        }
      };
      const handlePause = () => {
        setIsPlaying(false);
        if (!isSyncingRef.current) {
          onSyncEvent({ type: 'pause', currentTime: video.currentTime, timestamp: Date.now() });
        }
      };
      const handleSeeked = () => {
        if (!isSyncingRef.current) {
          onSyncEvent({ type: 'seek', currentTime: video.currentTime, timestamp: Date.now() });
        }
      };
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
        // Update buffered
        if (video.buffered.length > 0) {
          setBuffered(video.buffered.end(video.buffered.length - 1));
        }
      };
      const handleDurationChange = () => setDuration(video.duration);

      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('durationchange', handleDurationChange);

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('durationchange', handleDurationChange);
      };
    }, [onSyncEvent]);

    // Fullscreen change listener
    useEffect(() => {
      const handleFSChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFSChange);
      return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    // Cleanup local file URL on unmount
    useEffect(() => {
      return () => {
        if (localFileUrlRef.current) {
          URL.revokeObjectURL(localFileUrlRef.current);
        }
      };
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (localFileUrlRef.current) URL.revokeObjectURL(localFileUrlRef.current);
      const url = URL.createObjectURL(file);
      localFileUrlRef.current = url;
      setVideoSrc(url);
      setSourceMode(null);
    };

    const handleUrlLoad = () => {
      if (!urlInput.trim()) return;
      setUrlError('');
      setVideoSrc(urlInput.trim());
      setSourceMode(null);
    };

    const togglePlay = () => {
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Number(e.target.value);
    };

    const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      setVolume(v);
      if (videoRef.current) {
        videoRef.current.volume = v;
        videoRef.current.muted = v === 0;
      }
      setIsMuted(v === 0);
    };

    const toggleMute = () => {
      const video = videoRef.current;
      if (!video) return;
      video.muted = !video.muted;
      setIsMuted(video.muted);
    };

    const toggleFullscreen = () => {
      const container = videoRef.current?.parentElement?.parentElement;
      if (!container) return;
      if (!document.fullscreenElement) container.requestFullscreen();
      else document.exitFullscreen();
    };

    const formatTime = (t: number) => {
      if (!isFinite(t)) return '0:00';
      const h = Math.floor(t / 3600);
      const m = Math.floor((t % 3600) / 60);
      const s = Math.floor(t % 60);
      if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

    return (
      <div className="flex flex-col h-full">
        {/* Video Container */}
        <div
          className="relative bg-black flex-1 flex items-center justify-center group rounded-xl overflow-hidden"
          onMouseMove={resetControlsTimer}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          {!videoSrc ? (
            /* Source Picker Overlay */
            <div className="flex flex-col items-center gap-6 p-8 text-center">
              <div className="text-7xl opacity-40">🎬</div>
              <div>
                <h3 className="text-white text-xl font-semibold mb-1">No Video Selected</h3>
                <p className="text-white/40 text-sm">
                  Both you and {partnerName || 'your partner'} need to select the same video
                </p>
              </div>

              {sourceMode === null && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setSourceMode('file')}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-all hover:scale-105"
                  >
                    📁 Local File
                  </button>
                  <button
                    onClick={() => setSourceMode('url')}
                    className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-medium transition-all hover:scale-105"
                  >
                    🌐 Direct URL
                  </button>
                </div>
              )}

              {sourceMode === 'file' && (
                <div className="flex flex-col items-center gap-3">
                  <label className="cursor-pointer px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-all hover:scale-105">
                    📁 Choose Video File (MP4, MKV, WebM)
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/x-matroska,.mkv,.mp4,.webm"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </label>
                  <p className="text-white/30 text-xs max-w-xs">
                    ⚠️ MKV files may not work in all browsers. MP4 is recommended.
                  </p>
                  <button onClick={() => setSourceMode(null)} className="text-white/40 hover:text-white text-sm underline">← Back</button>
                </div>
              )}

              {sourceMode === 'url' && (
                <div className="flex flex-col items-center gap-3 w-full max-w-md">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => { setUrlInput(e.target.value); setUrlError(''); }}
                    placeholder="https://example.com/video.mp4"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm"
                  />
                  {urlError && <p className="text-rose-400 text-xs">{urlError}</p>}
                  <button
                    onClick={handleUrlLoad}
                    className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-medium transition-all hover:scale-105"
                  >
                    ▶ Load Video
                  </button>
                  <p className="text-white/30 text-xs max-w-xs text-center">
                    Must be a direct video URL (CORS must be allowed). Works best with self-hosted files.
                  </p>
                  <button onClick={() => setSourceMode(null)} className="text-white/40 hover:text-white text-sm underline">← Back</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={videoSrc}
                className="max-h-full max-w-full w-full h-full object-contain"
                onClick={togglePlay}
              />

              {/* Big play/pause flash */}
              {!isPlaying && videoSrc && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pt-8 pb-3 transition-opacity duration-300 ${
                  showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {/* Progress bar */}
                <div className="relative mb-3 group/seek cursor-pointer h-1.5 hover:h-3 transition-all rounded-full bg-white/20 overflow-hidden">
                  {/* Buffered */}
                  <div
                    className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
                    style={{ width: `${bufferedPercent}%` }}
                  />
                  {/* Progress */}
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  {/* Left controls */}
                  <div className="flex items-center gap-2">
                    <button onClick={togglePlay} className="text-white hover:text-rose-300 transition-colors p-1">
                      {isPlaying ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>

                    {/* Volume */}
                    <div className="flex items-center gap-1 group/vol">
                      <button onClick={toggleMute} className="text-white hover:text-rose-300 transition-colors p-1">
                        {isMuted || volume === 0 ? (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017.73 18l2 2L21 18.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={handleVolume}
                        className="w-16 accent-rose-400 cursor-pointer opacity-0 group-hover/vol:opacity-100 transition-opacity"
                      />
                    </div>

                    <span className="text-white/70 text-xs font-mono whitespace-nowrap">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Right controls */}
                  <div className="flex items-center gap-2">
                    <label className="text-white/60 hover:text-white transition-colors cursor-pointer text-xs px-2 py-1 bg-white/10 rounded-lg">
                      📁 Change
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/x-matroska,.mkv,.mp4,.webm"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                    <button onClick={toggleFullscreen} className="text-white/60 hover:text-white transition-colors p-1">
                      {isFullscreen ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;

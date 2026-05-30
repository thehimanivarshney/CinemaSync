import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  myName: string;
  roomId: string;
}

export default function ChatPanel({ messages, onSend, myName, roomId }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-[#12082a]/80 backdrop-blur-sm">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/10">
        <h2 className="text-white font-semibold text-sm flex items-center gap-2">
          💬 Chat
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 font-mono text-xs text-purple-300 tracking-widest overflow-hidden text-ellipsis whitespace-nowrap">
            Room: {roomId}
          </div>
          <button
            onClick={copyRoomId}
            className="px-3 py-1.5 bg-purple-700/50 hover:bg-purple-600/60 text-white text-xs rounded-lg transition-all whitespace-nowrap"
          >
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="text-center text-white/25 text-sm mt-8">
            <div className="text-3xl mb-2">💌</div>
            No messages yet...
            <br />
            Say hello to your partner!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderName === myName;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-purple-300/70 text-xs mb-1 ml-1">
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                    isMe
                      ? 'bg-gradient-to-br from-rose-600 to-pink-700 text-white rounded-tr-sm'
                      : 'bg-white/10 text-white/90 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-white/25 text-[10px] mt-1 mx-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-white/10">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... 💕"
            rows={1}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm resize-none max-h-24"
            style={{ lineHeight: '1.4' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2.5 bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all hover:scale-105 active:scale-95 flex-shrink-0"
          >
            <svg className="w-5 h-5 rotate-45" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="text-white/20 text-xs mt-1.5 text-center">Enter to send</p>
      </div>
    </div>
  );
}

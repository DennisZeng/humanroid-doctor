import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
  onPlayAudio: (id: string, text: string) => void;
  isPlaying: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onPlayAudio, isPlaying }) => {
  const isBot = message.role === Role.MODEL;

  return (
    <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[85%] md:max-w-[70%] p-4 rounded-2xl backdrop-blur-md border border-opacity-20 shadow-lg relative
        ${isBot 
            ? 'bg-slate-800/60 border-med-blue/30 text-gray-100 rounded-tl-none' 
            : 'bg-med-blue/20 border-med-blue/50 text-white rounded-tr-none'
        }`}
      >
        {/* Attachment Display */}
        {message.attachment && (
            <div className="mb-3 rounded-lg overflow-hidden border border-slate-600">
                <img src={`data:image/jpeg;base64,${message.attachment}`} alt="Symptom" className="max-w-full h-auto max-h-48 object-cover" />
            </div>
        )}

        {/* Text Content */}
        <div className="prose prose-invert prose-sm font-sans leading-relaxed">
          <ReactMarkdown>{message.text}</ReactMarkdown>
        </div>

        {/* Footer Metadata */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
            <span className="text-[10px] uppercase tracking-wider opacity-50 font-mono">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            
            {isBot && (
                <button 
                    onClick={() => onPlayAudio(message.id, message.text)}
                    disabled={isPlaying}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors
                        ${isPlaying ? 'text-med-blue animate-pulse' : 'text-slate-400 hover:text-med-blue hover:bg-white/5'}
                    `}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                    {isPlaying ? 'Speaking...' : 'Read Aloud'}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

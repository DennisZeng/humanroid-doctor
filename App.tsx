import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Role } from './types';
import RobotAvatar from './components/RobotAvatar';
import ChatMessage from './components/ChatMessage';
import { sendMessageToGemini, generateSpeech } from './services/geminiService';
import { AudioPlayer } from './services/audioUtils';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: Role.MODEL,
      text: "Greetings. I am Unit-734. I am ready to analyze your symptoms. Please describe your condition or upload a visual scan.",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // base64

  // Audio Player instance
  const audioPlayerRef = useRef<AudioPlayer>(new AudioPlayer());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || isLoading) return;

    const userMsgId = uuidv4();
    const newUserMessage: Message = {
      id: userMsgId,
      role: Role.USER,
      text: inputText,
      timestamp: new Date(),
      attachment: selectedImage || undefined
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(messages, newUserMessage.text, newUserMessage.attachment);
      
      const botMsgId = uuidv4();
      const newBotMessage: Message = {
        id: botMsgId,
        role: Role.MODEL,
        text: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, newBotMessage]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: uuidv4(),
        role: Role.MODEL,
        text: "Critical Error: Connection to medical database interrupted. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = async (id: string, text: string) => {
    // If already playing this ID, stop it (toggle) - simplified to just stop for now if clicked again?
    // Let's assume clicking play on another stops current.
    
    if (audioPlayingId) {
        audioPlayerRef.current.stop();
        if (audioPlayingId === id) {
            setAudioPlayingId(null);
            return;
        }
    }

    setAudioPlayingId(id);
    const base64Audio = await generateSpeech(text);
    
    if (base64Audio) {
      await audioPlayerRef.current.play(base64Audio, () => {
        setAudioPlayingId(null);
      });
    } else {
      setAudioPlayingId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Remove data URL prefix for API
        const base64String = reader.result as string;
        // Store full string for preview, strip for API later if needed (handled in service usually, but simpler to strip here)
        // Actually, for display we need prefix. For API we need raw.
        // Let's keep full string here and strip in service if needed.
        // Wait, logic check: FileReader gives `data:image/jpeg;base64,....`
        // Service expects base64 data only.
        const rawBase64 = base64String.split(',')[1];
        setSelectedImage(rawBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-med-dark overflow-hidden font-sans">
      
      {/* Left Panel: Robot Avatar */}
      <div className="w-full md:w-5/12 lg:w-1/3 h-[40vh] md:h-full border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900 relative">
        <RobotAvatar isProcessing={isLoading} isSpeaking={!!audioPlayingId} />
        
        {/* Disclaimer Overlay at bottom of avatar panel */}
        <div className="absolute bottom-4 left-0 w-full px-6 text-center">
             <p className="text-[10px] text-slate-500 font-mono">
                CAUTION: AI GENERATED ADVICE. NOT A SUBSTITUTE FOR PROFESSIONAL MEDICAL CARE.
                IN EMERGENCIES CALL 911 (OR LOCAL EMERGENCY).
             </p>
        </div>
      </div>

      {/* Right Panel: Chat Interface */}
      <div className="w-full md:w-7/12 lg:w-2/3 h-[60vh] md:h-full flex flex-col bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-med-dark to-black">
        
        {/* Header */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 backdrop-blur-sm">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-med-blue shadow-[0_0_10px_#0ea5e9]"></div>
                <h1 className="text-med-blue font-display tracking-wider text-lg">MEDICAL DIAGNOSTIC INTERFACE</h1>
            </div>
            <div className="text-slate-500 text-xs font-mono">
                SECURE CONNECTION ESTABLISHED
            </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
                <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    onPlayAudio={handlePlayAudio}
                    isPlaying={audioPlayingId === msg.id}
                />
            ))}
            {isLoading && (
                <div className="flex justify-start animate-pulse">
                    <div className="bg-slate-800/50 p-3 rounded-lg text-med-blue text-xs font-mono">
                        PROCESSING DATA...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-slate-900/50 backdrop-blur-md">
            {/* Image Preview */}
            {selectedImage && (
                <div className="mb-2 relative inline-block">
                    <img src={`data:image/jpeg;base64,${selectedImage}`} alt="Preview" className="h-20 rounded border border-med-blue/50" />
                    <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="flex gap-2 items-end">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-med-blue border border-med-blue/30 rounded-lg hover:bg-med-blue/10 transition-colors h-[50px] w-[50px] flex items-center justify-center"
                    title="Upload Scan"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                />

                <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder="Describe symptoms..."
                    className="flex-1 bg-slate-800/50 text-white border border-slate-700 rounded-lg p-3 h-[50px] max-h-[120px] focus:outline-none focus:border-med-blue focus:ring-1 focus:ring-med-blue resize-none font-mono text-sm"
                />

                <button 
                    onClick={handleSendMessage}
                    disabled={isLoading || (!inputText.trim() && !selectedImage)}
                    className="bg-med-blue hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg h-[50px] w-[50px] flex items-center justify-center transition-all shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    )}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;

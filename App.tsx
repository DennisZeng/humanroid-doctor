import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, Role, DataType } from './types';
import RobotAvatar from './components/RobotAvatar';
import ChatMessage from './components/ChatMessage';
import DataInputModal from './components/DataInputModal';
import { sendMessageToGemini, generateSpeech } from './services/geminiService';
import { AudioPlayer } from './services/audioUtils';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: Role.MODEL,
      text: "Greetings. I am Unit-734. I am ready to analyze your symptoms. Please describe your condition, upload a visual scan, or import medical test data.",
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<DataType | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // base64

  // Audio Player instance
  const audioPlayerRef = useRef<AudioPlayer>(new AudioPlayer());

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processMessage = async (userText: string, image?: string) => {
    setIsLoading(true);
    try {
      const responseText = await sendMessageToGemini(messages, userText, image);
      
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
    const textToSend = inputText;
    const imageToSend = selectedImage || undefined;
    
    setInputText('');
    setSelectedImage(null);

    await processMessage(textToSend, imageToSend);
  };

  const handleDataSubmit = async (type: DataType, value: string) => {
    setActiveModal(null);
    const text = `**IMPORTED ${type.toUpperCase()} DATA:**\n${value}`;
    
    const userMsgId = uuidv4();
    const newUserMessage: Message = {
      id: userMsgId,
      role: Role.USER,
      text: text,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    await processMessage(text);
  };

  const handleGeneratePrescription = async () => {
    const text = "SYSTEM COMMAND: Please generate a formal 'Medical Prescription' based on all provided data and our consultation. Format it as a professional medical document with diagnosis and medication details.";
    
    const userMsgId = uuidv4();
    const newUserMessage: Message = {
      id: userMsgId,
      role: Role.USER,
      text: "🖨️ *Requesting Medical Prescription...*",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    await processMessage(text);
  };

  const handlePlayAudio = async (id: string, text: string) => {
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

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => {
             const needsSpace = prev.length > 0 && !prev.endsWith(' ');
             return prev + (needsSpace ? ' ' : '') + transcript;
        });
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const rawBase64 = base64String.split(',')[1];
        setSelectedImage(rawBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-med-dark overflow-hidden font-sans">
      <DataInputModal 
        type={activeModal} 
        onClose={() => setActiveModal(null)} 
        onSubmit={handleDataSubmit}
      />

      {/* Left Panel: Robot Avatar */}
      <div className="w-full md:w-5/12 lg:w-1/3 h-[35vh] md:h-full border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900 relative">
        <RobotAvatar isProcessing={isLoading} isSpeaking={!!audioPlayingId} />
        
        {/* Disclaimer Overlay at bottom of avatar panel */}
        <div className="absolute bottom-4 left-0 w-full px-6 text-center z-20">
             <p className="text-[10px] text-slate-500 font-mono leading-tight">
                All data entered and imported will be saved to google cloud and used for training google model nothing else.
             </p>
        </div>
      </div>

      {/* Right Panel: Chat Interface */}
      <div className="w-full md:w-7/12 lg:w-2/3 h-[65vh] md:h-full flex flex-col bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-med-dark to-black">
        
        {/* Header */}
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-med-blue shadow-[0_0_10px_#0ea5e9]"></div>
                <h1 className="text-med-blue font-display tracking-wider text-lg hidden sm:block">MEDICAL DIAGNOSTIC INTERFACE</h1>
                <h1 className="text-med-blue font-display tracking-wider text-lg sm:hidden">M.D.I.</h1>
            </div>
            
            <div className="flex items-center gap-3">
                 <button 
                    onClick={handleGeneratePrescription}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-med-blue/10 border border-med-blue/30 text-med-blue text-xs font-mono hover:bg-med-blue/20 transition-all"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    PRINT PRESCRIPTION
                 </button>
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
        <div className="p-4 border-t border-white/5 bg-slate-900/50 backdrop-blur-md shrink-0">
            
            {/* Medical Tools Toolbar */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono hover:border-med-blue hover:text-white transition-all whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    Picture
                </button>
                <button onClick={() => setActiveModal(DataType.BLOOD)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono hover:border-red-500 hover:text-white transition-all whitespace-nowrap">
                    🩸 Blood Test
                </button>
                <button onClick={() => setActiveModal(DataType.URINE)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono hover:border-yellow-500 hover:text-white transition-all whitespace-nowrap">
                    💧 Urine Test
                </button>
                <button onClick={() => setActiveModal(DataType.PULSE)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono hover:border-pink-500 hover:text-white transition-all whitespace-nowrap">
                    ❤️ Pulse
                </button>
                <button onClick={() => setActiveModal(DataType.STOOL)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono hover:border-amber-700 hover:text-white transition-all whitespace-nowrap">
                    💩 Stool Test
                </button>
            </div>

            {/* Image Preview */}
            {selectedImage && (
                <div className="mb-2 relative inline-block animate-in fade-in slide-in-from-bottom-2">
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
                    placeholder="Describe symptoms or ask questions..."
                    className="flex-1 bg-slate-800/50 text-white border border-slate-700 rounded-lg p-3 h-[50px] max-h-[120px] focus:outline-none focus:border-med-blue focus:ring-1 focus:ring-med-blue resize-none font-mono text-sm placeholder:text-slate-600"
                />

                <button 
                    onClick={toggleListening}
                    title="Toggle Microphone"
                    className={`p-3 rounded-lg h-[50px] w-[50px] flex items-center justify-center transition-all border border-slate-700 shadow-[0_0_10px_rgba(0,0,0,0.3)]
                        ${isListening 
                            ? 'bg-red-500/20 text-red-500 border-red-500 animate-pulse' 
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }
                    `}
                >
                    {isListening ? (
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                    )}
                </button>

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
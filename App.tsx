import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Role, DataType, PatientInfo } from './types';
import RobotAvatar from './components/RobotAvatar';
import ChatMessage from './components/ChatMessage';
import DataInputModal from './components/DataInputModal';
import HomePage from './components/HomePage';
import { sendMessageToGemini, generateSpeech } from './services/geminiService';
import { AudioPlayer } from './services/audioUtils';

const TRANSLATIONS = {
  title: "医疗诊断界面",
  printPrescription: "打印处方",
  picture: "图片",
  bloodTest: "验血",
  urineTest: "验尿",
  pulse: "脉搏",
  stoolTest: "粪便检查",
  placeholder: "请描述您的症状或提出疑问...",
  disclaimer: "所有输入和导入的数据将保存到 Google Cloud 并仅用于训练 Google 模型，不作他用。",
  speaking: "播放中...",
  readAloud: "语音播报",
  processing: "系统处理中...",
  systemCommand: "系统指令：请根据所有提供的资料和我们的问诊生成一份正式的'医疗处方'。请将其格式化为包含诊断和用药详情的专业医疗文件。",
  printRequest: "🖨️ 正在请求医疗处方...",
  initialGreeting: "您好。我是康斯坦丁-皮特森医生。我已准备好分析您的症状。请描述您的情况，上传视觉扫描图，或导入医疗测试数据。",
  error: "严重错误：与医疗数据库的连接中断。请重试。",
  imported: "已导入",
  data: "数据",
  endSession: "结束会诊",
};

const App = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const t = TRANSLATIONS;

  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      role: Role.MODEL,
      text: t.initialGreeting,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlayingId, setAudioPlayingId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<DataType | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const audioPlayerRef = useRef(new AudioPlayer());
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 当会诊开始时，发送一个隐藏的上下文消息或在第一次对话中包含它
  const handleStart = (info: PatientInfo) => {
    setPatientInfo(info);
    setHasStarted(true);
    
    // 自定义欢迎语
    const welcomeText = `您好，${info.name}${info.gender === '男' ? '先生' : info.gender === '女' ? '女士' : ''}。我是康斯坦丁-皮特森医生。我已经收到了您的基本档案（${info.age}岁，联系电话：${info.phone}）。请描述您目前的身体状况，或提供相关检查报告。`;
    
    setMessages([{
      id: 'init-1',
      role: Role.MODEL,
      text: welcomeText,
      timestamp: new Date(),
    }]);
  };

  const processMessage = async (userText: string, image?: string) => {
    setIsLoading(true);
    try {
      // 传递 patientInfo 给服务层
      const responseText = await sendMessageToGemini(messages, userText, 'zh', image, patientInfo);
      
      const botMsgId = uuidv4();
      const newBotMessage = {
        id: botMsgId,
        role: Role.MODEL,
        text: responseText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, newBotMessage]);
    } catch (error) {
      console.error(error);
      const errorMsg = {
        id: uuidv4(),
        role: Role.MODEL,
        text: t.error,
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
    const newUserMessage = {
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
    const typeLabel = getTranslationKeyForType(type);
    const text = `**${t.imported} ${typeLabel} ${t.data}:**\n${value}`;
    
    const userMsgId = uuidv4();
    const newUserMessage = {
      id: userMsgId,
      role: Role.USER,
      text: text,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    await processMessage(text);
  };

  const getTranslationKeyForType = (type: DataType) => {
    switch (type) {
      case DataType.BLOOD: return t.bloodTest;
      case DataType.URINE: return t.urineTest;
      case DataType.PULSE: return t.pulse;
      case DataType.STOOL: return t.stoolTest;
      default: return t.data;
    }
  };

  const handleGeneratePrescription = async () => {
    const text = t.systemCommand;
    
    const userMsgId = uuidv4();
    const newUserMessage = {
      id: userMsgId,
      role: Role.USER,
      text: t.printRequest,
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
      recognition.lang = 'zh-CN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => prev + transcript);
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
      alert("您的浏览器不支持语音识别。请使用 Chrome 或 Edge。");
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

  const handleEndSession = () => {
    if (audioPlayingId) {
        audioPlayerRef.current.stop();
        setAudioPlayingId(null);
    }
    if (isListening) {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    }
    setHasStarted(false);
    setPatientInfo(null);
  };

  if (!hasStarted) {
    return <HomePage onStart={handleStart} />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-med-dark overflow-hidden font-sans animate-[fadeIn_0.5s_ease-out]">
      <DataInputModal 
        type={activeModal} 
        onClose={() => setActiveModal(null)} 
        onSubmit={handleDataSubmit}
      />

      <div className="w-full md:w-5/12 lg:w-1/3 h-[35vh] md:h-full border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900 relative">
        <RobotAvatar isProcessing={isLoading} isSpeaking={!!audioPlayingId} />
        
        {/* 显示当前患者姓名 */}
        <div className="absolute top-4 left-0 w-full px-6 flex justify-between items-center z-20 pointer-events-none opacity-40">
             <div className="bg-med-blue/20 px-3 py-1 rounded-full border border-med-blue/30 text-[10px] text-med-blue font-mono uppercase tracking-widest">
                当前患者: {patientInfo?.name}
             </div>
             <div className="bg-med-blue/20 px-3 py-1 rounded-full border border-med-blue/30 text-[10px] text-med-blue font-mono uppercase tracking-widest">
                ID: {patientInfo?.phone.slice(-4)}
             </div>
        </div>

        <div className="absolute bottom-4 left-0 w-full px-6 text-center z-20">
             <p className="text-[10px] text-slate-500 font-mono leading-tight">
                {t.disclaimer}
             </p>
        </div>
      </div>

      <div className="w-full md:w-7/12 lg:w-2/3 h-[65vh] md:h-full flex flex-col bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-med-dark to-black">
        
        <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-med-blue shadow-[0_0_10px_#0ea5e9]"></div>
                <h1 className="text-med-blue font-display tracking-wider text-lg hidden sm:block">{t.title}</h1>
                <h1 className="text-med-blue font-display tracking-wider text-lg sm:hidden">系统终端</h1>
            </div>
            
            <div className="flex items-center gap-3">
                 <button 
                    onClick={handleGeneratePrescription}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded bg-med-blue/10 border border-med-blue/30 text-med-blue text-xs font-mono hover:bg-med-blue/20 transition-all"
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    {t.printPrescription}
                 </button>

                 <button 
                    onClick={handleEndSession}
                    className="flex items-center justify-center p-2 rounded-full text-slate-500 hover:bg-red-900/20 hover:text-red-400 transition-all"
                    title={t.endSession}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                 </button>
            </div>
        </div>

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
                <div className="flex justify-start">
                    <div className="bg-slate-800/50 p-3 rounded-lg text-med-blue text-xs font-mono animate-pulse">
                        {t.processing}
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/5 bg-slate-900/50 backdrop-blur-md shrink-0">
            <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono hover:border-med-blue hover:text-white transition-all whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    {t.picture}
                </button>
                <button onClick={() => setActiveModal(DataType.BLOOD)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono hover:border-red-500 hover:text-white transition-all whitespace-nowrap">
                    🩸 {t.bloodTest}
                </button>
                <button onClick={() => setActiveModal(DataType.URINE)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono hover:border-yellow-500 hover:text-white transition-all whitespace-nowrap">
                    💧 {t.urineTest}
                </button>
                <button onClick={() => setActiveModal(DataType.PULSE)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono hover:border-pink-500 hover:text-white transition-all whitespace-nowrap">
                    ❤️ {t.pulse}
                </button>
                <button onClick={() => setActiveModal(DataType.STOOL)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono hover:border-amber-700 hover:text-white transition-all whitespace-nowrap">
                    💩 {t.stoolTest}
                </button>
            </div>

            {selectedImage && (
                <div className="mb-2 relative inline-block animate-in fade-in zoom-in duration-300">
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
                    placeholder={t.placeholder}
                    className="flex-1 bg-slate-800/50 text-white border border-slate-700 rounded-lg p-3 h-[50px] max-h-[120px] focus:outline-none focus:border-med-blue focus:ring-1 focus:ring-med-blue resize-none font-mono text-sm placeholder:text-slate-600"
                />

                <button 
                    onClick={toggleListening}
                    title="切换语音输入"
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
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
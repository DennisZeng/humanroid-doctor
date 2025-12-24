import React, { useEffect, useState } from 'react';
import RobotAvatar from './RobotAvatar';
import { PatientInfo } from '../types';

interface HomePageProps {
  onStart: (info: PatientInfo) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStart }) => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  
  // 患者信息状态
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    age: '',
    gender: '',
    phone: ''
  });

  const isFormValid = patientInfo.name && patientInfo.age && patientInfo.gender && patientInfo.phone;

  useEffect(() => {
    const checkKey = async () => {
      if (process.env.API_KEY) {
        setHasApiKey(true);
        setCheckingKey(false);
        return;
      }

      try {
        if ((window as any).aistudio && await (window as any).aistudio.hasSelectedApiKey()) {
          setHasApiKey(true);
        }
      } catch (e) {
        console.error("Error checking API key", e);
      } finally {
        setCheckingKey(false);
      }
    };
    checkKey();
  }, []);

  const handleConnectApiKey = async () => {
    if ((window as any).aistudio) {
      try {
        await (window as any).aistudio.openSelectKey();
        setHasApiKey(true);
      } catch (e) {
        console.error("Error selecting API key", e);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPatientInfo(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="h-screen w-full bg-med-dark flex flex-col items-center justify-center relative overflow-hidden text-white font-sans p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-med-dark to-black z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0 animate-pulse"></div>

      <div className="z-10 flex flex-col items-center justify-center w-full max-w-4xl animate-[fadeIn_1s_ease-out] overflow-y-auto max-h-screen py-8">
        
        <div className="w-full max-w-[320px] aspect-square flex items-center justify-center mb-[-20px] shrink-0">
             <RobotAvatar isProcessing={false} isSpeaking={false} />
        </div>

        <div className="text-center space-y-6 z-20 w-full max-w-md">
            <p className="font-mono text-med-blue text-sm md:text-base tracking-[0.3em] uppercase opacity-80">
                先进医疗诊断系统单元
            </p>

            {/* 患者信息登记表单 */}
            <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-4 shadow-2xl">
                <h3 className="text-slate-300 font-display text-xs tracking-widest uppercase border-b border-white/5 pb-2">患者基本信息登记</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 text-left">
                        <label className="text-[10px] text-med-blue font-mono uppercase ml-1">姓名</label>
                        <input 
                            type="text" 
                            name="name"
                            value={patientInfo.name}
                            onChange={handleInputChange}
                            placeholder="请输入姓名" 
                            className="w-full bg-black/40 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-med-blue focus:outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                    <div className="space-y-1 text-left">
                        <label className="text-[10px] text-med-blue font-mono uppercase ml-1">年龄</label>
                        <input 
                            type="number" 
                            name="age"
                            value={patientInfo.age}
                            onChange={handleInputChange}
                            placeholder="请输入年龄" 
                            className="w-full bg-black/40 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-med-blue focus:outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1 text-left">
                        <label className="text-[10px] text-med-blue font-mono uppercase ml-1">性别</label>
                        <select 
                            name="gender"
                            value={patientInfo.gender}
                            onChange={handleInputChange}
                            className="w-full bg-black/40 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-med-blue focus:outline-none transition-all text-slate-300"
                        >
                            <option value="" disabled>选择性别</option>
                            <option value="男">男</option>
                            <option value="女">女</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>
                    <div className="space-y-1 text-left">
                        <label className="text-[10px] text-med-blue font-mono uppercase ml-1">电话</label>
                        <input 
                            type="tel" 
                            name="phone"
                            value={patientInfo.phone}
                            onChange={handleInputChange}
                            placeholder="联系电话" 
                            className="w-full bg-black/40 border border-slate-700 rounded-lg p-2.5 text-sm focus:border-med-blue focus:outline-none transition-all placeholder:text-slate-600"
                        />
                    </div>
                </div>
            </div>

            {!checkingKey && (
              <div className="pt-2">
                {hasApiKey ? (
                  <button 
                      onClick={() => isFormValid && onStart(patientInfo)}
                      disabled={!isFormValid}
                      className={`group relative w-full py-4 overflow-hidden rounded-lg border transition-all duration-300 shadow-2xl
                        ${isFormValid 
                            ? 'bg-slate-900 border-med-blue/50 hover:border-med-blue shadow-[0_0_20px_rgba(14,165,233,0.2)]' 
                            : 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'}
                      `}
                  >
                      {isFormValid && <div className="absolute inset-0 w-1 bg-med-blue/50 transition-all duration-300 ease-out group-hover:w-full opacity-10"></div>}
                      <span className={`relative font-display tracking-widest text-lg flex items-center justify-center gap-3 ${isFormValid ? 'text-white group-hover:text-med-blue' : 'text-slate-600'}`}>
                          初始化医疗会诊
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${isFormValid ? 'opacity-100' : 'opacity-20'}`}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                      </span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <button 
                        onClick={handleConnectApiKey}
                        className="group relative w-full py-4 bg-amber-900/30 overflow-hidden rounded-lg border border-amber-500/50 hover:border-amber-500 transition-all duration-300"
                    >
                        <span className="relative font-display tracking-widest text-lg text-amber-500 group-hover:text-amber-400 transition-colors flex items-center justify-center gap-3">
                            连接 API 密钥
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                        </span>
                    </button>
                    <p className="text-xs text-slate-500">
                      系统检测到未配置 API 密钥。
                      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-med-blue hover:underline ml-1">
                        获取帮助
                      </a>
                    </p>
                  </div>
                )}
              </div>
            )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2 opacity-30 shrink-0">
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-med-blue to-transparent"></div>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                Secure Patient Portal • Encryption Active
            </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
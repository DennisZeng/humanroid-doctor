import React, { useEffect, useState } from 'react';
import RobotAvatar from './RobotAvatar';

interface HomePageProps {
  onStart: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onStart }) => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);

  useEffect(() => {
    const checkKey = async () => {
      // If API_KEY is provided via env/build config (hardcoded), skip check
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
        // Assume success as per instructions and update state immediately to avoid race conditions
        setHasApiKey(true);
      } catch (e) {
        console.error("Error selecting API key", e);
      }
    }
  };

  return (
    <div className="h-screen w-full bg-med-dark flex flex-col items-center justify-center relative overflow-hidden text-white font-sans">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-med-dark to-black z-0"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0 animate-pulse"></div>

      <div className="z-10 flex flex-col items-center justify-center w-full max-w-4xl animate-[fadeIn_1s_ease-out]">
        
        {/* Avatar Container - slightly larger on home screen */}
        <div className="w-full max-w-[500px] aspect-square flex items-center justify-center mb-[-40px]">
             <RobotAvatar isProcessing={false} isSpeaking={false} />
        </div>

        <div className="text-center space-y-6 z-20 mt-8">
            <p className="font-mono text-med-blue text-sm md:text-base tracking-[0.3em] uppercase opacity-80">
                Advanced Medical Diagnostic Unit
            </p>

            {!checkingKey && (
              <>
                {hasApiKey ? (
                  <button 
                      onClick={onStart}
                      className="group relative px-10 py-4 bg-slate-900/50 overflow-hidden rounded-sm border border-med-blue/50 hover:border-med-blue transition-all duration-300 shadow-[0_0_20px_rgba(14,165,233,0.1)] hover:shadow-[0_0_30px_rgba(14,165,233,0.4)]"
                  >
                      <div className="absolute inset-0 w-1 bg-med-blue/50 transition-all duration-300 ease-out group-hover:w-full opacity-20"></div>
                      <span className="relative font-display tracking-widest text-xl text-white group-hover:text-med-blue transition-colors flex items-center gap-3">
                          INITIALIZE CONSULTATION
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                      </span>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <button 
                        onClick={handleConnectApiKey}
                        className="group relative px-10 py-4 bg-amber-900/30 overflow-hidden rounded-sm border border-amber-500/50 hover:border-amber-500 transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.1)] hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                    >
                        <span className="relative font-display tracking-widest text-lg text-amber-500 group-hover:text-amber-400 transition-colors flex items-center gap-3">
                            CONNECT API KEY
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                        </span>
                    </button>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Access to the Neural Medical Grid requires a valid API Key. 
                      <br/>
                      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-med-blue hover:underline mt-2 inline-block">
                        Billing Information
                      </a>
                    </p>
                  </div>
                )}
              </>
            )}
        </div>

        <div className="absolute bottom-8 flex flex-col items-center gap-2 opacity-40">
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-med-blue to-transparent"></div>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest">
                SYSTEM STANDBY • SECURE CONNECTION
            </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
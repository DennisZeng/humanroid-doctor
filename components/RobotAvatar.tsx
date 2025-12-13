import React, { useEffect, useState } from 'react';

interface RobotAvatarProps {
  isProcessing: boolean;
  isSpeaking: boolean;
}

const RobotAvatar: React.FC<RobotAvatarProps> = ({ isProcessing, isSpeaking }) => {
  // Restored to a reliable Humanoid Robot image from Unsplash
  const avatarUrl = "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80";

  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isProcessing || isSpeaking) {
      interval = setInterval(() => {
        setGlowIntensity((prev) => (prev === 1 ? 0.5 : 1));
      }, 800);
    } else {
      setGlowIntensity(0);
    }
    return () => clearInterval(interval);
  }, [isProcessing, isSpeaking]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Background ambience */}
        <div className="absolute inset-0 bg-gradient-to-b from-med-dark to-[#000000] z-0" />
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 z-0"></div>

        {/* Circular Frame / Portal */}
        <div className={`relative z-10 w-64 h-64 md:w-80 md:h-80 rounded-full border-4 transition-all duration-1000 flex items-center justify-center bg-gray-900 shadow-2xl overflow-hidden
            ${isProcessing ? 'border-med-blue shadow-[0_0_50px_rgba(14,165,233,0.5)]' : 'border-slate-700'}
        `}>
             <img 
                src={avatarUrl} 
                alt="Robot Doctor" 
                className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
             />
             
             {/* Scanning Overlay Effect */}
             {isProcessing && (
                 <div className="absolute inset-0 bg-med-blue/20 animate-pulse z-20" />
             )}
             
             {/* Speaking Visualizer Overlay */}
             {isSpeaking && (
               <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1 items-end h-8 z-30">
                 {[1,2,3,4,5].map((i) => (
                   <div 
                      key={i} 
                      className="w-1 bg-med-blue animate-bounce" 
                      style={{ 
                        height: '100%', 
                        animationDuration: `${0.4 + (i * 0.1)}s` 
                      }} 
                    />
                 ))}
               </div>
             )}
        </div>

        {/* Status Text */}
        <div className="z-10 mt-8 text-center">
            <h2 className="font-display text-2xl md:text-3xl text-white tracking-widest uppercase">Dr. Constance Petersen</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
                <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400 animate-ping' : 'bg-green-500'}`} />
                <span className="text-med-blue font-mono text-sm">
                    {isProcessing ? 'ANALYZING BIOMETRICS...' : isSpeaking ? 'VOCALIZING RESPONSE...' : 'SYSTEMS ONLINE'}
                </span>
            </div>
        </div>
    </div>
  );
};

export default RobotAvatar;
import React from 'react';

interface LoadingProps {
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ fullScreen = false }) => {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm' : 'w-full py-12'}`}>
      <div className="relative">
        {/* Outer Ring */}
        <div className="w-12 h-12 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
        
        {/* Inner Glow */}
        <div className="absolute inset-0 w-12 h-12 rounded-full bg-purple-500/10 blur-xl animate-pulse" />
        
        {/* Center Dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
        </div>
      </div>
    </div>
  );
};

export default Loading;

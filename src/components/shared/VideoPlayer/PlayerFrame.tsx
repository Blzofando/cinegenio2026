import React from 'react';

interface PlayerFrameProps {
  playerUrl: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children?: React.ReactNode;
}

const PlayerFrame: React.FC<PlayerFrameProps> = ({ 
  playerUrl, 
  onMouseEnter, 
  onMouseLeave,
  children 
}) => {
  return (
    <div 
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative w-full rounded-2xl overflow-hidden aspect-video bg-black/50">
        {playerUrl ? (
          <iframe
            src={playerUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

export default PlayerFrame;

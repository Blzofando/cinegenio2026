import React from "react";

interface LevelBadgeProps { level?: number; }

const LevelBadge: React.FC<LevelBadgeProps> = ({ level = 1 }) => {
  return (
    <div className="relative inline-flex items-center">
      <div className="badge-dark">
        <span className="badge-emoji">🎖️</span>
        <span className="text-[12px] font-bold">Nível {level}</span>
      </div>
    </div>
  );
};

export default LevelBadge;

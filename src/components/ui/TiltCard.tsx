// src/components/ui/TiltCard.tsx

"use client"; // Precisa ser um client component para responder a eventos do mouse

import React, { useRef } from "react";

interface TiltCardProps {
  className?: string;
  children: React.ReactNode;
}

const TiltCard: React.FC<TiltCardProps> = ({ className = "", children }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const percentX = (e.clientX - rect.left) / rect.width - 0.5;
    const percentY = (e.clientY - rect.top) / rect.height - 0.5;
    
    // Ajuste a intensidade da inclinação mudando o valor '8'
    const rotateX = (-percentY * 8).toFixed(2);
    const rotateY = (percentX * 8).toFixed(2);

    el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`transition-transform duration-300 ease-out will-change-transform preserve-3d ${className}`}
    >
      {children}
    </div>
  );
};

export default TiltCard;
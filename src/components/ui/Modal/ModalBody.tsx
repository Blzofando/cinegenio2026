"use client";

import React from 'react';

export const ModalBody: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = "" }) => {
  return (
    <div className={`p-4 md:p-6 overflow-y-auto max-h-[85vh] custom-scrollbar ${className}`}>
      {children}
    </div>
  );
};

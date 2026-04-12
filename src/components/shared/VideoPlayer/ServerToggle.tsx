'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Globe, Signal, Check, Zap } from 'lucide-react';
import { SERVERS, ServerType } from '@/lib/videoPlayerUtils';
import { Button } from '@/components/ui/Button';

interface ServerToggleProps {
  server: ServerType;
  onSelect: (server: ServerType) => void;
}

const ServerToggle: React.FC<ServerToggleProps> = ({ server, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentServer = SERVERS.find(s => s.id === server);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (id: ServerType) => {
    onSelect(id);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="absolute top-4 left-4 z-10">
      {/* Botão principal */}
      <Button
        variant="purple"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="backdrop-blur-md shadow-lg gap-1.5"
      >
        {currentServer?.region === 'global'
          ? <Globe className="w-3.5 h-3.5" />
          : <Signal className="w-3.5 h-3.5" />
        }
        <span className="hidden sm:inline">{currentServer?.name || 'Servidor'}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-52 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {SERVERS.map((s) => {
            const isActive = s.id === server;
            return (
              <button
                key={s.id}
                onClick={() => handleSelect(s.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm
                  transition-colors
                  ${isActive
                    ? 'bg-purple-500/20 text-white'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                {s.region === 'global'
                  ? <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  : <Signal className="w-4 h-4 text-green-400 flex-shrink-0" />
                }
                <span className="flex-1 flex items-center gap-2 font-medium">
                  {s.name}
                  {s.autoProgress && (
                    <span title="Salva Progresso Automaticamente" className="flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500/50" />
                    </span>
                  )}
                </span>
                {isActive && <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ServerToggle;

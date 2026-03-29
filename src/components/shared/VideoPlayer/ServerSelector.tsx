'use client';

import React from 'react';
import { Globe, Signal, Check, Zap } from 'lucide-react';
import { SERVERS, ServerType, ServerConfig } from '@/lib/videoPlayerUtils';
import { Button } from '@/components/ui/Button';

interface ServerSelectorProps {
  activeServer: ServerType | null;
  onSelect: (server: ServerType) => void;
}

const ServerSelector: React.FC<ServerSelectorProps> = ({ activeServer, onSelect }) => {
  const globalServers = SERVERS.filter(s => s.region === 'global');
  const brServers = SERVERS.filter(s => s.region === 'br');

  const renderCard = (server: ServerConfig) => {
    const isActive = activeServer === server.id;

    return (
      <Button
        key={server.id}
        variant="ghost"
        onClick={() => onSelect(server.id)}
        className={`
          relative flex-col items-center gap-3 p-5 h-auto rounded-xl
          border-2 transition-all duration-300
          ${isActive
            ? 'border-purple-500 bg-purple-500/15 shadow-lg shadow-purple-500/20'
            : 'border-white/10 bg-white/5 hover:border-purple-500/40 hover:bg-white/10'
          }
        `}
      >
        {/* Ícone de seleção */}
        {isActive && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        {/* Badge Auto-Progresso */}
        {server.autoProgress && (
          <div 
            className="absolute top-2 left-2 px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded flex items-center gap-1 text-[9px] font-bold text-yellow-500 uppercase tracking-widest z-10"
            title="Salva seu progresso onde parou"
          >
            <Zap className="w-3 h-3 fill-yellow-500/80" />
            <span className="hidden sm:inline">Auto-Save</span>
          </div>
        )}

        {/* Ícone do servidor */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center
          ${isActive
            ? 'bg-purple-500/30'
            : 'bg-white/10'
          }
          transition-colors duration-300
        `}>
          {server.region === 'global'
            ? <Globe className={`w-6 h-6 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />
            : <Signal className={`w-6 h-6 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} />
          }
        </div>

        {/* Nome */}
        <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
          {server.name}
        </span>

        {/* Badge de região */}
        <span className={`
          text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full
          ${server.region === 'br'
            ? 'bg-green-500/15 text-green-400 border border-green-500/20'
            : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
          }
        `}>
          {server.regionLabel}
        </span>
      </Button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seção Global */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" />
          Servidores Globais
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {globalServers.map(renderCard)}
        </div>
      </div>

      {/* Seção Brasil */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Signal className="w-3.5 h-3.5" />
          Servidores Brasileiros
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {brServers.map(renderCard)}
        </div>
      </div>
    </div>
  );
};

export default ServerSelector;

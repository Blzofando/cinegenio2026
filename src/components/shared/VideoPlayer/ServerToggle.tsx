import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ServerToggleProps {
  server: 'videasy' | 'vidking';
  onToggle: () => void;
}

const ServerToggle: React.FC<ServerToggleProps> = ({ server, onToggle }) => {
  return (
    <Button
      variant="purple"
      onClick={onToggle}
      className="absolute top-4 left-4 backdrop-blur-md shadow-lg z-10"
    >
      <RefreshCw className="w-4 h-4" />
      {server === 'videasy' ? 'Trocar p/ Vidking' : 'Trocar p/ Videasy'}
    </Button>
  );
};

export default ServerToggle;

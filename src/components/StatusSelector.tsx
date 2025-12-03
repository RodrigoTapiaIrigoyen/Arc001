import { useState } from 'react';
import { Circle, Clock, MinusCircle, Ban, ChevronDown } from 'lucide-react';
import socketClient from '../services/socket';
import StatusBadge from './StatusBadge';

interface StatusSelectorProps {
  currentStatus: 'online' | 'away' | 'busy' | 'dnd';
  onChange?: (status: 'online' | 'away' | 'busy' | 'dnd') => void;
}

const STATUSES = [
  { value: 'online' as const, label: 'Online', description: 'Disponible para chatear' },
  { value: 'away' as const, label: 'Away', description: 'Ausente temporalmente' },
  { value: 'busy' as const, label: 'Busy', description: 'Ocupado, no molestar' },
  { value: 'dnd' as const, label: 'Do Not Disturb', description: 'Sin notificaciones' }
];

export default function StatusSelector({ currentStatus, onChange }: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = (status: typeof currentStatus) => {
    socketClient.changeStatus(status);
    onChange?.(status);
    setIsOpen(false);
  };

  const currentConfig = STATUSES.find(s => s.value === currentStatus);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-[#1a1f2e] border border-cyan-500/20 hover:border-cyan-500/50 rounded-lg transition-all group"
      >
        <StatusBadge status={currentStatus} size="sm" />
        <span className="text-sm text-white">{currentConfig?.label}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full mt-2 left-0 w-64 bg-[#1a1f2e] border border-cyan-500/30 rounded-lg shadow-xl z-50">
            <div className="p-2">
              <p className="text-xs text-gray-400 px-3 py-2 mb-1">Cambiar estado</p>
              {STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    status.value === currentStatus
                      ? 'bg-cyan-500/20 border border-cyan-500/30'
                      : 'hover:bg-cyan-500/10'
                  }`}
                >
                  <div className="mt-1">
                    <StatusBadge status={status.value} size="sm" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      status.value === currentStatus ? 'text-cyan-400' : 'text-white'
                    }`}>
                      {status.label}
                    </p>
                    <p className="text-xs text-gray-400">{status.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

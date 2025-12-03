import { Circle, Clock, MinusCircle, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: 'online' | 'away' | 'busy' | 'dnd' | 'offline';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const STATUS_CONFIG = {
  online: {
    color: 'bg-green-500',
    label: 'Online',
    icon: Circle,
    ring: 'ring-green-500/30'
  },
  away: {
    color: 'bg-yellow-500',
    label: 'Away',
    icon: Clock,
    ring: 'ring-yellow-500/30'
  },
  busy: {
    color: 'bg-red-500',
    label: 'Busy',
    icon: MinusCircle,
    ring: 'ring-red-500/30'
  },
  dnd: {
    color: 'bg-purple-500',
    label: 'Do Not Disturb',
    icon: Ban,
    ring: 'ring-purple-500/30'
  },
  offline: {
    color: 'bg-gray-500',
    label: 'Offline',
    icon: Circle,
    ring: 'ring-gray-500/30'
  }
};

export default function StatusBadge({ status, size = 'md', showLabel = false }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: { dot: 'w-2 h-2', icon: 10, text: 'text-xs' },
    md: { dot: 'w-3 h-3', icon: 12, text: 'text-sm' },
    lg: { dot: 'w-4 h-4', icon: 14, text: 'text-base' }
  };

  if (showLabel) {
    return (
      <div className="flex items-center gap-2">
        <div className={`relative ${sizeClasses[size].dot}`}>
          <div className={`absolute inset-0 ${config.color} rounded-full animate-pulse`} />
          <div className={`absolute inset-0 ${config.color} rounded-full ring-2 ${config.ring}`} />
        </div>
        <span className={`${sizeClasses[size].text} text-gray-300`}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses[size].dot}`} title={config.label}>
      {status === 'online' && (
        <div className={`absolute inset-0 ${config.color} rounded-full animate-pulse`} />
      )}
      <div className={`absolute inset-0 ${config.color} rounded-full ring-2 ${config.ring}`} />
    </div>
  );
}

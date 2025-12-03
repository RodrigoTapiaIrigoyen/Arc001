import { Users, ChevronLeft, Circle } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface OnlineUser {
  userId: string;
  username: string;
  status: 'online' | 'away' | 'busy' | 'dnd';
}

interface OnlineUsersPanelProps {
  users: Map<string, { status: 'online' | 'away' | 'busy' | 'dnd', username: string }>;
  onUserClick?: (userId: string, username: string) => void;
  onClose?: () => void;
}

export default function OnlineUsersPanel({ users, onUserClick, onClose }: OnlineUsersPanelProps) {
  const usersList = Array.from(users.entries()).map(([userId, data]) => ({
    userId,
    username: data.username,
    status: data.status
  }));

  // Ordenar por estado: online > away > busy > dnd
  const sortedUsers = usersList.sort((a, b) => {
    const statusPriority: Record<string, number> = {
      online: 0,
      away: 1,
      busy: 2,
      dnd: 3
    };
    return statusPriority[a.status] - statusPriority[b.status];
  });

  return (
    <div className="h-full bg-[#0f1420]/50 border-l border-cyan-500/20 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-cyan-400" />
          <h3 className="font-bold text-cyan-400">Online ({users.size})</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            title="Cerrar panel"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto">
        {sortedUsers.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Circle className="text-gray-600 mx-auto mb-3" size={32} />
            <p className="text-sm text-gray-500">No hay usuarios conectados</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedUsers.map((user) => (
              <button
                key={user.userId}
                onClick={() => onUserClick?.(user.userId, user.username)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-cyan-500/10 transition-colors text-left group"
              >
                {/* Avatar */}
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <StatusBadge status={user.status} size="sm" />
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                    {user.username}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={user.status} size="sm" showLabel />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-3 border-t border-cyan-500/20 bg-cyan-500/5">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div>
            <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-1" />
            <p className="text-gray-400">
              {sortedUsers.filter(u => u.status === 'online').length}
            </p>
          </div>
          <div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full mx-auto mb-1" />
            <p className="text-gray-400">
              {sortedUsers.filter(u => u.status === 'away').length}
            </p>
          </div>
          <div>
            <div className="w-2 h-2 bg-red-500 rounded-full mx-auto mb-1" />
            <p className="text-gray-400">
              {sortedUsers.filter(u => u.status === 'busy').length}
            </p>
          </div>
          <div>
            <div className="w-2 h-2 bg-purple-500 rounded-full mx-auto mb-1" />
            <p className="text-gray-400">
              {sortedUsers.filter(u => u.status === 'dnd').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  MessageSquare,
  ShoppingCart,
  User,
  Trophy,
  Clock,
  ThumbsUp,
  MessageCircle,
  Filter,
  RefreshCw,
  Sparkles,
  DollarSign,
  Package,
  Users
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Activity {
  _id: string;
  type: 'post' | 'trade' | 'profile' | 'achievement';
  user: {
    userId: string;
    username: string;
    avatar?: string;
  };
  content: {
    title?: string;
    description?: string;
    category?: string;
    price?: number;
    itemName?: string;
  };
  metadata: {
    likes?: number;
    comments?: number;
    views?: number;
  };
  createdAt: string;
  refId?: string; // ID del post, trade, etc.
}

const FILTERS = [
  { id: 'all', label: 'Todo', icon: TrendingUp },
  { id: 'post', label: 'Posts', icon: MessageSquare },
  { id: 'trade', label: 'Trades', icon: ShoppingCart },
  { id: 'profile', label: 'Perfiles', icon: User },
  { id: 'achievement', label: 'Logros', icon: Trophy },
];

const TIME_FILTERS = [
  { id: '24h', label: 'Últimas 24h' },
  { id: '7d', label: 'Última semana' },
  { id: '30d', label: 'Último mes' },
];

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadActivities();
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadActivities, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, timeFilter]);

  const handleActivityClick = (activity: Activity) => {
    // Navegar según el tipo de actividad
    if (activity.type === 'post') {
      // Cambiar a la vista de Community y abrir el post
      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'community', postId: activity.refId } }));
    } else if (activity.type === 'trade') {
      // Cambiar a la vista de Marketplace
      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'marketplace', itemId: activity.refId } }));
    } else if (activity.type === 'profile') {
      // Abrir perfil del usuario
      window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'profile', userId: activity.user.userId } }));
    }
  };

  const loadActivities = async () => {
    try {
      const params = new URLSearchParams({
        ...(filter !== 'all' && { type: filter }),
        timeRange: timeFilter,
      });

      const response = await api.get(`/activity?${params}`);
      setActivities(response.activities || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Error al cargar actividades');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return MessageSquare;
      case 'trade': return ShoppingCart;
      case 'profile': return User;
      case 'achievement': return Trophy;
      default: return Sparkles;
    }
  };



  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'ahora mismo';
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    return `hace ${diffDays}d`;
  };

  const isRecent = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins < 5; // Actividad de los últimos 5 minutos
  };

  const renderActivityContent = (activity: Activity) => {
    const Icon = getActivityIcon(activity.type);
    
    // Estilos fijos por tipo (Tailwind no soporta clases dinámicas)
    const typeStyles = {
      post: 'border-cyan-500/20 hover:border-cyan-500/40',
      trade: 'border-yellow-500/20 hover:border-yellow-500/40',
      profile: 'border-green-500/20 hover:border-green-500/40',
      achievement: 'border-purple-500/20 hover:border-purple-500/40',
    };

    const avatarStyles = {
      post: 'border-cyan-500/50',
      trade: 'border-yellow-500/50',
      profile: 'border-green-500/50',
      achievement: 'border-purple-500/50',
    };

    const iconBgStyles = {
      post: 'bg-cyan-500/20 border-cyan-500/50',
      trade: 'bg-yellow-500/20 border-yellow-500/50',
      profile: 'bg-green-500/20 border-green-500/50',
      achievement: 'bg-purple-500/20 border-purple-500/50',
    };

    const iconColorStyles = {
      post: 'text-cyan-400',
      trade: 'text-yellow-400',
      profile: 'text-green-400',
      achievement: 'text-purple-400',
    };

    const badgeStyles = {
      post: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      trade: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      profile: 'bg-green-500/10 border-green-500/30 text-green-400',
      achievement: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    };

    const recent = isRecent(activity.createdAt);

    return (
      <div 
        onClick={() => handleActivityClick(activity)}
        className={`bg-gradient-to-br from-[#1a1f2e] to-[#0a0e1a] border rounded-xl p-6 transition-all cursor-pointer hover:scale-[1.02] hover:shadow-lg ${typeStyles[activity.type as keyof typeof typeStyles]} ${recent ? 'animate-pulse-slow ring-2 ring-cyan-500/50' : ''}`}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            {activity.user.avatar ? (
              <img
                src={activity.user.avatar.startsWith('http') ? activity.user.avatar : `${import.meta.env.VITE_API_URL || 'http://localhost:10000/api'}/../..${activity.user.avatar}`}
                alt={activity.user.username}
                className={`w-12 h-12 rounded-full border-2 ${avatarStyles[activity.type as keyof typeof avatarStyles]}`}
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            ) : (
              <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${iconBgStyles[activity.type as keyof typeof iconBgStyles]}`}>
                <User className={iconColorStyles[activity.type as keyof typeof iconColorStyles]} size={24} />
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-[#0f1420] rounded-full flex items-center justify-center border ${iconBgStyles[activity.type as keyof typeof iconBgStyles]}`}>
              <Icon className={iconColorStyles[activity.type as keyof typeof iconColorStyles]} size={14} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white">{activity.user.username}</span>
                {recent && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full animate-pulse">
                    NUEVO
                  </span>
                )}
                <span className="text-gray-400 text-sm">
                  {activity.type === 'post' && 'publicó en Community'}
                  {activity.type === 'trade' && 'publicó en Marketplace'}
                  {activity.type === 'profile' && 'actualizó su perfil'}
                  {activity.type === 'achievement' && 'desbloqueó un logro'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                <Clock size={14} />
                {formatTimeAgo(activity.createdAt)}
              </div>
            </div>

            {/* Activity Details */}
            {activity.type === 'post' && (
              <div className="bg-[#0a0e1a] border border-cyan-500/20 rounded-lg p-4 mb-3">
                <h4 className="font-bold text-white mb-1">{activity.content.title}</h4>
                <p className="text-gray-400 text-sm line-clamp-2">{activity.content.description}</p>
                {activity.content.category && (
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${badgeStyles[activity.type as keyof typeof badgeStyles]}`}>
                    {activity.content.category}
                  </span>
                )}
              </div>
            )}

            {activity.type === 'trade' && (
              <div className="bg-[#0a0e1a] border border-yellow-500/20 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="text-yellow-400" size={20} />
                    <span className="font-bold text-white">{activity.content.itemName}</span>
                  </div>
                  {activity.content.price && (
                    <div className="flex items-center gap-1 text-green-400 font-bold">
                      <DollarSign size={16} />
                      {activity.content.price.toLocaleString()}
                    </div>
                  )}
                </div>
                {activity.content.description && (
                  <p className="text-gray-400 text-sm mt-2 line-clamp-1">{activity.content.description}</p>
                )}
              </div>
            )}

            {activity.type === 'profile' && (
              <div className="bg-[#0a0e1a] border border-green-500/20 rounded-lg p-4 mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-green-400" size={18} />
                  <span className="text-gray-300 text-sm">{activity.content.description || 'Actualizó su perfil'}</span>
                </div>
              </div>
            )}

            {activity.type === 'achievement' && (
              <div className={`bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4 mb-3`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <Trophy className="text-white" size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                      {activity.content.title}
                    </h4>
                    <p className="text-gray-400 text-xs">{activity.content.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            {(activity.metadata.likes || activity.metadata.comments || activity.metadata.views) && (
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {activity.metadata.likes !== undefined && (
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={14} />
                    {activity.metadata.likes}
                  </span>
                )}
                {activity.metadata.comments !== undefined && (
                  <span className="flex items-center gap-1">
                    <MessageCircle size={14} />
                    {activity.metadata.comments}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            Activity Feed
          </h2>
          <p className="text-gray-400 text-sm">Actividad reciente de la comunidad</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={refreshing ? 'animate-spin' : ''} size={18} />
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="text-gray-500" size={20} />
        
        {/* Type Filter */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                  filter === f.id
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                    : 'bg-[#1a1f2e]/50 border-gray-700/30 text-gray-400 hover:border-cyan-500/30'
                }`}
              >
                <Icon size={16} />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Time Filter */}
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="px-4 py-2 bg-[#1a1f2e] border border-gray-700/30 rounded-lg text-gray-300 focus:outline-none focus:border-cyan-500/50"
        >
          {TIME_FILTERS.map(tf => (
            <option key={tf.id} value={tf.id}>{tf.label}</option>
          ))}
        </select>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-cyan-400" />
            <p>Cargando actividades...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1f2e]/50 border border-gray-700/30 rounded-lg">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No hay actividad reciente</p>
            <p className="text-gray-600 text-sm">Sé el primero en publicar algo</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity._id}>
              {renderActivityContent(activity)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

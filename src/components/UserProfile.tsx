import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Calendar,
  Edit,
  MessageSquare,
  Trophy,
  ShoppingCart,
  MessageCircle,
  TrendingUp,
  Target,
  Loader,
  ArrowLeft
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface UserProfileProps {
  userId?: string;
  currentUserId?: string;
  onBack?: () => void;
  onEdit?: () => void;
  onMessage?: (userId: string) => void;
}

interface Profile {
  _id: string;
  username: string;
  email: string;
  fullName: string;
  bio: string;
  avatar: string | null;
  role: string;
  createdAt: string;
  isActive: boolean;
}

interface Stats {
  posts: {
    total: number;
    topVotes: number;
  };
  marketplace: {
    listings: number;
  };
  trackers: {
    total: number;
    completed: number;
    completionRate: number;
  };
  messages: {
    sent: number;
    received: number;
    total: number;
  };
}

interface Activity {
  type: 'post' | 'listing' | 'tracker';
  title: string;
  content?: string;
  category?: string;
  votes?: number;
  status?: string;
  timestamp: string;
  id: string;
}

export default function UserProfile({ 
  userId, 
  currentUserId, 
  onBack, 
  onEdit,
  onMessage 
}: UserProfileProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'activity' | 'stats'>('stats');

  const isOwnProfile = userId === currentUserId;

  useEffect(() => {
    console.log('UserProfile userId:', userId);
    console.log('UserProfile currentUserId:', currentUserId);
    
    if (userId) {
      loadProfile();
      loadStats();
      loadActivity();
    } else {
      console.error('userId is undefined!');
      setLoading(false);
      toast.error('No se pudo cargar el perfil: ID de usuario no válido');
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      console.log('Loading profile for userId:', userId);
      const response = await api.get(`/users/${userId}`);
      console.log('Profile response:', response);
      setProfile(response.profile);
    } catch (error: any) {
      console.error('Error al cargar perfil:', error);
      toast.error('Error al cargar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/users/${userId}/stats`);
      setStats(response.stats);
    } catch (error: any) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const loadActivity = async () => {
    try {
      const response = await api.get(`/users/${userId}/activity?limit=10`);
      setActivity(response.activity || []);
    } catch (error: any) {
      console.error('Error al cargar actividad:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return MessageCircle;
      case 'listing':
        return ShoppingCart;
      case 'tracker':
        return Trophy;
      default:
        return Target;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'post':
        return 'from-blue-500 to-green-500';
      case 'listing':
        return 'from-yellow-500 to-red-500';
      case 'tracker':
        return 'from-green-500 to-blue-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader className="animate-spin text-yellow-400" size={32} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto mb-4 text-gray-600" size={64} />
        <p className="text-gray-400">Usuario no encontrado</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header con botón de volver */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>
      )}

      {/* Profile Card */}
      <div className="bg-[#0f1420]/80 backdrop-blur-xl border border-red-500/20 rounded-xl overflow-hidden">
        {/* Cover/Header */}
        <div className="h-32 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        </div>

        <div className="px-6 pb-6">
          {/* Avatar + Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 relative">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 p-1 shadow-2xl">
              <div className="w-full h-full rounded-full bg-[#0f1420] flex items-center justify-center">
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt={profile.username}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-yellow-400" />
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-green-500">
                {profile.username}
              </h1>
              <p className="text-lg text-gray-400">{profile.fullName}</p>
              {profile.bio && (
                <p className="text-sm text-gray-500 mt-2 max-w-2xl">{profile.bio}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 sm:ml-auto">
              {isOwnProfile ? (
                <button
                  onClick={onEdit}
                  className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-green-500 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all flex items-center gap-2"
                >
                  <Edit size={18} />
                  Editar Perfil
                </button>
              ) : (
                <button
                  onClick={() => onMessage && onMessage(userId!)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center gap-2"
                >
                  <MessageSquare size={18} />
                  Enviar Mensaje
                </button>
              )}
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-yellow-400" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-green-400" />
              <span>Miembro desde {formatDate(profile.createdAt)}</span>
            </div>
            {profile.role !== 'user' && (
              <div className="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full">
                <span className="text-red-400 font-bold text-xs uppercase">{profile.role}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-yellow-500/20">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-3 font-bold transition-all ${
            activeTab === 'stats'
              ? 'text-yellow-400 border-b-2 border-yellow-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Estadísticas
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-6 py-3 font-bold transition-all ${
            activeTab === 'activity'
              ? 'text-yellow-400 border-b-2 border-yellow-500'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Actividad Reciente
        </button>
      </div>

      {/* Content */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Posts */}
          <div className="bg-[#0f1420]/80 backdrop-blur-xl border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                <MessageCircle size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stats.posts.total}</p>
                <p className="text-sm text-gray-400">Posts</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Top: {stats.posts.topVotes} votos
            </div>
          </div>

          {/* Marketplace */}
          <div className="bg-[#0f1420]/80 backdrop-blur-xl border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-red-500 flex items-center justify-center">
                <ShoppingCart size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stats.marketplace.listings}</p>
                <p className="text-sm text-gray-400">Listings</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Activos en marketplace
            </div>
          </div>

          {/* Trackers */}
          <div className="bg-[#0f1420]/80 backdrop-blur-xl border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                <Trophy size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stats.trackers.completed}/{stats.trackers.total}</p>
                <p className="text-sm text-gray-400">Trackers</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {stats.trackers.completionRate}% completado
            </div>
          </div>

          {/* Messages */}
          <div className="bg-[#0f1420]/80 backdrop-blur-xl border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-yellow-500 flex items-center justify-center">
                <MessageSquare size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-black text-white">{stats.messages.total}</p>
                <p className="text-sm text-gray-400">Mensajes</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {stats.messages.sent} enviados, {stats.messages.received} recibidos
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-[#0f1420]/80 backdrop-blur-xl border border-yellow-500/20 rounded-xl p-6">
          {activity.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="mx-auto mb-4 text-gray-600" size={48} />
              <p className="text-gray-400">Sin actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activity.map((item, index) => {
                const Icon = getActivityIcon(item.type);
                const colorClass = getActivityColor(item.type);
                
                return (
                  <div
                    key={`${item.type}-${item.id}-${index}`}
                    className="flex gap-4 p-4 bg-[#1a1f2e] border border-blue-500/10 rounded-lg hover:border-blue-500/30 transition-all"
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate">{item.title}</h4>
                      {item.content && (
                        <p className="text-sm text-gray-400 line-clamp-2">{item.content}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="capitalize">{item.type}</span>
                        {item.category && <span>• {item.category}</span>}
                        {item.votes !== undefined && <span>• {item.votes} votos</span>}
                        {item.status && <span>• {item.status}</span>}
                        <span>• {formatDate(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  MessageSquare, 
  Reply, 
  ShoppingBag, 
  ThumbsUp, 
  AtSign, 
  AlertCircle,
  Clock,
  UserPlus,
  Users,
  Shield,
  Trophy,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import socketService from '../services/socket';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    username: string;
    fullName?: string;
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (link: string) => void;
}

export default function NotificationCenter({ isOpen, onClose, onNavigate }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filter]);

  // Escuchar notificaciones en tiempo real
  useEffect(() => {
    const handleNewNotification = (notification: any) => {
      // Agregar la notificación al inicio de la lista
      setNotifications(prev => [
        {
          _id: notification._id || Date.now().toString(),
          type: notification.type,
          title: notification.title,
          message: notification.message,
          link: notification.link,
          is_read: false,
          created_at: notification.createdAt || new Date().toISOString(),
          sender: notification.sender
        },
        ...prev
      ]);

      // Mostrar toast
      toast.success(notification.message, {
        icon: '🔔',
        duration: 4000
      });
    };

    socketService.on('new-notification', handleNewNotification);

    return () => {
      socketService.off('new-notification', handleNewNotification);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/notifications?unreadOnly=${filter === 'unread'}`);
      setNotifications(data);
    } catch (error: any) {
      console.error('Error loading notifications:', error);
      // Solo mostrar error si no es problema de autenticación
      if (!error.message?.includes('permisos') && !error.message?.includes('Token')) {
        toast.error('Error al cargar notificaciones');
      }
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/read/${id}`);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error al marcar notificaciones');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n._id !== id));
      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error al eliminar notificación');
    }
  };

  const deleteAllRead = async () => {
    try {
      await api.delete('/notifications/read/all');
      setNotifications(notifications.filter(n => !n.is_read));
      toast.success('Notificaciones leídas eliminadas');
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      toast.error('Error al eliminar notificaciones');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification._id);
    }
    
    // Manejar navegación por link directo
    if (notification.link && onNavigate) {
      onNavigate(notification.link);
      onClose();
      return;
    }
    
    // Manejar navegación por data (para friends, etc)
    if ((notification as any).data && onNavigate) {
      const data = typeof (notification as any).data === 'string' 
        ? JSON.parse((notification as any).data) 
        : (notification as any).data;
      
      if (data.view) {
        // Si hay un tab específico, usar sessionStorage para que Friends lo detecte
        if (data.tab) {
          sessionStorage.setItem('friendsActiveTab', data.tab);
        }
        onNavigate(data.view);
        onClose();
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare size={18} className="text-blue-400" />;
      case 'reply':
        return <Reply size={18} className="text-purple-400" />;
      case 'trade':
      case 'trade_accepted':
        return <ShoppingBag size={18} className="text-green-400" />;
      case 'friend_request':
        return <UserPlus size={18} className="text-purple-400" />;
      case 'friend_accepted':
        return <CheckCircle size={18} className="text-green-400" />;
      case 'group_joined':
      case 'group_accepted':
        return <CheckCircle size={18} className="text-green-500" />;
      case 'group_rejected':
        return <XCircle size={18} className="text-red-500" />;
      case 'member_joined_group':
        return <Users size={18} className="text-blue-400" />;
      case 'clan_joined':
      case 'clan_accepted':
        return <Shield size={18} className="text-amber-500" />;
      case 'clan_rejected':
        return <XCircle size={18} className="text-red-500" />;
      case 'member_joined_clan':
        return <Trophy size={18} className="text-amber-400" />;
      case 'vote':
        return <ThumbsUp size={18} className="text-yellow-400" />;
      case 'mention':
        return <AtSign size={18} className="text-green-400" />;
      case 'system':
        return <AlertCircle size={18} className="text-red-400" />;
      default:
        return <Bell size={18} className="text-gray-400" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Ahora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-[#0f1420] border-l border-red-500/30 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Bell className="text-yellow-400" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white">Notificaciones</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={20} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="p-4 border-b border-gray-800 flex gap-2 bg-gray-900/50">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/20'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'unread'
                ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/20'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            No leídas
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="p-4 border-b border-gray-800 flex gap-2 bg-gray-900/30">
            <button
              onClick={markAllAsRead}
              className="flex-1 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
            >
              <CheckCheck size={16} />
              Marcar todas
            </button>
            <button
              onClick={deleteAllRead}
              className="flex-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Trash2 size={16} />
              Limpiar
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="p-4 bg-gray-800/50 rounded-full mb-4">
                <Bell className="text-gray-600" size={48} />
              </div>
              <h3 className="text-xl font-bold text-gray-400 mb-2">
                {filter === 'unread' ? 'Sin notificaciones nuevas' : 'No hay notificaciones'}
              </h3>
              <p className="text-gray-500 text-sm">
                {filter === 'unread' 
                  ? 'Estás al día con tus notificaciones' 
                  : 'Recibirás notificaciones sobre tu actividad aquí'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 hover:bg-gray-800/60 transition-all cursor-pointer group border-l-4 ${
                    !notification.is_read 
                      ? 'bg-yellow-600/10 border-l-yellow-500' 
                      : 'border-l-transparent'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1 p-2 bg-gray-800 rounded-lg">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-white text-sm group-hover:text-yellow-400 transition-colors">
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 mt-1 animate-pulse" />
                        )}
                      </div>

                      <p className="text-gray-400 text-sm mb-2 line-clamp-2 group-hover:text-gray-300 transition-colors">
                        {notification.message}
                      </p>

                      {notification.sender && (
                        <p className="text-xs text-gray-500 mb-2">
                          Por: <span className="text-green-400 font-medium">{notification.sender.username}</span>
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} />
                          {getTimeAgo(notification.created_at)}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification._id);
                              }}
                              className="p-1.5 hover:bg-green-600/30 rounded transition-colors"
                              title="Marcar como leída"
                            >
                              <Check size={14} className="text-green-400" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            className="p-1.5 hover:bg-red-600/30 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

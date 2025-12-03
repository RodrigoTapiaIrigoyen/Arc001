import { useState, useEffect } from 'react';
import {
  Database,
  Home,
  Target,
  Sword,
  Shield,
  Package,
  Map,
  Users,
  UserPlus,
  ScrollText,
  TrendingUp,
  ShoppingCart,
  Menu,
  X,
  Search,
  User,
  LogOut,
  Bell,
  MessageSquare,
  Volume2,
  HelpCircle,
  VolumeX,
  BellRing,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import EditProfile from './EditProfile';
import api from '../services/api';
import { notificationService } from '../services/notifications';
import socketService from '../services/socket';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  user?: any;
  onLogout?: () => void;
  onEditProfile?: () => void;
}

export default function Layout({ children, currentView, onViewChange, user, onLogout, onEditProfile }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(notificationService.isSoundEnabled());
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  // Guardar historial de navegación
  useEffect(() => {
    if (currentView) {
      setNavigationHistory(prev => {
        // No agregar si es el mismo que el último
        if (prev[prev.length - 1] === currentView) return prev;
        // Guardar hasta las últimas 10 rutas
        const newHistory = [...prev, currentView].slice(-10);
        // Guardar en localStorage
        localStorage.setItem('navigationHistory', JSON.stringify(newHistory));
        return newHistory;
      });
    }
  }, [currentView]);

  // Cargar historial al montar
  useEffect(() => {
    const savedHistory = localStorage.getItem('navigationHistory');
    if (savedHistory) {
      try {
        setNavigationHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error al cargar historial:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      loadUnreadMessages();
      
      // Escuchar nuevas notificaciones en tiempo real
      const handleNewNotification = () => {
        console.log('🔔 Layout: Nueva notificación detectada, actualizando contador');
        setUnreadCount(prev => prev + 1);
      };

      const handleNewMessage = () => {
        console.log('💬 Layout: Nuevo mensaje detectado, actualizando contador');
        if (currentView !== 'messages') {
          setUnreadMessages(prev => prev + 1);
        }
      };

      socketService.on('new-notification', handleNewNotification);
      socketService.on('new-message', handleNewMessage);
      
      // Actualizar contadores cada 30 segundos
      const interval = setInterval(() => {
        loadUnreadCount();
        loadUnreadMessages();
      }, 30000);
      
      return () => {
        socketService.off('new-notification', handleNewNotification);
        socketService.off('new-message', handleNewMessage);
        clearInterval(interval);
      };
    }
  }, [user, currentView]);

  // Recargar contador de mensajes cuando se cambia de vista (especialmente al salir de Messages)
  useEffect(() => {
    if (user && currentView !== 'messages') {
      loadUnreadMessages();
    }
  }, [currentView, user]);

  const loadUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      setUnreadCount(response.count || 0);
    } catch (error: any) {
      // Silenciosamente ignorar errores al cargar contador
      console.debug('No se pudo cargar contador de notificaciones:', error.message);
    }
  };

  const loadUnreadMessages = async () => {
    try {
      const response = await api.get('/messages/unread/count');
      setUnreadMessages(response.count || 0);
    } catch (error: any) {
      console.debug('No se pudo cargar contador de mensajes:', error.message);
    }
  };

  const handleRequestNotificationPermission = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      alert('¡Notificaciones activadas! Recibirás alertas de mensajes y ofertas.');
    } else {
      alert('Notificaciones bloqueadas. Puedes activarlas en la configuración de tu navegador.');
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    notificationService.toggleSound(newValue);
  };

  const handleGoBack = () => {
    // Obtener el historial excluyendo la vista actual
    const history = [...navigationHistory];
    // Remover la vista actual
    history.pop();
    
    if (history.length > 0) {
      // Ir a la vista anterior
      const previousView = history[history.length - 1];
      onViewChange(previousView);
      // Actualizar historial
      setNavigationHistory(history);
      localStorage.setItem('navigationHistory', JSON.stringify(history));
    } else {
      // Si no hay historial, ir al dashboard
      onViewChange('dashboard');
    }
  };

  const canGoBack = navigationHistory.length > 1;

  const baseMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'weapons', label: 'Weapons', icon: Sword },
    { id: 'armor', label: 'Armor', icon: Shield },
    { id: 'items', label: 'Items', icon: Package },
    { id: 'enemies', label: 'Enemies', icon: Target },
    { id: 'maps', label: 'Maps', icon: Map },
    { id: 'help', label: 'Help & Guide', icon: HelpCircle },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'activity', label: 'Activity Feed', icon: TrendingUp },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingCart },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'friends', label: 'Friends', icon: UserPlus },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
  ];

  // Agregar opción de Admin solo para administradores
  const menuItems = user?.role === 'admin' || user?.role === 'moderator'
    ? [...baseMenuItems, { id: 'admin', label: 'Admin Panel', icon: Shield }]
    : baseMenuItems;

  return (
    <div className="min-h-screen text-gray-100 relative">
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#0f1420]/50 backdrop-blur-md border-b border-red-500/30 z-50 shadow-lg shadow-red-900/20">
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-yellow-500/10 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            {/* Botón de regresar */}
            {canGoBack && currentView !== 'dashboard' && (
              <button
                onClick={handleGoBack}
                className="p-2 hover:bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-500/40 rounded-lg transition-all group"
                title="Regresar"
              >
                <ArrowLeft className="text-gray-400 group-hover:text-yellow-400 transition-colors" size={20} />
              </button>
            )}
            
            <div className="flex items-center gap-3">
              <img 
                src="/logo-256.png"
                loading="lazy"
                width="40"
                height="40"
                alt="ARC RAIDERS Logo"
                className="h-10 w-auto object-contain"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 bg-clip-text text-transparent">
                  ARK MARKET
                </h1>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 flex-1 max-w-2xl mx-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search weapons, enemies, quests..."
                className="w-full bg-[#1a1f2e] border border-green-500/20 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-green-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-yellow-400">ONLINE</span>
            </div>
            
            {user && (
              <div className="flex items-center gap-2">
                {/* Notifications Button */}
                <button
                  onClick={() => setNotificationsOpen(true)}
                  className="relative p-2 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/30 rounded-lg transition-colors group"
                  title="Notificaciones"
                >
                  <Bell className="text-gray-400 group-hover:text-blue-400 transition-colors" size={18} />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    </div>
                  )}
                </button>

                {/* Notification Settings */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifSettings(!showNotifSettings)}
                    className="p-2 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 rounded-lg transition-colors group"
                    title="Configuración de notificaciones"
                  >
                    {soundEnabled ? (
                      <Volume2 className="text-gray-400 group-hover:text-cyan-400 transition-colors" size={18} />
                    ) : (
                      <VolumeX className="text-gray-400 group-hover:text-cyan-400 transition-colors" size={18} />
                    )}
                  </button>

                  {showNotifSettings && (
                    <>
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowNotifSettings(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-[#1a1f2e] border border-cyan-500/30 rounded-lg shadow-xl z-50">
                        <div className="p-4 space-y-3">
                          <h3 className="text-sm font-bold text-cyan-400 mb-3">Notificaciones</h3>
                          
                          <button
                            onClick={() => {
                              handleRequestNotificationPermission();
                              setShowNotifSettings(false);
                            }}
                            className="w-full flex items-center gap-3 p-2 hover:bg-cyan-500/10 rounded-lg transition-colors text-left"
                          >
                            <BellRing size={16} className="text-cyan-400" />
                            <div className="flex-1">
                              <p className="text-sm text-white">Activar notificaciones</p>
                              <p className="text-xs text-gray-400">Recibe alertas del navegador</p>
                            </div>
                          </button>

                          <button
                            onClick={toggleSound}
                            className="w-full flex items-center gap-3 p-2 hover:bg-cyan-500/10 rounded-lg transition-colors text-left"
                          >
                            {soundEnabled ? (
                              <Volume2 size={16} className="text-green-400" />
                            ) : (
                              <VolumeX size={16} className="text-red-400" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm text-white">
                                {soundEnabled ? 'Desactivar sonidos' : 'Activar sonidos'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {soundEnabled ? 'Sonidos activos' : 'Sonidos desactivados'}
                              </p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => {
                    onViewChange('profile');
                    if (onEditProfile) {
                      // Exponer función para que App pueda controlar el modal
                      window.__openEditProfile = () => setEditProfileOpen(true);
                    }
                  }}
                  className="hidden md:flex items-center gap-2 px-3 py-2 bg-[#1a1f2e] border border-green-500/20 hover:border-green-500/50 rounded-lg transition-all group"
                  title="Ver perfil"
                >
                  <User className="text-green-400 group-hover:scale-110 transition-transform" size={16} />
                  <span className="text-sm font-medium text-white group-hover:text-green-400 transition-colors">{user.username}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 rounded-lg transition-colors group"
                  title="Logout"
                >
                  <LogOut className="text-gray-400 group-hover:text-red-400 transition-colors" size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`fixed top-16 left-0 bottom-0 w-64 bg-[#0f1420]/50 backdrop-blur-md border-r border-yellow-500/30 z-40 transform transition-transform duration-300 lg:translate-x-0 shadow-lg shadow-yellow-900/20 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-green-500/20 border border-yellow-500/30 text-yellow-400'
                    : 'hover:bg-yellow-500/5 text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-yellow-400' : 'text-gray-500 group-hover:text-yellow-400'} />
                <span className="font-medium text-sm tracking-wide">{item.label}</span>
                {item.id === 'messages' && unreadMessages > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded-full">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
                {isActive && item.id !== 'messages' && (
                  <div className="ml-auto w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="lg:ml-64 pt-16">
        <main className="p-4 lg:p-6">
          {/* Breadcrumb con botón de regresar */}
          {currentView !== 'dashboard' && (
            <div className="mb-4 flex items-center gap-2">
              <button
                onClick={() => onViewChange('dashboard')}
                className="flex items-center gap-2 px-3 py-2 bg-[#1a1f2e] border border-yellow-500/20 hover:border-yellow-500/50 rounded-lg transition-all group"
              >
                <ArrowLeft className="text-yellow-400 group-hover:-translate-x-1 transition-transform" size={18} />
                <span className="text-sm text-gray-400 group-hover:text-yellow-400 transition-colors">Regresar al Dashboard</span>
              </button>
              <ChevronRight className="text-gray-600" size={16} />
              <span className="text-sm font-medium text-yellow-400">
                {menuItems.find(item => item.id === currentView)?.label || currentView}
              </span>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Edit Profile Modal */}
      {editProfileOpen && user && (
        <EditProfile
          userId={user.userId}
          onClose={() => setEditProfileOpen(false)}
          onSave={() => {
            // Recargar datos del usuario si es necesario
            setEditProfileOpen(false);
          }}
        />
      )}

      {/* Notification Center */}
      <NotificationCenter
        isOpen={notificationsOpen}
        onClose={() => {
          setNotificationsOpen(false);
          loadUnreadCount(); // Actualizar contador al cerrar
        }}
        onNavigate={(link) => {
          // Navegar a la vista indicada
          if (link.startsWith('/')) {
            const view = link.substring(1); // Quitar el /
            onViewChange(view);
          }
          setNotificationsOpen(false);
        }}
      />
    </div>
  );
}

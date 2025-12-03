import { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import InstallPWA from './components/InstallPWA';
import Dashboard from './components/Dashboard';
import api from './services/api';
import socketClient from './services/socket';

// Lazy loading de componentes pesados (Dashboard cargado directamente para iOS)
const WeaponsDatabase = lazy(() => import('./components/WeaponsDatabase'));
const Armor = lazy(() => import('./components/Armor'));
const Enemies = lazy(() => import('./components/Enemies'));
const Items = lazy(() => import('./components/Items'));
const Maps = lazy(() => import('./components/Maps'));
const MyProfile = lazy(() => import('./components/MyProfile'));
const MarketplaceNew = lazy(() => import('./components/MarketplaceNew'));
const ActivityFeed = lazy(() => import('./components/ActivityFeed'));
const CommunityHub = lazy(() => import('./components/CommunityHub'));
const Messages = lazy(() => import('./components/Messages'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const PlaceholderView = lazy(() => import('./components/PlaceholderView'));
const HelpGuide = lazy(() => import('./components/HelpGuide'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(true);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const handleOpenEditProfile = () => {
    // @ts-ignore - función temporal expuesta desde Layout
    if (window.__openEditProfile) {
      window.__openEditProfile();
    }
  };

  // Listener para eventos de navegación desde Activity Feed
  useEffect(() => {
    const handleNavigate = (event: any) => {
      const { view, postId, itemId, userId } = event.detail;
      
      if (view === 'community' && postId) {
        setSelectedPostId(postId);
        setCurrentView('community');
      } else if (view === 'marketplace') {
        setCurrentView('marketplace');
      } else if (view === 'profile' && userId) {
        setProfileUserId(userId);
        setCurrentView('profile');
      }
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => window.removeEventListener('navigate', handleNavigate as EventListener);
  }, []);

  useEffect(() => {
    // Verificar si hay un usuario guardado y validar token
    const verifyAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        const tokenExpiration = localStorage.getItem('tokenExpiration');
        
        if (storedUser && storedToken) {
          try {
            // Verificar expiración local primero
            if (tokenExpiration) {
              const expirationDate = new Date(tokenExpiration);
              const now = new Date();
              
              if (now > expirationDate) {
                // Token expirado localmente
                console.log('Token expirado localmente, limpiando sesión');
                throw new Error('Token expirado');
              }
            }
            
            // Parsear usuario guardado
            const parsedUser = JSON.parse(storedUser);
            
            // Verificar token con el servidor (con timeout)
            try {
              const userData = await Promise.race([
                api.verifyToken(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
              ]);
              // Token válido, actualizar con datos frescos del servidor
              setUser((userData as any).user);
              
              // Conectar WebSocket con token válido
              if (storedToken && !socketClient.isConnected()) {
                socketClient.connect(storedToken);
              }
            } catch (verifyError: any) {
              // Si es 403 (Forbidden) o 401 (Unauthorized), token inválido
              if (verifyError.message?.includes('permisos') || 
                  verifyError.message?.includes('Token') ||
                  verifyError.message?.includes('Sesión') ||
                  verifyError.message?.includes('403') ||
                  verifyError.message?.includes('401')) {
                console.log('Token inválido en servidor, limpiando sesión');
                throw new Error('Token inválido');
              }
              // Si es error de red o timeout, usar datos locales temporalmente
              console.warn('Error de red al verificar token, usando sesión local');
              setUser(parsedUser);
            }
          } catch (error: any) {
            // Limpiar sesión si el token es inválido o expirado
            console.log('Limpiando sesión por:', error.message);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('tokenExpiration');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error en verifyAuth:', error);
      } finally {
        // SIEMPRE terminar loading
        setLoading(false);
      }
    };

    // Timeout de seguridad: si después de 3 segundos sigue loading, forzar false
    const safetyTimeout = setTimeout(() => {
      console.warn('Safety timeout: forzando fin de loading');
      setLoading(false);
    }, 3000);

    verifyAuth().finally(() => clearTimeout(safetyTimeout));
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    
    // Conectar WebSocket después del login
    const token = localStorage.getItem('token');
    if (token && !socketClient.isConnected()) {
      socketClient.connect(token);
    }
  };

  const handleRegister = (userData: any) => {
    setUser(userData);
    
    // Conectar WebSocket después del registro
    const token = localStorage.getItem('token');
    if (token && !socketClient.isConnected()) {
      socketClient.connect(token);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    
    // Desconectar WebSocket
    socketClient.disconnect();
    
    setUser(null);
    setCurrentView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#1a1f2e]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar login/register
  if (!user) {
    if (authView === 'login') {
      return (
        <Login 
          onLogin={handleLogin} 
          onSwitchToRegister={() => setAuthView('register')} 
        />
      );
    } else {
      return (
        <Register 
          onRegister={handleRegister} 
          onSwitchToLogin={() => setAuthView('login')} 
        />
      );
    }
  }

  const renderView = () => {
    const LoadingFallback = () => {
      const [showError, setShowError] = useState(false);
      
      useEffect(() => {
        const timer = setTimeout(() => setShowError(true), 10000);
        return () => clearTimeout(timer);
      }, []);
      
      if (showError) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
            <p className="text-red-400 mb-4">La página está tardando demasiado en cargar</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium"
            >
              Recargar
            </button>
          </div>
        );
      }
      
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
        </div>
      );
    };

    // Dashboard cargado directamente sin Suspense
    if (currentView === 'dashboard') {
      return <Dashboard onNavigate={setCurrentView} />;
    }
    
    return (
      <Suspense fallback={<LoadingFallback />}>
        {currentView === 'weapons' && <WeaponsDatabase />}
        {currentView === 'armor' && <Armor />}
        {currentView === 'items' && <Items />}
        {currentView === 'enemies' && <Enemies />}
        {currentView === 'maps' && <Maps />}
        {currentView === 'profile' && <MyProfile user={user} />}
        {currentView === 'activity' && <ActivityFeed />}
        {currentView === 'marketplace' && <MarketplaceNew />}
        {currentView === 'community' && <CommunityHub initialPostId={selectedPostId} onPostClose={() => setSelectedPostId(null)} />}
        {currentView === 'messages' && <Messages />}
        {currentView === 'help' && <HelpGuide />}
        {currentView === 'admin' && user?.role === 'admin' && <AdminDashboard />}
        {currentView === 'profile' && user && (
          <UserProfile 
            userId={profileUserId || user.userId} 
            currentUserId={user.userId}
            onBack={() => setCurrentView('dashboard')}
            onEdit={handleOpenEditProfile}
            onMessage={(userId) => {
              setProfileUserId(userId);
              setCurrentView('messages');
            }}
          />
        )}
      </Suspense>
    );
  };

  return (
    <div className="scanlines">
      <InstallPWA />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1f2e',
            color: '#fff',
            border: '1px solid rgba(234, 179, 8, 0.3)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Layout 
        currentView={currentView}
        onViewChange={setCurrentView}
        user={user}
        onLogout={handleLogout}
        onEditProfile={handleOpenEditProfile}
      >
        {renderView()}
      </Layout>
    </div>
  );
}

export default App;

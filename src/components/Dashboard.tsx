import { useState, useEffect } from 'react';
import { 
  Zap, 
  Target, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Database,
  Shield,
  Crosshair,
  TrendingUp,
  MessageSquare,
  Map,
  Activity
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [activeFeature, setActiveFeature] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    items: 0,
    maps: 5,
    trades: 0
  });
  const [communityActivity, setCommunityActivity] = useState({
    discussions: 0,
    builds: 0,
    activeTrades: 0
  });
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState('OPERACIONAL');

  useEffect(() => {
    loadRealStats();
    
    // Generar partículas iniciales
    const initialParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 10,
      size: 2 + Math.random() * 4
    }));
    setParticles(initialParticles);

    // Regenerar partículas periódicamente (reducido a cada 2 segundos)
    const particleInterval = setInterval(() => {
      setParticles(prev => {
        const newParticles = prev.slice(1);
        newParticles.push({
          id: Date.now(),
          x: Math.random() * 100,
          delay: 0,
          duration: 10 + Math.random() * 10,
          size: 2 + Math.random() * 4
        });
        return newParticles;
      });
    }, 2000);

    return () => clearInterval(particleInterval);
  }, []);

  const loadRealStats = async () => {
    try {
      const [statsRes, communityRes, tradesRes] = await Promise.all([
        fetch(`${API_URL}/stats`),
        fetch(`${API_URL}/community/stats`),
        fetch(`${API_URL}/marketplace/trades`)
      ]);

      const statsData = await statsRes.json();
      const communityData = await communityRes.json();
      const tradesData = await tradesRes.json();

      setStats({
        users: statsData.users || 0,
        items: (statsData.weapons || 0) + (statsData.items || 0),
        maps: 5,
        trades: tradesData.listings?.length || 0
      });

      setCommunityActivity({
        discussions: communityData.total_posts || 0,
        builds: communityData.categories?.build_guide || 0,
        activeTrades: tradesData.listings?.filter((l: any) => l.status === 'active').length || 0
      });

      setSystemStatus('OPERACIONAL');
    } catch (error) {
      console.error('Error loading stats:', error);
      setSystemStatus('ERROR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 5000); // Aumentado a 5 segundos
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleNavigate = (view: string) => {
    if (onNavigate) {
      onNavigate(view);
    }
  };

  const features = [
    {
      icon: Database,
      title: 'Base de Datos Completa',
      description: 'Accede a todos los datos de armas, items, enemigos y traders',
      color: 'from-red-500 to-yellow-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      action: () => handleNavigate('weapons'),
      link: 'Ver Database'
    },
    {
      icon: Map,
      title: 'Mapas Interactivos',
      description: 'Marca ubicaciones, tesoros y puntos estratégicos en mapas HD',
      color: 'from-green-500 to-blue-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      action: () => handleNavigate('maps'),
      link: 'Ver Mapas'
    },
    {
      icon: Users,
      title: 'Marketplace Seguro',
      description: 'Intercambia items con sistema de reputación y calificaciones',
      color: 'from-blue-500 to-yellow-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      action: () => handleNavigate('marketplace'),
      link: 'Ver Marketplace'
    },
  ];

  const statsDisplay = [
    { label: 'Usuarios Activos', value: loading ? '...' : stats.users >= 1000 ? `${(stats.users / 1000).toFixed(1)}K+` : `${stats.users}+`, icon: Users },
    { label: 'Items en DB', value: loading ? '...' : `${stats.items}+`, icon: Database },
    { label: 'Mapas HD', value: stats.maps.toString(), icon: Map },
    { label: 'Intercambios', value: loading ? '...' : `${stats.trades}+`, icon: TrendingUp },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background with Pulsing Blur Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* 3D Perspective Grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'linear-gradient(rgba(239,68,68,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(234,179,8,0.1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center center'
          }}
        ></div>
        
        {/* Pulsing Gradient Orbs - Arc Raiders Colors */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full bg-red-500/25 blur-[100px] animate-pulse-slow"
          style={{
            left: '10%',
            top: '-100px',
            animationDuration: '4s'
          }}
        ></div>
        <div 
          className="absolute w-[400px] h-[400px] rounded-full bg-yellow-500/20 blur-[100px] animate-pulse-slow"
          style={{
            right: '10%',
            top: '-50px',
            animationDuration: '5s',
            animationDelay: '1s'
          }}
        ></div>
        <div className="absolute top-0 right-[35%] w-[350px] h-[350px] rounded-full bg-green-500/15 blur-[90px] animate-pulse-slow" style={{ animationDuration: '6s' }}></div>
        
        {/* Additional orbs that follow mouse */}
        <div 
          className="absolute w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[80px] animate-pulse-slow"
          style={{
            left: `${20 + mousePosition.x / 100}%`,
            top: `${30 + mousePosition.y / 100}%`,
            animationDuration: '7s'
          }}
        ></div>
        
        {/* Floating Particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute bottom-0 rounded-full bg-yellow-400/40 animate-float-up"
            style={{
              left: `${particle.x}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)'
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 space-y-8 pb-8">
        {/* Hero Section with Giant Animated Title and Neon Glow */}
        <div className="text-center space-y-4 pt-8 px-4">

          {/* Giant Title - Arc Raiders Style */}
          <div className="space-y-4 px-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 to-blue-500 animate-gradient animate-slide-up relative"
                style={{
                  textShadow: '0 0 30px rgba(239, 68, 68, 0.3), 0 0 60px rgba(34, 197, 94, 0.2), 0 4px 12px rgba(0, 0, 0, 0.8)',
                  letterSpacing: '0.02em'
                }}>
                Don't shoot!
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s', textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}>
              La plataforma <span className="text-yellow-400 font-bold">definitiva</span> para comerciar tus productos de forma{' '}
              <span className="text-yellow-400 font-bold">
                segura
              </span>
            </p>
          </div>

          {/* CTA Buttons - Arc Raiders Style */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 animate-fade-in-up w-full px-4 sm:px-0" style={{ animationDelay: '0.5s' }}>
            <button 
              onClick={() => handleNavigate('weapons')}
              className="group relative w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 text-white font-bold text-sm rounded-lg overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] shimmer-effect"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Zap className="animate-pulse" size={18} />
                Explorar Ahora
                <ArrowRight className="group-hover:translate-x-1 transition-transform duration-300" size={18} />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute inset-0 shimmer"></div>
            </button>
            <button 
              onClick={() => handleNavigate('maps')}
              className="group w-full sm:w-auto px-6 py-3 bg-white/5 backdrop-blur-md border border-green-500/30 text-white font-bold text-sm rounded-lg hover:bg-green-500/10 hover:border-green-500/60 transition-all duration-300 hover:scale-105"
            >
              <span className="flex items-center justify-center gap-2">
                <Map className="text-green-400" size={18} />
                Ver Mapas
              </span>
            </button>
          </div>

          {/* Floating Stats with Smooth Transitions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 max-w-4xl mx-auto pt-6 px-4">
            {statsDisplay.map((stat, idx) => (
              <div
                key={idx}
                className="relative group animate-slide-in-stagger"
                style={{ animationDelay: `${0.7 + idx * 0.1}s` }}
              >
                <div className={`absolute inset-0 rounded-lg blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100 ${
                  idx === 0 ? 'bg-gradient-to-br from-red-500/20 to-yellow-500/20' :
                  idx === 1 ? 'bg-gradient-to-br from-yellow-500/20 to-green-500/20' :
                  idx === 2 ? 'bg-gradient-to-br from-green-500/20 to-blue-500/20' :
                  'bg-gradient-to-br from-blue-500/20 to-red-500/20'
                }`}></div>
                <div className={`relative bg-[#0a0e1a]/90 backdrop-blur-md rounded-lg p-3 transition-all duration-500 hover:scale-105 ${
                  idx === 0 ? 'border border-red-500/30 hover:border-red-500/60 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]' :
                  idx === 1 ? 'border border-yellow-500/30 hover:border-yellow-500/60 hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]' :
                  idx === 2 ? 'border border-green-500/30 hover:border-green-500/60 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]' :
                  'border border-blue-500/30 hover:border-blue-500/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                }`}>
                  <stat.icon className={`mx-auto mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300 ${
                    idx === 0 ? 'text-red-400' :
                    idx === 1 ? 'text-yellow-400' :
                    idx === 2 ? 'text-green-400' :
                    'text-blue-400'
                  }`} size={18} />
                  <p className={`text-lg sm:text-xl font-bold mb-1 ${
                    idx === 0 ? 'text-red-400' :
                    idx === 1 ? 'text-yellow-400' :
                    idx === 2 ? 'text-green-400' :
                    'text-blue-400'
                  }`}>{stat.value}</p>
                  <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid with Slide-In Animations */}
        <div className="px-4 max-w-7xl mx-auto">
          <div className="text-center mb-8 animate-fade-in-up">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Herramientas de{' '}
              <span className="bg-gradient-to-r from-red-500 via-yellow-400 via-green-400 to-blue-500 bg-clip-text text-transparent animate-gradient">
                Elite
              </span>
            </h2>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto">
              Arsenal completo para <span className="text-yellow-400 font-bold">dominar</span> Ark Market
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`group relative overflow-hidden rounded-xl border ${feature.borderColor} bg-gradient-to-br from-[#1a1f2e] to-[#0a0e1a] p-5 transition-all duration-500 hover:scale-105 cursor-pointer animate-slide-in-stagger ${
                  idx === 0 ? 'hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]' :
                  idx === 1 ? 'hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]' :
                  'hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]'
                } ${
                  activeFeature === idx ? `scale-[1.02] ${
                    idx === 0 ? 'shadow-[0_0_25px_rgba(239,68,68,0.3)] border-red-500/50' :
                    idx === 1 ? 'shadow-[0_0_25px_rgba(34,197,94,0.3)] border-green-500/50' :
                    'shadow-[0_0_25px_rgba(59,130,246,0.3)] border-blue-500/50'
                  }` : ''
                }`}
                style={{ animationDelay: `${1 + idx * 0.15}s` }}
                onClick={() => {
                  setActiveFeature(idx);
                  feature.action();
                }}
              >
                {/* Dynamic Glow on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 transition-all duration-500 blur-xl`}></div>
                
                {/* Shimmer Effect */}
                <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  {/* Icon with Glow */}
                  <div className={`inline-flex p-3 ${feature.bgColor} rounded-xl mb-3 group-hover:scale-110 transition-all duration-300`}>
                    <feature.icon className={`${
                      idx === 0 ? 'text-red-400' :
                      idx === 1 ? 'text-green-400' :
                      'text-blue-400'
                    }`} size={24} />
                  </div>
                  
                  {/* Content */}
                  <h3 className={`text-lg font-bold text-white mb-2 transition-colors duration-300 ${
                    idx === 0 ? 'group-hover:text-red-400' :
                    idx === 1 ? 'group-hover:text-green-400' :
                    'group-hover:text-blue-400'
                  }`}>
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed text-sm mb-4 group-hover:text-gray-300 transition-colors duration-300">
                    {feature.description}
                  </p>
                  
                  {/* Interactive Button */}
                  <button 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold group-hover:gap-3 transition-all duration-300 ${
                      idx === 0 ? 'bg-red-500/10 border border-red-500/30 text-red-400 group-hover:bg-red-500/20 group-hover:border-red-500/60' :
                      idx === 1 ? 'bg-green-500/10 border border-green-500/30 text-green-400 group-hover:bg-green-500/20 group-hover:border-green-500/60' :
                      'bg-blue-500/10 border border-blue-500/30 text-blue-400 group-hover:bg-blue-500/20 group-hover:border-blue-500/60'
                    }`}
                  >
                    <span>{feature.link}</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>

                {/* Corner Glow */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-br from-cyan-500/15 to-transparent rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="px-4 max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 border border-cyan-500/30 p-6 text-center backdrop-blur-sm">
            {/* Animated Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:30px_30px] animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-full mb-3">
                <Zap className="text-cyan-400" size={14} />
                <span className="text-xs text-cyan-400 font-medium">Únete a la Comunidad</span>
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                ¿Listo para dominar?
              </h2>
              <p className="text-sm text-gray-400 mb-4 max-w-xl mx-auto">
                Únete a miles de jugadores que ya están usando nuestras herramientas
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button 
                  onClick={() => handleNavigate('community')}
                  className="group px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-bold rounded-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] w-full sm:w-auto"
                >
                  <span className="flex items-center justify-center gap-2">
                    Únete a la Comunidad
                    <Target className="group-hover:rotate-90 transition-transform" size={16} />
                  </span>
                </button>
                <button 
                  onClick={() => handleNavigate('marketplace')}
                  className="px-5 py-2.5 bg-white/5 backdrop-blur-sm border border-white/20 text-white text-sm font-bold rounded-lg hover:bg-white/10 transition-all w-full sm:w-auto"
                >
                  Ver Marketplace
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Community Preview */}
        <div className="px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                Actividad de la Comunidad
              </h2>
              <p className="text-sm text-gray-500">Lo que está pasando ahora</p>
            </div>
            <button 
              onClick={() => handleNavigate('community')}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-all"
            >
              Ver Todo
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {[
              { icon: MessageSquare, title: 'Nuevas Discusiones', count: loading ? '...' : communityActivity.discussions.toString(), color: 'cyan', action: () => handleNavigate('community') },
              { icon: Shield, title: 'Builds Compartidos', count: loading ? '...' : communityActivity.builds.toString(), color: 'purple', action: () => handleNavigate('community') },
              { icon: Crosshair, title: 'Intercambios Activos', count: loading ? '...' : communityActivity.activeTrades.toString(), color: 'emerald', action: () => handleNavigate('marketplace') },
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={item.action}
                className={`group relative overflow-hidden rounded-lg bg-gradient-to-br from-[#1a1f2e] to-[#0a0e1a] border border-${item.color}-500/20 p-4 hover:border-${item.color}-500/40 transition-all hover:scale-105 cursor-pointer`}
              >
                <div className="flex items-center justify-between mb-2">
                  <item.icon className={`text-${item.color}-400`} size={20} />
                  <span className={`text-xl font-bold text-${item.color}-400`}>
                    {item.count}
                  </span>
                </div>
                <p className="text-white text-sm font-medium">{item.title}</p>
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-${item.color}-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        /* Gradient Animation */
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease infinite;
        }

        /* Floating Particles */
        @keyframes float-up {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-100vh) translateX(calc(var(--random-x, 0) * 50px));
            opacity: 0;
          }
        }
        .animate-float-up {
          animation: float-up linear infinite;
        }

        /* Pulse Slow */
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow ease-in-out infinite;
        }

        /* Neon Glow Text */
        .neon-glow-text {
          text-shadow: 
            0 0 10px rgba(6, 182, 212, 0.4),
            0 0 20px rgba(6, 182, 212, 0.2);
        }
        .neon-glow-white {
          text-shadow: 
            0 0 10px rgba(6, 182, 212, 0.3);
        }
        .neon-text {
          text-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
        }

        /* Neon Flicker Effect */
        @keyframes flicker {
          0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% {
            opacity: 1;
            text-shadow: 
              0 0 10px rgba(6, 182, 212, 0.8),
              0 0 20px rgba(6, 182, 212, 0.6);
          }
          20%, 24%, 55% {
            opacity: 0.8;
            text-shadow: none;
          }
        }
        .neon-flicker {
          animation: flicker 3s linear infinite;
        }

        /* Slide Animations */
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.8s ease-out;
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
          opacity: 0;
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }

        /* Staggered Slide In */
        @keyframes slide-in-stagger {
          from {
            opacity: 0;
            transform: translateX(-50px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        .animate-slide-in-stagger {
          animation: slide-in-stagger 0.8s ease-out forwards;
          opacity: 0;
        }

        /* Shimmer Effect */
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(6, 182, 212, 0.1) 40%,
            rgba(6, 182, 212, 0.3) 50%,
            rgba(6, 182, 212, 0.1) 60%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }
        .shimmer-effect {
          position: relative;
          overflow: hidden;
        }
        .shimmer-effect::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          animation: shimmer 2s infinite;
        }

        /* Pulse Glow */
        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.5;
            filter: blur(20px);
          }
          50% {
            opacity: 1;
            filter: blur(30px);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        /* Smooth Transitions */
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}

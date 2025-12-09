import { useState } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  ShoppingCart, 
  Users, 
  Heart,
  Package,
  TrendingUp,
  Shield,
  Search,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Star,
  Bell,
  Map,
  ChevronDown,
  ChevronUp,
  PlayCircle
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  color: string;
  description: string;
  steps: Array<{
    title: string;
    description: string;
    tip?: string;
  }>;
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export default function HelpGuide() {
  const [activeGuide, setActiveGuide] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const guides: GuideSection[] = [
    {
      id: 'marketplace',
      title: 'Cómo usar el Marketplace',
      icon: ShoppingCart,
      color: 'from-blue-500 to-cyan-500',
      description: 'Aprende a intercambiar items con otros jugadores',
      steps: [
        {
          title: '1. Publica tus items',
          description: 'Ve a Marketplace y haz clic en "Crear Listing". Selecciona el item que quieres intercambiar, agrega una descripción y especifica qué items aceptas a cambio.',
          tip: 'Sé específico sobre qué items aceptas para recibir ofertas relevantes'
        },
        {
          title: '2. Busca lo que necesitas',
          description: 'Usa la búsqueda y filtros para encontrar items que necesites. Puedes filtrar por tipo, rareza y usuario.',
          tip: 'Agrega items a tu Wishlist (en My Profile) para recibir notificaciones cuando alguien los publique'
        },
        {
          title: '3. Envía ofertas',
          description: 'Cuando encuentres algo que te interese, haz clic en "Hacer Oferta". Selecciona los items que ofreces a cambio.',
          tip: 'Recuerda: no usamos dinero, solo intercambio de items (trueque)'
        },
        {
          title: '4. Gestiona tus ofertas',
          description: 'En "My Offers" puedes ver todas tus ofertas enviadas y recibidas. Acepta, rechaza o contraoferta según te convenga.',
          tip: 'Responde rápido a las ofertas para mantener buena reputación'
        },
        {
          title: '5. Completa el trade',
          description: 'Una vez aceptada la oferta, coordina con el otro jugador en el chat para completar el intercambio en el juego.',
          tip: 'Después del trade, califica al usuario para ayudar a la comunidad'
        }
      ]
    },
    {
      id: 'messages',
      title: 'Cómo usar el Chat',
      icon: MessageSquare,
      color: 'from-green-500 to-emerald-500',
      description: 'Comunícate en tiempo real con otros jugadores',
      steps: [
        {
          title: '1. Inicia una conversación',
          description: 'Haz clic en el ícono de búsqueda en Messages y busca al usuario con quien quieres hablar. También puedes hacer clic en un usuario desde el panel de "Online Users".',
          tip: 'Los mensajes se entregan en tiempo real cuando el usuario está conectado'
        },
        {
          title: '2. Envía mensajes',
          description: 'Escribe tu mensaje y presiona Enter o el botón de enviar. Verás un indicador de "escribiendo..." cuando el otro usuario esté escribiendo.',
          tip: 'Puedes ver el estado del usuario (online/away/busy/dnd) junto a su nombre'
        },
        {
          title: '3. Gestiona conversaciones',
          description: 'Todas tus conversaciones se guardan en el panel izquierdo. Los mensajes no leídos aparecen resaltados.',
          tip: 'Los mensajes se marcan como leídos automáticamente cuando los ves'
        },
        {
          title: '4. Notificaciones',
          description: 'Recibirás notificaciones de escritorio cuando lleguen mensajes nuevos (si las activaste en la configuración).',
          tip: 'Activa el sonido en el ícono de campana para escuchar cuando lleguen mensajes'
        }
      ]
    },
    {
      id: 'community',
      title: 'Community Hub',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      description: 'Participa en la comunidad de jugadores',
      steps: [
        {
          title: '1. Lee y crea posts',
          description: 'Explora posts de otros jugadores sobre noticias, guías, builds y discusiones. Haz clic en "Crear Post" para compartir tu contenido.',
          tip: 'Usa categorías apropiadas para que otros encuentren tu contenido fácilmente'
        },
        {
          title: '2. Comenta y da likes',
          description: 'Interactúa con la comunidad dando likes y comentando en los posts que te interesen.',
          tip: 'Los comentarios constructivos ayudan a crear una mejor comunidad'
        },
        {
          title: '3. Sigue el Activity Feed',
          description: 'En Activity Feed verás las últimas actividades de la comunidad: nuevos trades, posts populares, etc.',
          tip: 'Filtra por categoría para ver solo el contenido que te interesa'
        }
      ]
    },
    {
      id: 'profile',
      title: 'Tu Perfil y Wishlist',
      icon: Heart,
      color: 'from-yellow-500 to-orange-500',
      description: 'Gestiona tu perfil y lista de deseos',
      steps: [
        {
          title: '1. Revisa tus estadísticas',
          description: 'En My Profile > Estadísticas puedes ver todos tus trades, posts, reputación y actividad reciente.',
          tip: 'Una buena reputación te ayuda a conseguir mejores trades'
        },
        {
          title: '2. Crea tu Wishlist',
          description: 'En la pestaña Wishlist, agrega los items que estás buscando. Especifica detalles y precio máximo.',
          tip: 'Activa notificaciones para recibir alertas cuando alguien publique esos items'
        },
        {
          title: '3. Edita tu perfil',
          description: 'Personaliza tu avatar, bio y enlaces desde el menú de usuario en el header.',
          tip: 'Un perfil completo genera más confianza en la comunidad'
        }
      ]
    },
    {
      id: 'database',
      title: 'Base de Datos del Juego',
      icon: Package,
      color: 'from-red-500 to-orange-500',
      description: 'Consulta información sobre items, armas y enemigos',
      steps: [
        {
          title: '1. Explora categorías',
          description: 'Navega por Weapons, Armor, Items, Enemies para ver información detallada de cada elemento del juego.',
          tip: 'Usa los filtros para encontrar rápidamente lo que buscas'
        },
        {
          title: '2. Compara stats',
          description: 'Compara diferentes armas, armaduras o items para tomar mejores decisiones sobre qué usar.',
          tip: 'Fíjate en las rarezas y stats especiales de cada item'
        },
        {
          title: '3. Usa los mapas',
          description: 'En la sección Maps puedes ver mapas interactivos y agregar tus propios marcadores de ubicaciones importantes.',
          tip: 'Guarda ubicaciones de loot, misiones o puntos de interés para referencia futura'
        }
      ]
    }
  ];

  const faqs: FAQ[] = [
        {
          category: 'general',
          question: '¿Cómo descargo la app en Android y iOS?',
          answer: 'Para Android: abre Google Play Store y busca "Arc Raiders Community". Para iOS: abre App Store y busca "Arc Raiders Community". Descarga e instala la app oficial. Si no la encuentras, puedes usar la versión web desde tu navegador móvil.'
        },
    {
      category: 'trading',
      question: '¿Cómo funciona el sistema de trading?',
      answer: 'El trading funciona mediante trueque (intercambio de items). No usamos dinero real ni moneda del juego. Publicas lo que tienes, especificas qué aceptas a cambio, y otros usuarios te envían ofertas con sus items.'
    },
    {
      category: 'trading',
      question: '¿Puedo cancelar una oferta después de enviarla?',
      answer: 'No directamente, pero puedes contactar al usuario por mensaje y pedir que la rechace. Es mejor pensar bien antes de enviar ofertas.'
    },
    {
      category: 'trading',
      question: '¿Cómo completo un trade en el juego?',
      answer: 'Una vez que ambos acepten la oferta en la plataforma, deben coordinarse por mensaje para encontrarse en el juego y completar el intercambio físicamente.'
    },
    {
      category: 'trading',
      question: '¿Qué pasa si alguien no cumple con un trade?',
      answer: 'Puedes calificar negativamente al usuario y reportar el incidente. Los usuarios con mala reputación son visibles para toda la comunidad.'
    },
    {
      category: 'messages',
      question: '¿Los mensajes son en tiempo real?',
      answer: 'Sí, usamos WebSockets para mensajería en tiempo real. Si el otro usuario está online, recibirá tu mensaje instantáneamente.'
    },
    {
      category: 'messages',
      question: '¿Se guardan mis conversaciones?',
      answer: 'Sí, todas tus conversaciones se guardan automáticamente. Puedes volver a ellas en cualquier momento desde el panel de Messages.'
    },
    {
      category: 'messages',
      question: '¿Puedo saber si leyeron mi mensaje?',
      answer: 'Sí, verás un indicador de "leído" cuando el destinatario haya visto tu mensaje.'
    },
    {
      category: 'account',
      question: '¿Cómo mejoro mi reputación?',
      answer: 'Completa trades exitosamente, sé activo en la comunidad, responde rápido a mensajes y ofertas, y mantén una actitud positiva. Otros usuarios te calificarán después de hacer trades.'
    },
    {
      category: 'account',
      question: '¿Puedo cambiar mi nombre de usuario?',
      answer: 'Actualmente no se puede cambiar el nombre de usuario. Elige bien cuando te registres.'
    },
    {
      category: 'account',
      question: '¿Para qué sirve la Wishlist?',
      answer: 'La Wishlist te permite anotar los items que buscas. Puedes activar notificaciones para recibir alertas cuando alguien publique esos items en el Marketplace.'
    },
    {
      category: 'general',
      question: '¿La plataforma es oficial del juego?',
      answer: 'No, somos una plataforma comunitaria independiente creada por jugadores para jugadores. No estamos afiliados con los desarrolladores de ARC RAIDERS.'
    },
    {
      category: 'general',
      question: '¿Es seguro usar esta plataforma?',
      answer: 'Tomamos la seguridad muy en serio. Tus datos están protegidos y nunca compartimos información personal. Sin embargo, siempre ten precaución al hacer trades en el juego.'
    },
    {
      category: 'general',
      question: '¿Cuál es la diferencia entre Activity Feed y Community Hub?',
      answer: 'Activity Feed muestra actividad reciente de toda la plataforma (trades, posts nuevos, etc.). Community Hub es para crear y leer posts detallados con discusiones.'
    }
  ];

  const categories = [
    { id: 'all', label: 'Todas', icon: HelpCircle },
    { id: 'trading', label: 'Trading', icon: ShoppingCart },
    { id: 'messages', label: 'Mensajes', icon: MessageSquare },
    { id: 'account', label: 'Cuenta', icon: Users },
    { id: 'general', label: 'General', icon: AlertCircle }
  ];

  const filteredFAQs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Guía de Uso & FAQ
          </h1>
          <p className="text-gray-400 mt-1">
            Aprende a usar todas las funciones de la plataforma
          </p>
        </div>
      </div>

      {/* Quick Tips Banner */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <Star className="text-cyan-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-cyan-400 mb-1">💡 Tip Rápido</h3>
            <p className="text-gray-300 text-sm">
              <strong>¿Primera vez aquí?</strong> Te recomendamos comenzar por completar tu perfil, 
              agregar items a tu Wishlist, y explorar el Marketplace para familiarizarte con el sistema de trading.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Guides Grid */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <PlayCircle className="text-cyan-400" size={24} />
          Guías Interactivas
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((guide) => {
            const Icon = guide.icon;
            const isActive = activeGuide === guide.id;
            
            return (
              <div key={guide.id}>
                <button
                  onClick={() => setActiveGuide(isActive ? null : guide.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-gradient-to-br ' + guide.color + '/20 border-current'
                      : 'bg-[#1a1f2e] border-gray-700/30 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${guide.color} bg-opacity-20`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">{guide.title}</h3>
                      <p className="text-sm text-gray-400">{guide.description}</p>
                    </div>
                    <ChevronDown 
                      className={`text-gray-400 transition-transform ${isActive ? 'rotate-180' : ''}`}
                      size={20} 
                    />
                  </div>
                </button>

                {isActive && (
                  <div className="mt-2 p-4 bg-[#0f1420] border border-gray-700/30 rounded-lg space-y-4 animate-in slide-in-from-top">
                    {guide.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">{step.title}</h4>
                          <p className="text-sm text-gray-400 mb-2">{step.description}</p>
                          {step.tip && (
                            <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs">
                              <AlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" size={14} />
                              <span className="text-yellow-300">{step.tip}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQs Section */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="text-purple-400" size={24} />
          Preguntas Frecuentes
        </h2>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeCategory === cat.id
                    ? 'bg-purple-500/20 border-2 border-purple-500/50 text-purple-400'
                    : 'bg-[#1a1f2e] border border-gray-700/30 text-gray-400 hover:border-gray-600'
                }`}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQs List */}
        <div className="space-y-3">
          {filteredFAQs.map((faq, index) => {
            const isExpanded = expandedFAQ === index;
            
            return (
              <div
                key={index}
                className="bg-[#1a1f2e] border border-gray-700/30 rounded-lg overflow-hidden hover:border-gray-600 transition-all"
              >
                <button
                  onClick={() => setExpandedFAQ(isExpanded ? null : index)}
                  className="w-full p-4 flex items-center justify-between text-left"
                >
                  <span className="font-medium text-white pr-4">{faq.question}</span>
                  <ChevronDown 
                    className={`text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    size={20} 
                  />
                </button>
                
                {isExpanded && (
                  <div className="px-4 pb-4 pt-0">
                    <div className="p-3 bg-[#0f1420] border border-gray-700/30 rounded-lg">
                      <p className="text-gray-300 text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Help Section */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <MessageSquare className="text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">¿Necesitas más ayuda?</h3>
              <p className="text-gray-400 text-sm">
                Si no encuentras la respuesta que buscas, pregunta en Community Hub o envía un mensaje a un moderador.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'community' }))}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all whitespace-nowrap"
          >
            Ir a Community
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

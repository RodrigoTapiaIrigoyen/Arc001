import { useState, useEffect } from 'react';
import { 
  User, 
  TrendingUp, 
  Heart, 
  Package, 
  Star, 
  MessageSquare, 
  Award,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  X,
  Search,
  Trash2,
  Bell,
  BellOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../lib/api';

interface WishlistItem {
  _id: string;
  itemName: string;
  itemType: 'weapon' | 'armor' | 'item';
  rarity?: string;
  description?: string;
  maxPrice?: string;
  notifyOnAvailable: boolean;
  createdAt: string;
}

interface UserStats {
  totalTrades: number;
  completedTrades: number;
  activeTrades: number;
  rejectedTrades: number;
  totalPosts: number;
  totalComments: number;
  reputation: {
    averageRating: number;
    totalRatings: number;
    positiveRatings: number;
    neutralRatings: number;
    negativeRatings: number;
  };
  joinedDate: string;
  lastActive: string;
}

interface RecentActivity {
  type: 'trade' | 'post' | 'comment' | 'rating';
  description: string;
  timestamp: string;
  status?: string;
}

export default function MyProfile({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'stats' | 'wishlist'>('stats');
  const [stats, setStats] = useState<UserStats | null>(null);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWishlist, setShowAddWishlist] = useState(false);
  
  // Form states
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState<'weapon' | 'armor' | 'item'>('weapon');
  const [description, setDescription] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [notifyOnAvailable, setNotifyOnAvailable] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadWishlist(),
        loadRecentActivity()
      ]);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/users/my-stats');
      setStats(response.stats);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const loadWishlist = async () => {
    try {
      const response = await api.get('/wishlist');
      setWishlist(response.wishlist || []);
    } catch (error: any) {
      console.error('Error loading wishlist:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const response = await api.get('/users/recent-activity');
      setRecentActivity(response.activity || []);
    } catch (error: any) {
      console.error('Error loading activity:', error);
    }
  };

  const handleAddWishlistItem = async () => {
    if (!itemName.trim()) {
      toast.error('El nombre del item es requerido');
      return;
    }

    try {
      await api.post('/wishlist', {
        itemName: itemName.trim(),
        itemType,
        description: description.trim(),
        maxPrice: maxPrice.trim(),
        notifyOnAvailable
      });

      toast.success('Item agregado a tu wishlist');
      setShowAddWishlist(false);
      resetForm();
      loadWishlist();
    } catch (error: any) {
      toast.error(error.message || 'Error al agregar item');
    }
  };

  const handleRemoveWishlistItem = async (itemId: string) => {
    try {
      await api.delete(`/wishlist/${itemId}`);
      toast.success('Item eliminado de tu wishlist');
      loadWishlist();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar item');
    }
  };

  const handleToggleNotification = async (itemId: string, currentValue: boolean) => {
    try {
      await api.patch(`/wishlist/${itemId}`, {
        notifyOnAvailable: !currentValue
      });
      toast.success(currentValue ? 'Notificaciones desactivadas' : 'Notificaciones activadas');
      loadWishlist();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar notificaciones');
    }
  };

  const resetForm = () => {
    setItemName('');
    setItemType('weapon');
    setDescription('');
    setMaxPrice('');
    setNotifyOnAvailable(true);
  };

  const getRarityColor = (rarity?: string) => {
    const colors: Record<string, string> = {
      'common': 'text-gray-400',
      'uncommon': 'text-green-400',
      'rare': 'text-blue-400',
      'epic': 'text-purple-400',
      'legendary': 'text-yellow-400',
    };
    return colors[rarity?.toLowerCase() || 'common'];
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'trade': return <Package className="text-blue-400" size={16} />;
      case 'post': return <MessageSquare className="text-green-400" size={16} />;
      case 'comment': return <MessageSquare className="text-cyan-400" size={16} />;
      case 'rating': return <Star className="text-yellow-400" size={16} />;
      default: return <Award className="text-gray-400" size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Mi Perfil
          </h1>
          <p className="text-gray-400 mt-1">
            Tus estadísticas y lista de deseos
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-yellow-500/20 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'stats'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={18} />
            Estadísticas
          </div>
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`px-6 py-3 font-medium transition-all ${
            activeTab === 'wishlist'
              ? 'text-yellow-400 border-b-2 border-yellow-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Heart size={18} />
            Wishlist
            {wishlist.length > 0 && (
              <span className="px-2 py-0.5 bg-yellow-500/20 rounded-full text-xs">
                {wishlist.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Package className="text-blue-400" size={20} />
                <span className="text-2xl font-bold text-blue-400">{stats.totalTrades}</span>
              </div>
              <p className="text-sm text-gray-300">Total Trades</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <ArrowUpRight className="text-green-400" size={20} />
                <span className="text-2xl font-bold text-green-400">{stats.completedTrades}</span>
              </div>
              <p className="text-sm text-gray-300">Completados</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="text-yellow-400" size={20} />
                <span className="text-2xl font-bold text-yellow-400">{stats.totalPosts}</span>
              </div>
              <p className="text-sm text-gray-300">Posts</p>
            </div>
            
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Star className="text-purple-400" size={20} />
                <span className="text-2xl font-bold text-purple-400">
                  {stats.reputation.averageRating.toFixed(1)}
                </span>
              </div>
              <p className="text-sm text-gray-300">Rating</p>
            </div>
          </div>

          {/* Reputation Details */}
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-yellow-500/20 rounded-lg p-6">
            <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <Award size={20} />
              Reputación
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Rating Promedio</span>
                  <span className="text-2xl font-bold text-yellow-400">
                    {stats.reputation.averageRating.toFixed(1)} / 5.0
                  </span>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Positivas</span>
                    <span className="text-green-400 font-medium">
                      {stats.reputation.positiveRatings} ({stats.reputation.totalRatings > 0 ? ((stats.reputation.positiveRatings / stats.reputation.totalRatings) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Neutrales</span>
                    <span className="text-gray-400 font-medium">
                      {stats.reputation.neutralRatings} ({stats.reputation.totalRatings > 0 ? ((stats.reputation.neutralRatings / stats.reputation.totalRatings) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Negativas</span>
                    <span className="text-red-400 font-medium">
                      {stats.reputation.negativeRatings} ({stats.reputation.totalRatings > 0 ? ((stats.reputation.negativeRatings / stats.reputation.totalRatings) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Total Ratings</span>
                  <span className="text-xl font-bold text-white">
                    {stats.reputation.totalRatings}
                  </span>
                </div>
                
                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="text-sm text-gray-400">
                      Miembro desde: {new Date(stats.joinedDate).toLocaleDateString('es-ES', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-yellow-500/20 rounded-lg p-6">
              <h3 className="text-xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                Actividad Reciente
              </h3>
              
              <div className="space-y-3">
                {recentActivity.slice(0, 10).map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 bg-[#0a0e1a] border border-gray-700/30 rounded-lg"
                  >
                    <div className="mt-0.5">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-300">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString('es-ES')}
                      </p>
                    </div>
                    {activity.status && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        activity.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        activity.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Wishlist Tab */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          {/* Add Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddWishlist(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
            >
              <Plus size={18} />
              Agregar Item
            </button>
          </div>

          {/* Wishlist Items */}
          {wishlist.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-yellow-400" size={32} />
              </div>
              <p className="text-gray-400 mb-4">Tu wishlist está vacía</p>
              <p className="text-sm text-gray-500">Agrega items que estés buscando para intercambiar</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {wishlist.map((item) => (
                <div
                  key={item._id}
                  className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-yellow-500/20 rounded-lg p-4 hover:border-yellow-500/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{item.itemName}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          item.itemType === 'weapon' ? 'bg-red-500/20 text-red-400' :
                          item.itemType === 'armor' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {item.itemType}
                        </span>
                      </div>
                      
                      {item.description && (
                        <p className="text-sm text-gray-400 mb-2">{item.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {item.maxPrice && (
                          <span>Max: {item.maxPrice}</span>
                        )}
                        <span>
                          Agregado: {new Date(item.createdAt).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleNotification(item._id, item.notifyOnAvailable)}
                        className={`p-2 rounded-lg transition-all ${
                          item.notifyOnAvailable
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
                        }`}
                        title={item.notifyOnAvailable ? 'Notificaciones activas' : 'Notificaciones desactivadas'}
                      >
                        {item.notifyOnAvailable ? <Bell size={18} /> : <BellOff size={18} />}
                      </button>
                      
                      <button
                        onClick={() => handleRemoveWishlistItem(item._id)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Wishlist Modal */}
      {showAddWishlist && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1420] border border-yellow-500/30 rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-yellow-400">Agregar a Wishlist</h3>
              <button
                onClick={() => {
                  setShowAddWishlist(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre del Item *
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ej: AK-47, Kevlar Vest, Medkit"
                  className="w-full px-4 py-3 bg-[#1a1f2e] border border-yellow-500/20 rounded-lg text-white focus:border-yellow-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo
                </label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-[#1a1f2e] border border-yellow-500/20 rounded-lg text-white focus:border-yellow-500/50 focus:outline-none"
                >
                  <option value="weapon">Weapon</option>
                  <option value="armor">Armor</option>
                  <option value="item">Item</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles específicos que buscas..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[#1a1f2e] border border-yellow-500/20 rounded-lg text-white focus:border-yellow-500/50 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Precio Máximo (opcional)
                </label>
                <input
                  type="text"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Ej: 5 items comunes, 2 items raros"
                  className="w-full px-4 py-3 bg-[#1a1f2e] border border-yellow-500/20 rounded-lg text-white focus:border-yellow-500/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify"
                  checked={notifyOnAvailable}
                  onChange={(e) => setNotifyOnAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-yellow-500/30"
                />
                <label htmlFor="notify" className="text-sm text-gray-300">
                  Notificarme cuando alguien ofrezca este item
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddWishlistItem}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all"
                >
                  Agregar
                </button>
                <button
                  onClick={() => {
                    setShowAddWishlist(false);
                    resetForm();
                  }}
                  className="px-4 py-3 bg-gray-700/50 text-gray-300 font-medium rounded-lg hover:bg-gray-700/70 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  MessageSquare,
  Send,
  Plus,
  Clock,
  X,
  ArrowLeftRight,
  Star,
  User,
  Check,
  AlertCircle,
  Award,
  TrendingUp
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import OffersModal from './OffersModal';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/marketplace`;

interface ItemImage {
  name: string;
  image?: string;
  icon?: string;
  shortName?: string;
  type?: string;
}

export default function MarketplaceNew() {
  const [activeTab, setActiveTab] = useState<'trading' | 'discussions'>('trading');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [currentUser] = useState(() => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  });
  
  // Trading states
  const [listings, setListings] = useState<any[]>([]);
  const [showNewListing, setShowNewListing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<ItemImage | null>(null);
  
  // Offer states
  const [offers, setOffers] = useState<any[]>([]);
  const [newOfferText, setNewOfferText] = useState('');
  const [newOfferItems, setNewOfferItems] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [selectedListingForOffers, setSelectedListingForOffers] = useState<any>(null);
  
  // Rating states
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingData, setRatingData] = useState({
    transaction_id: '',
    rated_user: '',
    rating: 5,
    comment: '',
    trade_completed: true
  });
  const [userStats, setUserStats] = useState<any>(null);

  // New listing form states
  const [newListingOffering, setNewListingOffering] = useState('');
  const [newListingLookingFor, setNewListingLookingFor] = useState('');
  const [newListingDescription, setNewListingDescription] = useState('');
  const [listingImageData, setListingImageData] = useState<string | null>(null);

  const loadListings = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/trades`);
      const data = await response.json();
      setListings(data.listings || []);
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  }, []);

  const loadOffers = async (listingId: string) => {
    try {
      const response = await fetch(`${API_URL}/trades/${listingId}/offers`);
      const data = await response.json();
      setOffers(data || []);
    } catch (error) {
      console.error('Error loading offers:', error);
    }
  };

  const loadUserStats = async (username: string) => {
    try {
      const response = await fetch(`${API_URL}/users/${username}/stats`);
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleListingImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no puede superar los 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setListingImageData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const searchItems = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching items:', error);
    }
  };

  const createListing = async () => {
    if (!newListingOffering || !newListingLookingFor) return;
    if (!currentUser) {
      alert('Debes iniciar sesión para crear un listing');
      return;
    }

    try {
      const body: any = {
        offering: newListingOffering,
        looking_for: newListingLookingFor,
        description: newListingDescription,
        username: currentUser.username,
      };

      if (selectedItem) {
        const itemType = selectedItem.type || 'item';
        body.item_name = selectedItem.name;
        body.item_type = itemType;
      }

      // Agregar imagen del artículo (subida por usuario o de la base de datos)
      body.item_image = listingImageData || selectedItem?.image || '';
      
      await api.post('/marketplace/trades', body);
      
      toast.success('Listing creado exitosamente');
      setShowNewListing(false);
      setSelectedItem(null);
      setNewListingOffering('');
      setNewListingLookingFor('');
      setNewListingDescription('');
      setListingImageData(null);
      loadListings();
    } catch (error: any) {
      console.error('Error creating listing:', error);
      toast.error(error.message || 'Error al crear listing');
    }
  };

  const createOffer = async (listingId: string) => {
    if (!newOfferText.trim()) return;
    if (!currentUser) {
      alert('Debes iniciar sesión para hacer una oferta');
      return;
    }

    try {
      await api.post(`/marketplace/trades/${listingId}/offers`, {
        trader_name: currentUser.username,
        offer_user: currentUser.username,
        offer_text: newOfferText,
        offer_items: newOfferItems.split(',').map(i => i.trim()).filter(Boolean)
      });

      toast.success('Oferta enviada exitosamente');
      setNewOfferText('');
      setNewOfferItems('');
      loadOffers(listingId);
      loadListings();
    } catch (error: any) {
      console.error('Error creating offer:', error);
      toast.error(error.message || 'Error al enviar oferta');
    }
  };

  const replyToOffer = async (offerId: string) => {
    if (!replyText.trim()) return;
    if (!currentUser) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/marketplace/offers/${offerId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply_user: currentUser.username,
          reply_text: replyText
        }),
      });

      if (response.ok) {
        setReplyText('');
        setReplyingTo(null);
        if (selectedListing) {
          loadOffers(selectedListing._id);
        }
      }
    } catch (error) {
      console.error('Error replying to offer:', error);
    }
  };

  const acceptOffer = async (offerId: string) => {
    if (!currentUser) return;
    
    const confirmed = window.confirm('¿Confirmas que quieres aceptar esta oferta? Esto completará el trade y podrán calificarse mutuamente.');
    if (!confirmed) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/marketplace/offers/${offerId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_owner: currentUser.username
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setSelectedListing(null);
        loadListings();
        
        // Mostrar modal de calificación
        setRatingData({
          transaction_id: result.transaction._id,
          rated_user: result.transaction.buyer,
          rating: 5,
          comment: '',
          trade_completed: true
        });
        setShowRatingModal(true);
      }
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  };

  const submitRating = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/marketplace/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ratingData,
          rater_user: currentUser.username
        }),
      });

      if (response.ok) {
        alert('¡Gracias por tu calificación!');
        setShowRatingModal(false);
        setRatingData({
          transaction_id: '',
          rated_user: '',
          rating: 5,
          comment: '',
          trade_completed: true
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Error al enviar calificación');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const getReputationColor = (reputation: string) => {
    const colors: any = {
      'Nuevo': 'text-gray-400',
      'Principiante': 'text-blue-400',
      'Confiable': 'text-green-400',
      'Veterano': 'text-purple-400',
      'Élite': 'text-yellow-400',
      'Leyenda': 'text-red-400'
    };
    return colors[reputation] || 'text-gray-400';
  };

  const getReputationIcon = (reputation: string) => {
    if (reputation === 'Leyenda' || reputation === 'Élite') return <Award size={16} />;
    if (reputation === 'Veterano' || reputation === 'Confiable') return <TrendingUp size={16} />;
    return <User size={16} />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Marketplace
        </h1>
        <p className="text-gray-400 mt-1">
          Intercambia items con seguridad y construye tu reputación
        </p>
      </div>

      {/* User info if logged in */}
      {currentUser && (
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <User className="text-cyan-400" size={20} />
              </div>
              <div>
                <p className="text-white font-medium">{currentUser.username}</p>
                <p className="text-sm text-gray-400">Sesión activa</p>
              </div>
            </div>
            <button
              onClick={() => loadUserStats(currentUser.username)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm"
            >
              Ver mi reputación
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-cyan-500/20">
        <button
          onClick={() => setActiveTab('trading')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'trading'
              ? 'text-cyan-400'
              : 'text-gray-400 hover:text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={20} />
            Intercambio de Items
          </div>
          {activeTab === 'trading' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
          )}
        </button>
      </div>

      {/* Trading Tab */}
      {activeTab === 'trading' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0a0e1a] border border-cyan-500/20 rounded-lg p-6">
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input
                  type="text"
                  placeholder="Buscar armas, items, traders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchItems()}
                  className="w-full pl-10 pr-4 py-3 bg-[#0a0e1a] border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <button
                onClick={searchItems}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors"
              >
                Buscar
              </button>
            </div>

            {searchResults && (
              <div className="space-y-4">
                {Object.entries(searchResults).map(([type, items]: [string, any]) => (
                  items.length > 0 && (
                    <div key={type}>
                      <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase">
                        {type} ({items.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map((item: any) => (
                          <div
                            key={item._id || item.id}
                            onClick={() => {
                              setSelectedItem({
                                name: item.name,
                                image: item.image,
                                icon: item.icon,
                                shortName: item.shortName,
                                type: type.slice(0, -1)
                              });
                              setShowNewListing(true);
                            }}
                            className="p-4 bg-[#0a0e1a] border border-cyan-500/10 rounded-lg hover:border-cyan-500/30 transition-all cursor-pointer group"
                          >
                            <div className="flex items-start gap-3">
                              {item.image && (
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-12 h-12 object-contain rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                                  {item.name}
                                </p>
                                {item.shortName && (
                                  <p className="text-xs text-gray-500 mt-1">{item.shortName}</p>
                                )}
                              </div>
                              <Plus className="text-gray-600 group-hover:text-cyan-400 transition-colors" size={20} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Active Listings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Intercambios Activos</h3>
              <button
                onClick={() => {
                  if (!currentUser) {
                    alert('Debes iniciar sesión para crear un listing');
                    return;
                  }
                  setSelectedItem(null);
                  setShowNewListing(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={18} />
                Nuevo Intercambio
              </button>
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-12 bg-[#1a1f2e]/50 border border-gray-700/30 rounded-lg">
                <ArrowLeftRight className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No hay intercambios activos. ¡Sé el primero en publicar!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {listings.map((listing) => (
                  <div
                    key={listing._id}
                    onClick={() => {
                      setSelectedListing(listing);
                      loadOffers(listing._id);
                      if (listing.username) {
                        loadUserStats(listing.username);
                      }
                    }}
                    className="bg-gradient-to-br from-[#1a1f2e] to-[#0a0e1a] border border-cyan-500/20 rounded-lg p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      {listing.item_image && (
                        <img 
                          src={listing.item_image} 
                          alt={listing.item_name || 'Item'} 
                          className="w-20 h-20 object-contain rounded-lg border border-cyan-500/20 bg-[#0a0e1a] flex-shrink-0"
                        />
                      )}
                      {!listing.item_image && (
                        <ArrowLeftRight className="text-cyan-400 mt-1 flex-shrink-0" size={24} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          {listing.item_name && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              {listing.item_name}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs ${
                            listing.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {listing.status === 'active' ? 'Activo' : listing.status === 'completed' ? 'Completado' : 'Cancelado'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Ofrece:</p>
                            <p className="text-white font-medium truncate">{listing.offering}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Busca:</p>
                            <p className="text-cyan-400 font-medium truncate">{listing.looking_for}</p>
                          </div>
                        </div>

                        {listing.description && (
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{listing.description}</p>
                        )}

                        <div className="flex items-center justify-between gap-4 text-sm flex-wrap mt-3">
                          <div className="flex items-center gap-4 text-gray-500">
                            <span className="flex items-center gap-1 text-cyan-400">
                              <User size={16} />
                              {listing.username || 'Anónimo'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={16} />
                              {formatDate(listing.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare size={16} />
                              {listing.offer_count || 0} ofertas
                            </span>
                          </div>
                          
                          {listing.status === 'active' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedListingForOffers(listing);
                                setShowOffersModal(true);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center gap-2"
                            >
                              <TrendingUp size={16} />
                              {listing.user_id === currentUser?.userId ? 'Ver Ofertas' : 'Hacer Oferta'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offers Modal */}
      {showOffersModal && selectedListingForOffers && (
        <OffersModal
          listing={selectedListingForOffers}
          currentUserId={currentUser?.userId || ''}
          onClose={() => {
            setShowOffersModal(false);
            setSelectedListingForOffers(null);
          }}
          onOfferAccepted={() => {
            loadListings();
          }}
        />
      )}

      {/* New Listing Modal */}
      {showNewListing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-cyan-500/30">
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 sticky top-0 bg-[#1a1f2e] z-10">
              <div>
                <h2 className="text-2xl font-bold text-cyan-400">
                  {selectedItem ? `Nuevo Intercambio: ${selectedItem.name}` : 'Crear Intercambio'}
                </h2>
                {selectedItem && selectedItem.shortName && (
                  <p className="text-sm text-gray-400 mt-1">{selectedItem.shortName}</p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowNewListing(false);
                  setSelectedItem(null);
                }}
                className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
              >
                <X className="text-gray-400" size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedItem && selectedItem.image && (
                <div className="flex justify-center p-4 bg-[#0a0e1a] rounded-lg border border-cyan-500/20">
                  <img 
                    src={selectedItem.image} 
                    alt={selectedItem.name}
                    className="max-h-48 object-contain"
                  />
                </div>
              )}

              {!currentUser && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    Debes iniciar sesión para crear un intercambio
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ¿Qué ofreces? *
                </label>
                <input
                  type="text"
                  value={newListingOffering}
                  onChange={(e) => setNewListingOffering(e.target.value)}
                  placeholder="ej: Rifle de Plasma nivel 50, 500 de chatarra..."
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ¿Qué buscas? *
                </label>
                <input
                  type="text"
                  value={newListingLookingFor}
                  onChange={(e) => setNewListingLookingFor(e.target.value)}
                  placeholder="ej: Rifle de Asalto, medkits, partes de armadura..."
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Detalles Adicionales
                </label>
                <textarea
                  value={newListingDescription}
                  onChange={(e) => setNewListingDescription(e.target.value)}
                  placeholder="Agrega información extra sobre el intercambio, condiciones, preferencias..."
                  rows={4}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Foto del Artículo
                </label>
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleListingImageUpload}
                    className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30 file:cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    Sube una foto real de tu artículo (máximo 2MB). Si ya seleccionaste un item de la base de datos, su imagen se usará automáticamente.
                  </p>
                  {listingImageData && (
                    <div className="relative">
                      <img 
                        src={listingImageData} 
                        alt="Preview" 
                        className="max-h-48 rounded-lg border border-cyan-500/20 object-contain mx-auto"
                      />
                      <button
                        onClick={() => setListingImageData(null)}
                        className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowNewListing(false);
                    setSelectedItem(null);
                    setNewListingOffering('');
                    setNewListingLookingFor('');
                    setNewListingDescription('');
                    setListingImageData(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700/30 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createListing}
                  disabled={!newListingOffering || !newListingLookingFor || !currentUser}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Publicar Intercambio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listing Detail Modal with Offers */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#1a1f2e] rounded-lg max-w-5xl w-full my-8 border border-cyan-500/30">
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 sticky top-0 bg-[#1a1f2e] z-10">
              <div className="flex-1">
                {selectedListing.item_name && (
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 mb-2">
                    {selectedListing.item_name}
                  </span>
                )}
                <h2 className="text-2xl font-bold text-white">Detalles del Intercambio</h2>
                
                {/* User Stats */}
                {userStats && (
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-cyan-400" />
                      <span className="text-white font-medium">{selectedListing.username}</span>
                    </div>
                    <div className={`flex items-center gap-1 ${getReputationColor(userStats.reputation)}`}>
                      {getReputationIcon(userStats.reputation)}
                      <span className="font-medium">{userStats.reputation}</span>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star size={16} fill="currentColor" />
                      <span>{userStats.average_rating.toFixed(1)}</span>
                      <span className="text-gray-500">({userStats.total_trades} trades)</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedListing(null);
                  setOffers([]);
                  setUserStats(null);
                }}
                className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
              >
                <X className="text-gray-400" size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Trade Details */}
              <div className="bg-[#0a0e1a] rounded-lg p-6 border border-cyan-500/10">
                {selectedListing.item_image && (
                  <div className="flex justify-center mb-6 p-4 bg-[#000000]/30 rounded-lg">
                    <img 
                      src={selectedListing.item_image} 
                      alt={selectedListing.item_name || 'Item'} 
                      className="max-h-64 object-contain rounded-lg"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Ofrece:</p>
                    <p className="text-xl font-bold text-white">{selectedListing.offering}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Busca:</p>
                    <p className="text-xl font-bold text-cyan-400">{selectedListing.looking_for}</p>
                  </div>
                </div>

                {selectedListing.description && (
                  <div className="pt-4 border-t border-gray-700/30">
                    <p className="text-gray-300">{selectedListing.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-6 text-sm text-gray-500">
                  <span>{formatDate(selectedListing.created_at)}</span>
                  <span className={`px-3 py-1 rounded ${
                    selectedListing.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedListing.status === 'active' ? 'Activo' : selectedListing.status === 'completed' ? 'Completado' : 'Cancelado'}
                  </span>
                </div>
              </div>

              {/* Offers Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare size={20} className="text-cyan-400" />
                  Ofertas ({offers.length})
                </h3>

                {/* New Offer Form */}
                {selectedListing.status === 'active' && currentUser && selectedListing.username !== currentUser.username && (
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-cyan-400 mb-3">Hacer una oferta</h4>
                    <div className="space-y-3">
                      <textarea
                        value={newOfferText}
                        onChange={(e) => setNewOfferText(e.target.value)}
                        placeholder="Describe tu oferta en detalle..."
                        rows={3}
                        className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                      />
                      <input
                        type="text"
                        value={newOfferItems}
                        onChange={(e) => setNewOfferItems(e.target.value)}
                        placeholder="Items que ofreces (separados por comas)"
                        className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                      />
                      <button
                        onClick={() => createOffer(selectedListing._id)}
                        disabled={!newOfferText.trim()}
                        className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Send size={18} />
                        Enviar Oferta
                      </button>
                    </div>
                  </div>
                )}

                {/* Offers List */}
                {offers.length === 0 ? (
                  <div className="text-center py-8 bg-[#0a0e1a]/50 rounded-lg border border-gray-700/30">
                    <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400">No hay ofertas todavía</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {offers.map((offer) => (
                      <div
                        key={offer._id}
                        className="bg-[#0a0e1a] rounded-lg p-4 border border-gray-700/30"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User size={16} className="text-cyan-400" />
                            <span className="text-cyan-400 font-medium">{offer.offer_user}</span>
                            <span className="text-xs text-gray-500">{formatDate(offer.created_at)}</span>
                          </div>
                          {offer.status && (
                            <span className={`px-2 py-1 rounded text-xs ${
                              offer.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                              offer.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {offer.status === 'accepted' ? 'Aceptada' : offer.status === 'rejected' ? 'Rechazada' : 'Pendiente'}
                            </span>
                          )}
                        </div>

                        <p className="text-gray-300 mb-2">{offer.offer_text}</p>
                        
                        {offer.offer_items && offer.offer_items.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {offer.offer_items.map((item: string, idx: number) => (
                              <span key={idx} className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-xs">
                                {item}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Reply Section */}
                        {offer.replies && offer.replies.length > 0 && (
                          <div className="ml-6 mt-3 space-y-2 border-l-2 border-cyan-500/20 pl-4">
                            {offer.replies.map((reply: any, idx: number) => (
                              <div key={idx} className="bg-[#1a1f2e] rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <User size={14} className="text-purple-400" />
                                  <span className="text-purple-400 font-medium text-sm">{reply.reply_user}</span>
                                  <span className="text-xs text-gray-500">{formatDate(reply.created_at)}</span>
                                </div>
                                <p className="text-gray-300 text-sm">{reply.reply_text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions for listing owner */}
                        {currentUser && selectedListing.username === currentUser.username && offer.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            {replyingTo === offer._id ? (
                              <div className="flex-1 flex gap-2">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Escribe tu respuesta..."
                                  className="flex-1 px-3 py-2 bg-[#1a1f2e] border border-gray-700/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50"
                                  autoFocus
                                />
                                <button
                                  onClick={() => replyToOffer(offer._id)}
                                  className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors text-sm"
                                >
                                  <Send size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                  }}
                                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => setReplyingTo(offer._id)}
                                  className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                  <MessageSquare size={16} />
                                  Responder
                                </button>
                                <button
                                  onClick={() => acceptOffer(offer._id)}
                                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                                >
                                  <Check size={16} />
                                  Aceptar Trade
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1a1f2e] rounded-lg max-w-md w-full border border-cyan-500/30">
            <div className="p-6 border-b border-cyan-500/20">
              <h3 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
                <Star className="text-yellow-400" fill="currentColor" />
                Calificar Usuario
              </h3>
              <p className="text-sm text-gray-400 mt-1">Califica a: {ratingData.rated_user}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Calificación
                </label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingData({ ...ratingData, rating: star })}
                      className="p-2 hover:scale-110 transition-transform"
                    >
                      <Star
                        size={32}
                        className={star <= ratingData.rating ? 'text-yellow-400' : 'text-gray-600'}
                        fill={star <= ratingData.rating ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Comentario (opcional)
                </label>
                <textarea
                  value={ratingData.comment}
                  onChange={(e) => setRatingData({ ...ratingData, comment: e.target.value })}
                  placeholder="Comparte tu experiencia con este usuario..."
                  rows={4}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="trade_completed"
                  checked={ratingData.trade_completed}
                  onChange={(e) => setRatingData({ ...ratingData, trade_completed: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="trade_completed" className="text-sm text-gray-300">
                  El intercambio se completó exitosamente
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    setRatingData({
                      transaction_id: '',
                      rated_user: '',
                      rating: 5,
                      comment: '',
                      trade_completed: true
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700/30 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitRating}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors"
                >
                  Enviar Calificación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Stats Modal */}
      {userStats && !selectedListing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-lg max-w-2xl w-full border border-cyan-500/30">
            <div className="p-6 border-b border-cyan-500/20 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-cyan-400">Reputación de Usuario</h3>
              <button
                onClick={() => setUserStats(null)}
                className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
              >
                <X className="text-gray-400" size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-cyan-500/20 rounded-full mb-4">
                  <User size={40} className="text-cyan-400" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">{userStats.username}</h4>
                <div className={`inline-flex items-center gap-2 text-lg font-bold ${getReputationColor(userStats.reputation)}`}>
                  {getReputationIcon(userStats.reputation)}
                  {userStats.reputation}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0a0e1a] rounded-lg p-4 text-center border border-cyan-500/10">
                  <div className="flex items-center justify-center text-yellow-400 mb-2">
                    <Star size={24} fill="currentColor" />
                  </div>
                  <p className="text-2xl font-bold text-white">{userStats.average_rating.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">Calificación</p>
                </div>
                <div className="bg-[#0a0e1a] rounded-lg p-4 text-center border border-cyan-500/10">
                  <div className="flex items-center justify-center text-cyan-400 mb-2">
                    <ArrowLeftRight size={24} />
                  </div>
                  <p className="text-2xl font-bold text-white">{userStats.total_trades}</p>
                  <p className="text-xs text-gray-400">Total Trades</p>
                </div>
                <div className="bg-[#0a0e1a] rounded-lg p-4 text-center border border-cyan-500/10">
                  <div className="flex items-center justify-center text-green-400 mb-2">
                    <Check size={24} />
                  </div>
                  <p className="text-2xl font-bold text-white">{userStats.completed_trades}</p>
                  <p className="text-xs text-gray-400">Completados</p>
                </div>
              </div>

              <div className="bg-[#0a0e1a] rounded-lg p-4 border border-cyan-500/10">
                <h5 className="text-sm font-medium text-gray-400 mb-3">Distribución de Calificaciones</h5>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = userStats.rating_breakdown[stars] || 0;
                    const percentage = userStats.total_trades > 0 ? (count / userStats.total_trades) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-16">
                          <span className="text-sm text-gray-400">{stars}</span>
                          <Star size={14} className="text-yellow-400" fill="currentColor" />
                        </div>
                        <div className="flex-1 bg-gray-700/30 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

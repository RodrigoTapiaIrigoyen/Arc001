import { useState, useEffect } from 'react';
import { X, MessageSquare, TrendingUp, Check, XCircle } from 'lucide-react';
import api from '../services/api';
import socketClient from '../services/socket';
import toast from 'react-hot-toast';

interface Offer {
  _id: string;
  listing_id: string;
  seller_id: string;
  buyer_id: string;
  buyer_username: string;
  offer_items: string[]; // Items que ofrece a cambio
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  counter_offers?: Array<{
    counter_items: string[];
    message: string;
    created_at: string;
  }>;
  last_counter_items?: string[];
  created_at: string;
  expires_at: string;
}

interface Props {
  listing: any;
  currentUserId: string;
  onClose: () => void;
  onOfferAccepted?: () => void;
}

export default function OffersModal({ listing, currentUserId, onClose, onOfferAccepted }: Props) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOfferItems, setNewOfferItems] = useState('');
  const [newOfferMessage, setNewOfferMessage] = useState('');
  const [counterItems, setCounterItems] = useState<{ [key: string]: string }>({});
  const [counterMessage, setCounterMessage] = useState<{ [key: string]: string }>({});
  const [showCounterForm, setShowCounterForm] = useState<{ [key: string]: boolean }>({});

  const isOwner = listing.user_id === currentUserId;

  useEffect(() => {
    loadOffers();
    
    // Setup listeners de WebSocket para actualizaciones en tiempo real
    const handleNewOffer = (data: any) => {
      if (data.listingId === listing._id || isOwner) {
        toast.success('Nueva oferta recibida', { icon: '💰' });
        loadOffers();
      }
    };

    const handleOfferUpdate = (data: any) => {
      if (data.type === 'accepted') {
        toast.success('¡Oferta aceptada!', { icon: '✅' });
      } else if (data.type === 'rejected') {
        toast.error('Oferta rechazada', { icon: '❌' });
      } else if (data.type === 'countered') {
        toast('Nueva contraoferta recibida', { icon: '🔄' });
      }
      loadOffers();
    };

    socketClient.on('new-trade-offer', handleNewOffer);
    socketClient.on('trade-offer-updated', handleOfferUpdate);

    return () => {
      socketClient.off('new-trade-offer');
      socketClient.off('trade-offer-updated');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/marketplace/listings/${listing._id}/offers`);
      setOffers(data);
    } catch (error) {
      console.error('Error loading offers:', error);
      toast.error('Error al cargar ofertas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async () => {
    if (!newOfferItems.trim()) {
      toast.error('Ingresa los items que ofreces');
      return;
    }

    const itemsArray = newOfferItems.split(',').map(item => item.trim()).filter(Boolean);
    if (itemsArray.length === 0) {
      toast.error('Ingresa al menos un item');
      return;
    }

    try {
      await api.post(`/marketplace/listings/${listing._id}/offer`, {
        offer_items: itemsArray,
        message: newOfferMessage
      });

      toast.success('Oferta enviada');
      setNewOfferItems('');
      setNewOfferMessage('');
      loadOffers();
    } catch (error: any) {
      toast.error(error.message || 'Error al crear oferta');
    }
  };

  const handleAcceptOffer = async (offerId: string) => {
    try {
      await api.put(`/marketplace/offers/${offerId}/accept`, {});
      toast.success('¡Oferta aceptada! Trade completado');
      if (onOfferAccepted) onOfferAccepted();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al aceptar oferta');
    }
  };

  const handleRejectOffer = async (offerId: string) => {
    try {
      await api.put(`/marketplace/offers/${offerId}/reject`, {});
      toast.success('Oferta rechazada');
      loadOffers();
    } catch (error: any) {
      toast.error(error.message || 'Error al rechazar oferta');
    }
  };

  const handleCounterOffer = async (offerId: string) => {
    const items = counterItems[offerId];
    if (!items || !items.trim()) {
      toast.error('Ingresa los items para la contraoferta');
      return;
    }

    const itemsArray = items.split(',').map(item => item.trim()).filter(Boolean);
    if (itemsArray.length === 0) {
      toast.error('Ingresa al menos un item');
      return;
    }

    try {
      await api.put(`/marketplace/offers/${offerId}/counter`, {
        counter_items: itemsArray,
        message: counterMessage[offerId] || ''
      });

      toast.success('Contraoferta enviada');
      setCounterItems({ ...counterItems, [offerId]: '' });
      setCounterMessage({ ...counterMessage, [offerId]: '' });
      setShowCounterForm({ ...showCounterForm, [offerId]: false });
      loadOffers();
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar contraoferta');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
      accepted: 'bg-green-500/10 border-green-500/30 text-green-400',
      rejected: 'bg-red-500/10 border-red-500/30 text-red-400',
      countered: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
      expired: 'bg-gray-500/10 border-gray-500/30 text-gray-400'
    };

    const labels = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      countered: 'Contraoferté',
      expired: 'Expirada'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Hace menos de 1 hora';
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/30 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border-b border-cyan-500/30 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {isOwner ? 'Ofertas Recibidas' : 'Hacer Oferta'}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">Ofrece: {listing.offering}</span>
                <span className="text-gray-500">•</span>
                <span className="text-cyan-400">Busca: {listing.looking_for}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
            >
              <X className="text-gray-400" size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Create Offer Form (solo si no es owner) */}
          {!isOwner && (
            <div className="bg-[#0a0e1a] border border-cyan-500/20 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Nueva Oferta de Intercambio</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Items que Ofreces
                    <span className="text-gray-500 ml-2">(separados por comas)</span>
                  </label>
                  <textarea
                    value={newOfferItems}
                    onChange={(e) => setNewOfferItems(e.target.value)}
                    placeholder="Ej: Rifle AK-47, 50 Balas 7.62mm, Blueprint: Armadura Nivel 2"
                    rows={3}
                    className="w-full bg-[#0f1420] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none resize-none"
                  />
                  {newOfferItems && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {newOfferItems.split(',').map((item, idx) => (
                        item.trim() && (
                          <span key={idx} className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-full text-sm">
                            {item.trim()}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Mensaje (Opcional)</label>
                  <textarea
                    value={newOfferMessage}
                    onChange={(e) => setNewOfferMessage(e.target.value)}
                    placeholder="Explica tu oferta..."
                    rows={3}
                    className="w-full bg-[#0f1420] border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 focus:outline-none resize-none"
                  />
                </div>

                <button
                  onClick={handleCreateOffer}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all"
                >
                  Enviar Oferta
                </button>
              </div>
            </div>
          )}

          {/* Offers List */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white mb-4">
              {isOwner ? `Ofertas (${offers.length})` : 'Mis Ofertas'}
            </h3>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
              </div>
            ) : offers.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto text-gray-600 mb-4" size={48} />
                <p className="text-gray-400">No hay ofertas todavía</p>
              </div>
            ) : (
              offers.map((offer) => (
                <div
                  key={offer._id}
                  className="bg-gradient-to-br from-[#1a1f2e] to-[#0a0e1a] border border-gray-700 rounded-lg p-4"
                >
                  {/* Offer Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white">{offer.buyer_username}</span>
                        {getStatusBadge(offer.status)}
                      </div>
                      <span className="text-gray-500 text-sm">{formatDate(offer.created_at)}</span>
                    </div>
                  </div>

                  {/* Offered Items */}
                  <div className="bg-[#0a0e1a] border border-cyan-500/20 rounded-lg p-4 mb-3">
                    <p className="text-gray-400 text-xs mb-2">Ofrece a cambio:</p>
                    <div className="flex flex-wrap gap-2">
                      {offer.offer_items?.map((item, idx) => (
                        <span key={idx} className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Last Counter Offer */}
                  {offer.status === 'countered' && offer.last_counter_items && offer.last_counter_items.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-3">
                      <p className="text-yellow-400 text-xs mb-2 font-semibold">Tu contraoferta:</p>
                      <div className="flex flex-wrap gap-2">
                        {offer.last_counter_items.map((item, idx) => (
                          <span key={idx} className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-full text-sm">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  {offer.message && (
                    <div className="bg-[#0a0e1a] rounded-lg p-3 mb-3">
                      <p className="text-gray-300 text-sm">{offer.message}</p>
                    </div>
                  )}

                  {/* Counter Offers History */}
                  {offer.counter_offers && offer.counter_offers.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {offer.counter_offers.map((counter, idx) => (
                        <div key={idx} className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
                          <div className="mb-2">
                            <span className="text-cyan-400 text-sm font-semibold">Contraoferta #{idx + 1}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {counter.counter_items?.map((item, itemIdx) => (
                              <span key={itemIdx} className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-full text-xs">
                                {item}
                              </span>
                            ))}
                          </div>
                          {counter.message && (
                            <p className="text-gray-400 text-sm">{counter.message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions (solo para owner y ofertas pendientes/countered) */}
                  {isOwner && (offer.status === 'pending' || offer.status === 'countered') && (
                    <div className="space-y-2">
                      {!showCounterForm[offer._id] ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptOffer(offer._id)}
                            className="flex-1 bg-green-500/20 border border-green-500/30 text-green-400 font-semibold py-2 rounded-lg hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <Check size={18} />
                            Aceptar
                          </button>
                          <button
                            onClick={() => setShowCounterForm({ ...showCounterForm, [offer._id]: true })}
                            className="flex-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 font-semibold py-2 rounded-lg hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <TrendingUp size={18} />
                            Contraoferta
                          </button>
                          <button
                            onClick={() => handleRejectOffer(offer._id)}
                            className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 font-semibold py-2 rounded-lg hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <XCircle size={18} />
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-gray-400 text-xs mb-1">Items de contraoferta (separados por comas)</label>
                            <textarea
                              value={counterItems[offer._id] || ''}
                              onChange={(e) => setCounterItems({ ...counterItems, [offer._id]: e.target.value })}
                              placeholder="Ej: Escopeta, 30 Cartuchos, Blueprint: Mochila"
                              rows={2}
                              className="w-full bg-[#0f1420] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none resize-none"
                            />
                          </div>
                          <div>
                            <textarea
                              value={counterMessage[offer._id] || ''}
                              onChange={(e) => setCounterMessage({ ...counterMessage, [offer._id]: e.target.value })}
                              placeholder="Mensaje (opcional)"
                              rows={2}
                              className="w-full bg-[#0f1420] border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none resize-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCounterOffer(offer._id)}
                              className="flex-1 bg-cyan-500 text-white font-semibold py-2 rounded-lg hover:bg-cyan-600 transition-all"
                            >
                              Enviar Contraoferta
                            </button>
                            <button
                              onClick={() => setShowCounterForm({ ...showCounterForm, [offer._id]: false })}
                              className="px-4 bg-gray-700 text-white font-semibold py-2 rounded-lg hover:bg-gray-600 transition-all"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

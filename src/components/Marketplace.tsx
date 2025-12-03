import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  Plus,
  Eye,
  Clock,
  X,
  Filter,
  Crosshair,
  Package,
  Users as UsersIcon,
  Skull,
  ArrowLeftRight,
} from 'lucide-react';

const API_URL = 'http://localhost:3001/api/marketplace';

export default function Marketplace() {
  const [activeTab, setActiveTab] = useState<'trading' | 'discussions'>('trading');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  
  // Trading states
  const [listings, setListings] = useState<any[]>([]);
  const [showNewListing, setShowNewListing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  
  // Discussions states
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [showNewDiscussion, setShowNewDiscussion] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [filterType, setFilterType] = useState('all');

  const [newDiscussionTitle, setNewDiscussionTitle] = useState('');
  const [newDiscussionContent, setNewDiscussionContent] = useState('');
  const [newDiscussionAuthor, setNewDiscussionAuthor] = useState('');
  const [newDiscussionTags, setNewDiscussionTags] = useState('');

  // New listing form states
  const [newListingOffering, setNewListingOffering] = useState('');
  const [newListingLookingFor, setNewListingLookingFor] = useState('');
  const [newListingDescription, setNewListingDescription] = useState('');
  const [newListingUsername, setNewListingUsername] = useState('');

  const itemTypes = [
    { id: 'all', label: 'All Items', icon: Package, color: 'cyan' },
    { id: 'weapon', label: 'Weapons', icon: Crosshair, color: 'red' },
    { id: 'item', label: 'Items', icon: Package, color: 'blue' },
    { id: 'trader', label: 'Traders', icon: UsersIcon, color: 'green' },
    { id: 'enemy', label: 'Enemies', icon: Skull, color: 'purple' },
  ];

  const loadListings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('item_type', filterType);
      
      const response = await fetch(`${API_URL}/trades?${params}`);
      const data = await response.json();
      console.log('Listings cargados:', data);
      setListings(data.listings || []);
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  }, [filterType]);

  const loadDiscussions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('item_type', filterType);
      
      const response = await fetch(`${API_URL}/discussions?${params}`);
      const data = await response.json();
      setDiscussions(data.discussions || []);
    } catch (error) {
      console.error('Error loading discussions:', error);
    }
  }, [filterType]);

  useEffect(() => {
    if (activeTab === 'trading') {
      loadListings();
    } else {
      loadDiscussions();
    }
  }, [activeTab, loadListings, loadDiscussions]);

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

  const loadComments = async (discussionId: string) => {
    try {
      const response = await fetch(`${API_URL}/discussions/${discussionId}/comments`);
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const createListing = async () => {
    if (!newListingOffering || !newListingLookingFor) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const body: any = {
        offering: newListingOffering,
        looking_for: newListingLookingFor,
        description: newListingDescription,
        username: newListingUsername || 'Anonymous',
      };

      // Si hay un item seleccionado, agregarlo al listing
      if (selectedItem) {
        const itemType = selectedItem.damage ? 'weapon' : selectedItem.threat_level ? 'enemy' : selectedItem.sells ? 'trader' : 'item';
        body.item_id = selectedItem._id || selectedItem.id;
        body.item_type = itemType;
        body.item_name = selectedItem.name;
      }
      
      const response = await fetch(`${API_URL}/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (response.ok) {
        const data = await response.json();
        setShowNewListing(false);
        setSelectedItem(null);
        setNewListingOffering('');
        setNewListingLookingFor('');
        setNewListingDescription('');
        setNewListingUsername('');
        loadListings();
      } else {
        const error = await response.text();
        alert('Error al crear el intercambio. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
    }
  };

  const createDiscussion = async () => {
    if (!newDiscussionTitle || !newDiscussionContent) return;

    try {
      const payload: any = {
        title: newDiscussionTitle,
        content: newDiscussionContent,
        author_name: newDiscussionAuthor || 'Anonymous',
        tags: newDiscussionTags.split(',').map((t: string) => t.trim()).filter(Boolean),
      };

      // Add item info only if an item is selected
      if (selectedItem) {
        const itemType = selectedItem.damage ? 'weapon' : selectedItem.threat_level ? 'enemy' : selectedItem.sells ? 'trader' : 'item';
        payload.item_id = selectedItem._id || selectedItem.id;
        payload.item_type = itemType;
        payload.item_name = selectedItem.name;
      }
      
      const response = await fetch(`${API_URL}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowNewDiscussion(false);
        setSelectedItem(null);
        setNewDiscussionTitle('');
        setNewDiscussionContent('');
        setNewDiscussionTags('');
        loadDiscussions();
      }
    } catch (error) {
      console.error('Error creating discussion:', error);
    }
  };

  const addComment = async () => {
    if (!selectedDiscussion || !newComment.trim()) return;

    try {
      await fetch(`${API_URL}/discussions/${selectedDiscussion._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          author_name: 'Anonymous',
        }),
      });

      setNewComment('');
      loadComments(selectedDiscussion._id);
      loadDiscussions();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const voteDiscussion = async (discussionId: string, voteType: string) => {
    try {
      await fetch(`${API_URL}/discussions/${discussionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: voteType }),
      });
      loadDiscussions();
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const voteComment = async (commentId: string, voteType: string) => {
    try {
      await fetch(`${API_URL}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: voteType }),
      });
      if (selectedDiscussion) {
        loadComments(selectedDiscussion._id);
      }
    } catch (error) {
      console.error('Error voting comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Marketplace
        </h1>
        <p className="text-gray-400 mt-1">
          Trade items with other players or discuss strategies and builds
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-red-500/20">
        <button
          onClick={() => setActiveTab('trading')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'trading'
              ? 'text-yellow-400'
              : 'text-gray-400 hover:text-yellow-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={20} />
            Item Trading
          </div>
          {activeTab === 'trading' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-yellow-500"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab('discussions')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'discussions'
              ? 'text-green-400'
              : 'text-gray-400 hover:text-green-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={20} />
            Discussions
          </div>
          {activeTab === 'discussions' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-blue-500"></div>
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
                  placeholder="Search for weapons, items, traders, enemies to trade..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchItems()}
                  className="w-full pl-10 pr-4 py-3 bg-[#0a0e1a] border border-yellow-500/20 rounded-lg text-white focus:outline-none focus:border-yellow-500/50"
                />
              </div>
              <button
                onClick={searchItems}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-green-500 text-white rounded-lg hover:from-yellow-600 hover:to-green-600 transition-colors"
              >
                Search
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
                              setSelectedItem(item);
                              setShowNewListing(true);
                            }}
                            className="p-4 bg-[#0a0e1a] border border-blue-500/10 rounded-lg hover:border-blue-500/30 transition-all cursor-pointer group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                                  {item.name}
                                </p>
                                {item.shortName && (
                                  <p className="text-xs text-gray-500 mt-1">{item.shortName}</p>
                                )}
                                {item.type && (
                                  <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400">
                                    {item.type}
                                  </span>
                                )}
                              </div>
                              <Plus className="text-gray-600 group-hover:text-blue-400 transition-colors" size={20} />
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
              <h3 className="text-xl font-bold text-white">Active Trade Listings</h3>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setShowNewListing(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={18} />
                New Listing
              </button>
            </div>

            {listings.length === 0 ? (
              <div className="text-center py-12 bg-[#1a1f2e]/50 border border-gray-700/30 rounded-lg">
                <ArrowLeftRight className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No active listings yet. Be the first to post a trade!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {listings.map((listing) => (
                  <div
                    key={listing._id}
                    onClick={() => setSelectedListing(listing)}
                    className="bg-gradient-to-br from-[#1a1f2e] to-[#0a0e1a] border border-red-500/20 rounded-lg p-6 hover:border-yellow-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <ArrowLeftRight className="text-yellow-400 mt-1" size={24} />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                            {listing.item_name}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            listing.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {listing.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Offering:</p>
                            <p className="text-white font-medium">{listing.offering}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Looking for:</p>
                            <p className="text-green-400 font-medium">{listing.looking_for}</p>
                          </div>
                        </div>

                        {listing.description && (
                          <p className="text-gray-400 text-sm mb-3">{listing.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="text-yellow-400">{listing.username}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={16} />
                            {formatDate(listing.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare size={16} />
                            {listing.offers_count || 0} offers
                          </span>
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

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <div className="space-y-6">
          {/* Header with New Discussion Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Item Discussions</h2>
              <p className="text-gray-400 text-sm">Search for items and start discussions with the community</p>
            </div>
            <button
              onClick={() => setShowNewDiscussion(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 font-medium transition-all flex items-center gap-2"
            >
              <MessageSquare size={20} />
              New Discussion
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0a0e1a] border border-cyan-500/20 rounded-lg p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search for weapons, items, traders, enemies..."
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
            Search
          </button>
        </div>

        {searchResults && (
          <div className="mt-6 space-y-4">
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
                          setSelectedItem(item);
                          setShowNewDiscussion(true);
                        }}
                        className="p-4 bg-[#0a0e1a] border border-cyan-500/10 rounded-lg hover:border-cyan-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                              {item.name}
                            </p>
                            {item.shortName && (
                              <p className="text-xs text-gray-500 mt-1">{item.shortName}</p>
                            )}
                            {item.type && (
                              <span className="inline-block mt-2 px-2 py-1 text-xs rounded bg-cyan-500/20 text-cyan-400">
                                {item.type}
                              </span>
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

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Filter className="text-gray-500" size={20} />
            <div className="flex flex-wrap gap-2">
              {itemTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setFilterType(type.id)}
                    className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                      filterType === type.id
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                        : 'bg-[#1a1f2e]/50 border-gray-700/30 text-gray-400 hover:border-cyan-500/30'
                    }`}
                  >
                    <Icon size={16} />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discussions List */}
          <div className="grid grid-cols-1 gap-4">
        {discussions.length === 0 ? (
          <div className="text-center py-12 bg-[#1a1f2e]/50 border border-gray-700/30 rounded-lg">
            <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No discussions yet. Search for an item to start!</p>
          </div>
        ) : (
          discussions.map((discussion) => (
            <div
              key={discussion._id}
              onClick={() => {
                setSelectedDiscussion(discussion);
                loadComments(discussion._id);
              }}
              className="bg-gradient-to-br from-[#1a1f2e] to-[#0a0e1a] border border-cyan-500/20 rounded-lg p-6 hover:border-cyan-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      voteDiscussion(discussion._id, 'up');
                    }}
                    className="p-2 hover:bg-green-500/10 rounded-lg transition-colors"
                  >
                    <ThumbsUp className="text-gray-400 hover:text-green-400" size={20} />
                  </button>
                  <span className="text-lg font-bold text-cyan-400">
                    {discussion.upvotes - discussion.downvotes}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      voteDiscussion(discussion._id, 'down');
                    }}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <ThumbsDown className="text-gray-400 hover:text-red-400" size={20} />
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      {discussion.item_name}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 hover:text-cyan-400 transition-colors">
                    {discussion.title}
                  </h3>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{discussion.content}</p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <MessageSquare size={16} />
                      {discussion.comment_count} comments
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={16} />
                      {discussion.views} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={16} />
                      {formatDate(discussion.created_at)}
                    </span>
                    <span className="ml-auto text-cyan-400">by {discussion.author_name}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
          </div>
        </div>
      )}

      {/* New Listing Modal */}
      {showNewListing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-cyan-500/30">
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
              <h2 className="text-2xl font-bold text-cyan-400">
                {selectedItem ? `New Trade: ${selectedItem.name}` : 'Create Trade Listing'}
              </h2>
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
              {!selectedItem && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <p className="text-yellow-400 text-sm">
                    💡 Tip: Search for an item first to create a listing for that specific item
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What are you offering? *
                </label>
                <input
                  type="text"
                  value={newListingOffering}
                  onChange={(e) => setNewListingOffering(e.target.value)}
                  placeholder="e.g., Plasma Rifle, 500 scrap metal, rare mods..."
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What are you looking for? *
                </label>
                <input
                  type="text"
                  value={newListingLookingFor}
                  onChange={(e) => setNewListingLookingFor(e.target.value)}
                  placeholder="e.g., Assault Rifle, medkits, armor parts..."
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Additional Details
                </label>
                <textarea
                  value={newListingDescription}
                  onChange={(e) => setNewListingDescription(e.target.value)}
                  placeholder="Add any extra information about the trade, conditions, preferences..."
                  rows={4}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Username (Optional)
                </label>
                <input
                  type="text"
                  value={newListingUsername}
                  onChange={(e) => setNewListingUsername(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowNewListing(false);
                    setSelectedItem(null);
                    setNewListingOffering('');
                    setNewListingLookingFor('');
                    setNewListingDescription('');
                    setNewListingUsername('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700/30 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Botón clickeado!', {
                      offering: newListingOffering,
                      lookingFor: newListingLookingFor,
                      isDisabled: !newListingOffering || !newListingLookingFor
                    });
                    createListing();
                  }}
                  disabled={!newListingOffering || !newListingLookingFor}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!newListingOffering || !newListingLookingFor ? 'Completa los campos requeridos' : 'Publicar trade'}
                >
                  Post Trade
                  {(!newListingOffering || !newListingLookingFor) && ' *'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Discussion Modal */}
      {showNewDiscussion && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-cyan-500/30">
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
              <h2 className="text-2xl font-bold text-cyan-400">
                {selectedItem ? `New Discussion: ${selectedItem.name}` : 'New Discussion'}
              </h2>
              <button
                onClick={() => {
                  setShowNewDiscussion(false);
                  setSelectedItem(null);
                }}
                className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
              >
                <X className="text-gray-400" size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newDiscussionTitle}
                  onChange={(e) => setNewDiscussionTitle(e.target.value)}
                  placeholder="What's your question or topic?"
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                <textarea
                  value={newDiscussionContent}
                  onChange={(e) => setNewDiscussionContent(e.target.value)}
                  placeholder="Share your thoughts, ask questions, or provide tips..."
                  rows={8}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newDiscussionTags}
                  onChange={(e) => setNewDiscussionTags(e.target.value)}
                  placeholder="build, strategy, trade..."
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  value={newDiscussionAuthor}
                  onChange={(e) => setNewDiscussionAuthor(e.target.value)}
                  placeholder="Anonymous"
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowNewDiscussion(false);
                    setSelectedItem(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700/30 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createDiscussion}
                  disabled={!newDiscussionTitle || !newDiscussionContent}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Discussion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Discussion Detail Modal */}
      {selectedDiscussion && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-cyan-500/30">
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 mb-2">
                  {selectedDiscussion.item_name}
                </span>
                <h2 className="text-2xl font-bold text-white">{selectedDiscussion.title}</h2>
              </div>
              <button
                onClick={() => setSelectedDiscussion(null)}
                className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
              >
                <X className="text-gray-400" size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-[#0a0e1a] rounded-lg p-4">
                <p className="text-gray-300 whitespace-pre-wrap">{selectedDiscussion.content}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span className="text-cyan-400">{selectedDiscussion.author_name}</span>
                  <span>{formatDate(selectedDiscussion.created_at)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">
                  Comments ({comments.length})
                </h3>

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                    onKeyDown={(e) => e.key === 'Enter' && addComment()}
                  />
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={20} />
                  </button>
                </div>

                {comments.map((comment) => (
                  <div
                    key={comment._id}
                    className="bg-[#0a0e1a] rounded-lg p-4 border border-gray-700/30"
                  >
                    <p className="text-gray-300 mb-3">{comment.content}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-cyan-400">{comment.author_name}</span>
                      <span className="text-sm text-gray-500">{formatDate(comment.created_at)}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <button
                          onClick={() => voteComment(comment._id, 'up')}
                          className="flex items-center gap-1 text-gray-400 hover:text-green-400"
                        >
                          <ThumbsUp size={16} />
                          <span className="text-sm">{comment.upvotes}</span>
                        </button>
                        <button
                          onClick={() => voteComment(comment._id, 'down')}
                          className="flex items-center gap-1 text-gray-400 hover:text-red-400"
                        >
                          <ThumbsDown size={16} />
                          <span className="text-sm">{comment.downvotes}</span>
                        </button>
                      </div>
                    </div>

                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-8 mt-3 space-y-2">
                        {comment.replies.map((reply: any) => (
                          <div
                            key={reply._id}
                            className="bg-[#1a1f2e] rounded-lg p-3 border border-gray-700/20"
                          >
                            <p className="text-gray-300 text-sm mb-2">{reply.content}</p>
                            <span className="text-xs text-cyan-400">{reply.author_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1f2e] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-cyan-500/30">
            <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 mb-2">
                  {selectedListing.item_name}
                </span>
                <h2 className="text-2xl font-bold text-white">Trade Details</h2>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
              >
                <X className="text-gray-400" size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-[#0a0e1a] rounded-lg p-6">
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Offering:</p>
                    <p className="text-xl font-bold text-white">{selectedListing.offering}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Looking for:</p>
                    <p className="text-xl font-bold text-cyan-400">{selectedListing.looking_for}</p>
                  </div>
                </div>

                {selectedListing.description && (
                  <div className="pt-4 border-t border-gray-700/30">
                    <p className="text-gray-300">{selectedListing.description}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-6 text-sm text-gray-500">
                  <span className="text-cyan-400">{selectedListing.username}</span>
                  <span>{formatDate(selectedListing.created_at)}</span>
                  <span className={`ml-auto px-3 py-1 rounded ${
                    selectedListing.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedListing.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">
                  Offers ({selectedListing.offers_count || 0})
                </h3>

                {selectedListing.status === 'active' && (
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                    <p className="text-cyan-400 text-sm">
                      💬 Interested in this trade? Contact {selectedListing.username} through the community to make an offer!
                    </p>
                  </div>
                )}

                {selectedListing.status === 'completed' && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-green-400 text-sm">
                      ✅ This trade has been completed!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

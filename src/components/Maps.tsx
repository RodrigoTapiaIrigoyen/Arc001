import { useState, useEffect } from 'react';
import { Map as MapIcon, MapPin, Key, Package, Search, Info, Layers, Eye } from 'lucide-react';
import InteractiveMap from './InteractiveMap';

interface MapLocation {
  name: string;
  items: any[];
  keys: any[];
  materials: any[];
  equipment: any[];
  totalItems: number;
  rarityBreakdown: Record<string, number>;
  mapImage?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Mapas oficiales interactivos con marcadores personalizables
const GAME_MAPS: Record<string, { image: string }> = {
  'Dam': { 
    image: '/maps/dam-real.jpg'
  },
  'Blue Gate': { 
    image: '/maps/blue-gate-real.jpg'
  },
  'Buried City': { 
    image: '/maps/buried-city-real.jpg'
  },
  'Stella Montis': { 
    image: '/maps/stella-montis-real.jpg'
  },
  'Spaceport': { 
    image: '/maps/spaceport-real.jpg'
  },
};

export default function Maps() {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);
  const [currentInteractiveMap, setCurrentInteractiveMap] = useState<string | null>(null);
  const [communityMarkers, setCommunityMarkers] = useState<Record<string, any[]>>({});
  const [markerStats, setMarkerStats] = useState<any>(null);

  useEffect(() => {
    loadMaps();
    loadCommunityMarkers();
  }, []);

  const loadMaps = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/maps`);
      const data = await response.json();
      
      // Enriquecer datos con imágenes de mapas oficiales
      const enrichedData = data.map((loc: MapLocation) => ({
        ...loc,
        mapImage: GAME_MAPS[loc.name]?.image,
      }));
      
      setLocations(enrichedData);
    } catch (error) {
      console.error('Error loading maps:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityMarkers = () => {
    try {
      const allMarkers: Record<string, any[]> = {};
      let totalMarkers = 0;
      const markersByType: Record<string, number> = {};
      const topLocations: Array<{ map: string; count: number; markers: any[] }> = [];

      // Cargar marcadores de cada mapa desde localStorage
      Object.keys(GAME_MAPS).forEach(mapName => {
        const stored = localStorage.getItem(`map_markers_${mapName}`);
        if (stored) {
          const markers = JSON.parse(stored);
          allMarkers[mapName] = markers;
          totalMarkers += markers.length;

          // Contar por tipo
          markers.forEach((marker: any) => {
            const type = marker.type || 'other';
            markersByType[type] = (markersByType[type] || 0) + 1;
          });

          // Agregar a top locations
          if (markers.length > 0) {
            topLocations.push({
              map: mapName,
              count: markers.length,
              markers: markers
            });
          }
        }
      });

      // Ordenar top locations por cantidad de marcadores
      topLocations.sort((a, b) => b.count - a.count);

      setCommunityMarkers(allMarkers);
      setMarkerStats({
        total: totalMarkers,
        byType: markersByType,
        topLocations: topLocations.slice(0, 10),
        mapsWithMarkers: Object.keys(allMarkers).filter(map => allMarkers[map].length > 0).length
      });
    } catch (error) {
      console.error('Error loading community markers:', error);
    }
  };

  const currentLocation = selectedLocation 
    ? locations.find(loc => loc.name === selectedLocation) 
    : null;
  
  const isGameMap = selectedLocation && GAME_MAPS[selectedLocation];
  const currentGameMap = isGameMap ? GAME_MAPS[selectedLocation] : null;

  const handleOpenInteractiveMap = (mapName: string) => {
    setCurrentInteractiveMap(mapName);
    setShowInteractiveMap(true);
  };

  const handleCloseInteractiveMap = () => {
    setShowInteractiveMap(false);
    setCurrentInteractiveMap(null);
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      'Common': 'text-gray-400 bg-gray-500/20 border-gray-500/30',
      'Uncommon': 'text-green-400 bg-green-500/20 border-green-500/30',
      'Rare': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      'Epic': 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      'Legendary': 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    };
    return colors[rarity] || 'text-gray-400';
  };

  const filteredItems = (items: any[]) => {
    return items.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.arcforge_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = filterRarity === 'all' || 
        item.infobox_full?.rarity === filterRarity;
      return matchesSearch && matchesRarity;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400">Loading map data from game database...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showInteractiveMap && currentInteractiveMap && (
        <InteractiveMap 
          mapName={currentInteractiveMap} 
          onClose={handleCloseInteractiveMap}
        />
      )}
      
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Maps & Loot Locations
          </h1>
          <p className="text-gray-400 mt-1">
            Explore game maps and {locations.length} loot categories with item spawns
          </p>
          <p className="text-xs text-gray-500 mt-1">
            📍 {locations.reduce((sum, loc) => sum + (loc.totalItems || 0), 0)} items catalogued across multiple location types
          </p>
        </div>
        
        {!selectedLocation && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#1a1f2e] border border-cyan-500/20 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50 w-64"
              />
            </div>
          </div>
        )}
      </div>

      {!selectedLocation ? (
        <>
          {/* Game Maps Section */}
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <MapIcon className="text-cyan-400" size={28} />
              Official Game Maps
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Mapas interactivos de alta resolución con marcadores personalizables. Click para explorar y añadir tus propios puntos de interés.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {Object.entries(GAME_MAPS).map(([mapName, mapData]) => (
                <div
                  key={mapName}
                  className="group relative bg-[#0a0e1a] border border-cyan-500/30 rounded-lg overflow-hidden hover:border-cyan-500/70 transition-all hover:scale-105"
                >
                  <div 
                    className="aspect-video bg-[#0f1420] relative cursor-pointer"
                    onClick={() => handleOpenInteractiveMap(mapName)}
                  >
                    <img 
                      src={mapData.image} 
                      alt={mapName}
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                      <span className="text-white text-xs flex items-center gap-1">
                        <Eye size={12} />
                        Abrir Mapa Interactivo
                      </span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {mapName}
                    </h3>
                    <button
                      onClick={() => handleOpenInteractiveMap(mapName)}
                      className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <MapPin size={14} />
                      Abrir Mapa Interactivo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Markers & Hot Spots */}
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-purple-500/30 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="text-purple-400" size={28} />
              Community Markers & Hot Spots
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Descubre las ubicaciones más populares marcadas por la comunidad. Tus marcadores personalizados en los mapas interactivos.
            </p>
            
            {markerStats && markerStats.total > 0 ? (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <MapPin className="text-cyan-400" size={20} />
                      <span className="text-2xl font-bold text-cyan-400">{markerStats.total}</span>
                    </div>
                    <p className="text-sm text-gray-300">Total Markers</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <MapIcon className="text-purple-400" size={20} />
                      <span className="text-2xl font-bold text-purple-400">{markerStats.mapsWithMarkers}</span>
                    </div>
                    <p className="text-sm text-gray-300">Active Maps</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Eye className="text-orange-400" size={20} />
                      <span className="text-2xl font-bold text-orange-400">{markerStats.topLocations[0]?.count || 0}</span>
                    </div>
                    <p className="text-sm text-gray-300">Most Marked</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Layers className="text-green-400" size={20} />
                      <span className="text-2xl font-bold text-green-400">{Object.keys(markerStats.byType).length}</span>
                    </div>
                    <p className="text-sm text-gray-300">Marker Types</p>
                  </div>
                </div>

                {/* Top Locations */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    🔥 Top 10 Hot Spots
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
                    {markerStats.topLocations.map((location: any, index: number) => {
                      const medals = ['🥇', '🥈', '🥉'];
                      const medal = index < 3 ? medals[index] : `${index + 1}.`;
                      
                      return (
                        <button
                          key={location.map}
                          onClick={() => handleOpenInteractiveMap(location.map)}
                          className="group relative p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-lg hover:border-purple-500/60 transition-all hover:scale-105 text-left"
                        >
                          <div className="absolute -top-2 -right-2 text-2xl">{medal}</div>
                          <div className="mb-2">
                            <h4 className="font-bold text-white group-hover:text-purple-400 transition-colors">
                              {location.map}
                            </h4>
                            <p className="text-xs text-gray-400">
                              {location.count} marker{location.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-purple-400">
                            <MapPin size={12} />
                            <span>Click to explore</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Marker Types Distribution */}
                {Object.keys(markerStats.byType).length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      📊 Marker Categories
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(markerStats.byType).map(([type, count]: [string, any]) => {
                        const colors: Record<string, string> = {
                          loot: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30 text-yellow-400',
                          enemy: 'from-red-500/20 to-pink-500/10 border-red-500/30 text-red-400',
                          boss: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
                          extraction: 'from-green-500/20 to-emerald-500/10 border-green-500/30 text-green-400',
                          poi: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-400',
                          other: 'from-gray-500/20 to-slate-500/10 border-gray-500/30 text-gray-400',
                        };
                        const color = colors[type] || colors.other;
                        
                        return (
                          <div
                            key={type}
                            className={`px-4 py-2 bg-gradient-to-br ${color} border rounded-lg`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold">{count}</span>
                              <span className="text-sm capitalize">{type}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <MapPin className="text-gray-600 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-400 mb-2">No markers yet!</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Abre cualquier mapa interactivo y empieza a marcar tus ubicaciones favoritas. 
                  Marca zonas de loot, enemigos, bosses, extracciones y más.
                </p>
                <button
                  onClick={() => handleOpenInteractiveMap('Dam')}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all inline-flex items-center gap-2"
                >
                  <MapPin size={18} />
                  Explorar Dam Map
                </button>
              </div>
            )}
          </div>

          {/* Loot Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {locations
              .filter(loc => loc.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((location, index) => {
                const colors = [
                  { bg: 'from-blue-500/30 to-cyan-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
                  { bg: 'from-purple-500/30 to-pink-500/20', border: 'border-purple-500/50', text: 'text-purple-400' },
                  { bg: 'from-green-500/30 to-emerald-500/20', border: 'border-green-500/50', text: 'text-green-400' },
                  { bg: 'from-orange-500/30 to-red-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
                  { bg: 'from-cyan-500/30 to-teal-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
                ];
                const color = colors[index % colors.length];

                return (
                  <button
                    key={location.name}
                    onClick={() => setSelectedLocation(location.name)}
                    className={`p-4 bg-gradient-to-br ${color.bg} border ${color.border} rounded-xl hover:shadow-lg transition-all text-left group`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 bg-[#0a0e1a] rounded-lg border ${color.border}`}>
                        <MapPin className={color.text} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className={`font-bold ${color.text} group-hover:text-white transition-colors truncate`}>
                            {location.name}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-400">
                          {location.totalItems} items in this category
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-[#0a0e1a]/50 rounded px-2 py-1">
                        <p className="text-xs text-gray-500">Keys</p>
                        <p className={`text-sm font-bold ${color.text}`}>{location.keys?.length || 0}</p>
                      </div>
                      <div className="bg-[#0a0e1a]/50 rounded px-2 py-1">
                        <p className="text-xs text-gray-500">Materials</p>
                        <p className={`text-sm font-bold ${color.text}`}>{location.materials?.length || 0}</p>
                      </div>
                      <div className="bg-[#0a0e1a]/50 rounded px-2 py-1">
                        <p className="text-xs text-gray-500">Equipment</p>
                        <p className={`text-sm font-bold ${color.text}`}>{location.equipment?.length || 0}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {Object.entries(location.rarityBreakdown || {})
                        .filter(([, count]) => count > 0)
                        .slice(0, 4)
                        .map(([rarity, count]) => (
                          <span
                            key={rarity}
                            className={`text-xs px-2 py-0.5 rounded ${getRarityColor(rarity)}`}
                          >
                            {rarity}: {count}
                          </span>
                        ))}
                    </div>
                  </button>
                );
              })}
          </div>
        </>
      ) : isGameMap && currentGameMap ? (
        <div className="space-y-6">
          <button
            onClick={() => {
              setSelectedLocation(null);
              setSearchQuery('');
              setFilterRarity('all');
            }}
            className="px-4 py-2 bg-[#1a1f2e] border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            ← Back to Maps & Categories
          </button>

          {/* Full Game Map View */}
          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/30 rounded-xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{selectedLocation}</h2>
                <p className="text-gray-400 text-sm">
                  Mapa interactivo de alta resolución con marcadores personalizables
                </p>
              </div>
              <button
                onClick={() => handleOpenInteractiveMap(selectedLocation)}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 text-sm transition-colors whitespace-nowrap"
              >
                <MapPin size={16} />
                Ver en Pantalla Completa
              </button>
            </div>
            
            <div className="relative rounded-lg overflow-hidden border border-cyan-500/20 bg-[#0a0e1a]">
              <img 
                src={currentGameMap.image} 
                alt={`${selectedLocation} map`}
                className="w-full h-auto"
                style={{ imageRendering: '-webkit-optimize-contrast', maxWidth: '100%', height: 'auto' }}
              />
            </div>
            
            <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="text-cyan-400 flex-shrink-0 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm text-cyan-400 font-medium mb-1">Sobre Este Mapa</p>
                  <p className="text-xs text-gray-400">
                    Mapa interactivo de alta resolución. Haz click en cualquier punto del mapa para añadir marcadores personalizados, 
                    cargar imágenes y guardar ubicaciones importantes. Todos tus marcadores se guardan automáticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : currentLocation && (
        <div className="space-y-6">
          <button
            onClick={() => {
              setSelectedLocation(null);
              setSearchQuery('');
              setFilterRarity('all');
            }}
            className="px-4 py-2 bg-[#1a1f2e] border border-cyan-500/30 rounded-lg text-cyan-400 hover:bg-cyan-500/10 transition-colors"
          >
            ← Back to Maps & Categories
          </button>

          <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-cyan-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
                <MapIcon className="text-cyan-400" size={32} />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">{currentLocation.name}</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Loot category with {currentLocation.totalItems} catalogued items
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <span className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <Key size={16} className="text-yellow-400" />
                    <span className="text-sm">
                      <span className="text-yellow-400 font-bold">{currentLocation.keys?.length || 0}</span>
                      <span className="text-gray-400 ml-1">Access Keys</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg">
                    <Package size={16} className="text-purple-400" />
                    <span className="text-sm">
                      <span className="text-purple-400 font-bold">{currentLocation.materials?.length || 0}</span>
                      <span className="text-gray-400 ml-1">Materials</span>
                    </span>
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <Layers size={16} className="text-green-400" />
                    <span className="text-sm">
                      <span className="text-green-400 font-bold">{currentLocation.equipment?.length || 0}</span>
                      <span className="text-gray-400 ml-1">Equipment</span>
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-cyan-500/20">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Rarity Distribution</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(currentLocation.rarityBreakdown || {}).map(([rarity, count]) => (
                  <button
                    key={rarity}
                    onClick={() => setFilterRarity(filterRarity === rarity ? 'all' : rarity)}
                    className={`px-3 py-1 rounded-lg border text-sm font-medium transition-all ${
                      filterRarity === rarity
                        ? getRarityColor(rarity)
                        : 'bg-[#0a0e1a] border-gray-700/50 text-gray-400 hover:border-cyan-500/30'
                    }`}
                  >
                    {rarity}: {count}
                  </button>
                ))}
                {filterRarity !== 'all' && (
                  <button
                    onClick={() => setFilterRarity('all')}
                    className="px-3 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search items in this location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#1a1f2e] border border-cyan-500/20 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="space-y-6">
            {currentLocation.keys && currentLocation.keys.length > 0 && (
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-yellow-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Key className="text-yellow-400" size={24} />
                  Access Keys ({filteredItems(currentLocation.keys || []).length})
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredItems(currentLocation.keys).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="bg-[#0a0e1a] border border-gray-700/50 rounded-lg p-3 hover:border-yellow-500/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {item.image_urls?.thumb && (
                          <img
                            src={item.image_urls.thumb}
                            alt={item.arcforge_name}
                            className="w-12 h-12 object-contain rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {item.arcforge_name || item.name}
                          </h4>
                          <p className={`text-xs ${getRarityColor(item.infobox_full?.rarity || '')}`}>
                            {item.infobox_full?.rarity}
                          </p>
                          {item.infobox_full?.weight && (
                            <p className="text-xs text-gray-500 mt-1">
                              Weight: {item.infobox_full.weight}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentLocation.materials && currentLocation.materials.length > 0 && (
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Package className="text-purple-400" size={24} />
                  Materials & Crafting Components ({filteredItems(currentLocation.materials || []).length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {filteredItems(currentLocation.materials).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="bg-[#0a0e1a] border border-gray-700/50 rounded-lg p-2 hover:border-purple-500/50 transition-colors"
                    >
                      <div className="aspect-square bg-[#0f1420] rounded mb-2 flex items-center justify-center overflow-hidden">
                        {item.image_urls?.thumb ? (
                          <img
                            src={item.image_urls.thumb}
                            alt={item.arcforge_name}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Package className="text-gray-600" size={24} />
                        )}
                      </div>
                      <h4 className="text-xs font-medium text-white truncate" title={item.arcforge_name}>
                        {item.arcforge_name || item.name}
                      </h4>
                      <p className={`text-xs ${getRarityColor(item.infobox_full?.rarity || '')}`}>
                        {item.infobox_full?.rarity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentLocation.equipment && currentLocation.equipment.length > 0 && (
              <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border border-green-500/30 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Layers className="text-green-400" size={24} />
                  Equipment & Other Items ({filteredItems(currentLocation.equipment || []).length})
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredItems(currentLocation.equipment).map((item: any, index: number) => (
                    <div
                      key={index}
                      className="bg-[#0a0e1a] border border-gray-700/50 rounded-lg p-3 hover:border-green-500/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {item.image_urls?.thumb && (
                          <img
                            src={item.image_urls.thumb}
                            alt={item.arcforge_name}
                            className="w-12 h-12 object-contain rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-white truncate">
                            {item.arcforge_name || item.name}
                          </h4>
                          <p className={`text-xs ${getRarityColor(item.infobox_full?.rarity || '')}`}>
                            {item.infobox_full?.rarity}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.infobox_full?.type}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="text-cyan-400 flex-shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-sm text-cyan-400 font-medium mb-1">Data Source Information</p>
                <p className="text-xs text-gray-400">
                  This location data is compiled from the game's item database. Items shown are confirmed spawns 
                  catalogued in the game files. For interactive map coordinates and visual representations, 
                  refer to community resources like MetaForge.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

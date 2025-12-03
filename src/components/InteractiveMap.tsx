import { useEffect, useState } from 'react';
import { MapContainer, ImageOverlay, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Trash2, Plus, Save, Image as ImageIcon, MessageSquare, Cloud, CloudOff, Download, Upload } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// Fix para los iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GameMap {
  name: string;
  image: string;
  width: number;
  height: number;
  markers?: MapMarker[];
}

interface MapMarker {
  id: string;
  position: [number, number]; // [y, x] en coordenadas de la imagen
  title: string;
  description?: string;
  image?: string;
  rarity?: string;
  type?: string;
  isCustom?: boolean; // Para distinguir marcadores del usuario
  comment?: string; // Comentario adicional del usuario
  imageData?: string; // Base64 de la imagen subida
}

export interface InteractiveMapProps {
  mapName: string;
  onClose: () => void;
}

// Configuración de los mapas con sus dimensiones reales (1700x1166 según archivos)
const GAME_MAPS: Record<string, GameMap> = {
  'Dam': {
    name: 'Dam',
    image: '/maps/dam-real.jpg',
    width: 7000,
    height: 7000,
    markers: [
      {
        id: '1',
        position: [3500, 3500], // Centro del mapa
        title: 'Dam Central Area',
        description: 'Zona central de la presa - Alto tráfico de loot',
        type: 'location'
      },
      {
        id: '2',
        position: [1500, 3500],
        title: 'North Loot Zone',
        description: 'Zona norte con contenedores de armamento',
        type: 'loot'
      },
      {
        id: '3',
        position: [5500, 3500],
        title: 'South Entrance',
        description: 'Entrada principal sur',
        type: 'entrance'
      },
      {
        id: '4',
        position: [3500, 1500],
        title: 'West Power Station',
        description: 'Estación de energía occidental',
        type: 'location'
      },
      {
        id: '5',
        position: [3500, 5500],
        title: 'East Control Tower',
        description: 'Torre de control este - Vista estratégica',
        type: 'location'
      }
    ]
  },
  'Blue Gate': {
    name: 'Blue Gate',
    image: '/maps/blue-gate-real.jpg',
    width: 4096,
    height: 4096,
    markers: [
      {
        id: '4',
        position: [2048, 2048],
        title: 'Blue Gate Central',
        description: 'Zona central del complejo',
        type: 'location'
      },
      {
        id: '5',
        position: [1400, 2048],
        title: 'Main Gate Entrance',
        description: 'Entrada principal - Spawn point',
        type: 'entrance'
      },
      {
        id: '6',
        position: [2700, 2048],
        title: 'South Area',
        description: 'Área sur del complejo',
        type: 'location'
      },
      {
        id: '7',
        position: [2048, 1200],
        title: 'West Wing',
        description: 'Ala oeste - Zona industrial',
        type: 'location'
      },
      {
        id: '8',
        position: [2048, 2900],
        title: 'East Sector',
        description: 'Sector este - Almacenes',
        type: 'loot'
      }
    ]
  },
  'Buried City': {
    name: 'Buried City',
    image: '/maps/buried-city-real.jpg',
    width: 2610,
    height: 1983,
    markers: [
      {
        id: '6',
        position: [991, 1305], // Centro del mapa
        title: 'Buried City Center',
        description: 'Centro de la ciudad enterrada - Ruinas principales',
        type: 'location'
      },
      {
        id: '7',
        position: [700, 1500],
        title: 'Underground Vault',
        description: 'Bóveda subterránea con loot legendario',
        type: 'loot'
      },
      {
        id: '8',
        position: [1200, 900],
        title: 'East Excavation Site',
        description: 'Sitio de excavación este',
        type: 'location'
      },
      {
        id: '9',
        position: [500, 800],
        title: 'North Raider Camp',
        description: 'Campamento de asaltantes - Zona peligrosa',
        type: 'enemy'
      },
      {
        id: '10',
        position: [1500, 2000],
        title: 'South Supply Depot',
        description: 'Depósito de suministros - Materiales de construcción',
        type: 'loot'
      }
    ]
  },
  'Stella Montis': {
    name: 'Stella Montis',
    image: '/maps/stella-montis-real.jpg',
    width: 1700,
    height: 1166,
    markers: [
      {
        id: '9',
        position: [583, 850],
        title: 'Stella Montis Center',
        description: 'Centro del complejo Stella Montis',
        type: 'location'
      },
      {
        id: '10',
        position: [500, 950],
        title: 'Metro Station',
        description: 'Estación de metro - Punto de extracción',
        type: 'entrance'
      },
      {
        id: '11',
        position: [700, 700],
        title: 'Research Labs',
        description: 'Laboratorios de investigación - Loot tecnológico',
        type: 'loot'
      }
    ]
  },
  'Spaceport': {
    name: 'Spaceport',
    image: '/maps/spaceport-real.jpg',
    width: 1700,
    height: 1166,
    markers: [
      {
        id: '12',
        position: [583, 850],
        title: 'Spaceport Central',
        description: 'Torre de control central',
        type: 'location'
      },
      {
        id: '13',
        position: [470, 1050],
        title: 'Launch Pad Alpha',
        description: 'Plataforma de lanzamiento A - Loot épico',
        type: 'loot'
      },
      {
        id: '14',
        position: [700, 650],
        title: 'Hangar Bay',
        description: 'Bahía de hangares - Zona de extracción',
        type: 'entrance'
      },
      {
        id: '15',
        position: [400, 500],
        title: 'Fuel Depot',
        description: 'Depósito de combustible - Materiales',
        type: 'loot'
      }
    ]
  }
};

// Componente para ajustar la vista del mapa
function MapController({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  
  useEffect(() => {
    // Ajustar vista con padding para mostrar mapa completo
    map.fitBounds(bounds, {
      padding: [80, 80],
      maxZoom: -1,
      animate: true
    });
  }, [map, bounds]);
  
  return null;
}

// Componente para capturar clicks en el mapa
function MapClickHandler({ 
  onMapClick, 
  isAddingMarker 
}: { 
  onMapClick: (latlng: L.LatLng) => void;
  isAddingMarker: boolean;
}) {
  const map = useMapEvents({
    click(e) {
      if (isAddingMarker) {
        console.log('Click detectado en:', e.latlng);
        onMapClick(e.latlng);
      }
    },
  });
  
  useEffect(() => {
    if (isAddingMarker) {
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.getContainer().style.cursor = '';
    }
  }, [isAddingMarker, map]);
  
  return null;
}

const InteractiveMap = ({ mapName, onClose }: InteractiveMapProps) => {
  const mapConfig = GAME_MAPS[mapName];
  const [isLoading, setIsLoading] = useState(true);
  const [customMarkers, setCustomMarkers] = useState<MapMarker[]>([]);
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [showMarkerForm, setShowMarkerForm] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<[number, number] | null>(null);
  const [markerForm, setMarkerForm] = useState({
    title: '',
    description: '',
    type: 'custom',
    comment: '',
    imageData: ''
  });

  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('synced');
  const [user, setUser] = useState<any>(null);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);

  // Verificar usuario y migración
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    // Solo establecer usuario si también hay token válido
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Verificar si hay marcadores en localStorage que necesitan migrarse
  useEffect(() => {
    if (user) {
      const localStorageKey = `custom-markers-${mapName}`;
      const localMarkers = localStorage.getItem(localStorageKey);
      
      if (localMarkers) {
        try {
          const markers = JSON.parse(localMarkers);
          if (markers.length > 0) {
            // Mostrar diálogo de migración
            setShowMigrationDialog(true);
          }
        } catch (e) {
          console.error('Error parsing local markers:', e);
        }
      }
    }
  }, [user, mapName]);

  // Cargar marcadores desde MongoDB
  useEffect(() => {
    if (user && !showMigrationDialog) {
      loadMarkersFromDB();
    } else if (!user) {
      // Cargar desde localStorage si no hay usuario
      loadMarkersFromLocalStorage();
    }
  }, [mapName, user, showMigrationDialog]);

  const loadMarkersFromDB = async () => {
    // Verificar que hay token antes de intentar cargar
    const token = localStorage.getItem('token');
    if (!token) {
      setSyncStatus('offline');
      loadMarkersFromLocalStorage();
      return;
    }

    try {
      setSyncStatus('syncing');
      const markers = await api.get(`/markers/${mapName}`);
      
      // Convertir formato de DB a formato del componente
      const formattedMarkers = markers.map((m: any) => ({
        id: m._id,
        position: [m.position.lat, m.position.lng] as [number, number],
        title: m.title,
        description: m.description,
        type: m.type,
        isCustom: true,
        comment: m.description,
        imageData: m.image
      }));
      
      setCustomMarkers(formattedMarkers);
      setSyncStatus('synced');
      
      // También guardar en localStorage como backup
      localStorage.setItem(`custom-markers-${mapName}`, JSON.stringify(formattedMarkers));
    } catch (error: any) {
      console.error('Error loading markers from DB:', error);
      setSyncStatus('offline');
      
      // Solo mostrar error si no es un problema de autenticación
      if (!error.message?.includes('Token') && !error.message?.includes('permisos')) {
        toast.error('No se pudieron cargar los marcadores. Usando caché local.');
      }
      
      loadMarkersFromLocalStorage();
    }
  };

  const loadMarkersFromLocalStorage = () => {
    const savedMarkers = localStorage.getItem(`custom-markers-${mapName}`);
    if (savedMarkers) {
      try {
        setCustomMarkers(JSON.parse(savedMarkers));
      } catch (e) {
        console.error('Error loading custom markers:', e);
      }
    }
  };

  // Guardar marcador en MongoDB
  const saveMarkerToDB = async (marker: MapMarker) => {
    if (!user) {
      toast.error('Debes iniciar sesión para guardar marcadores en la nube');
      return false;
    }

    try {
      setSyncStatus('syncing');
      const markerData = {
        map_name: mapName,
        position: {
          lat: marker.position[0],
          lng: marker.position[1]
        },
        title: marker.title,
        description: marker.description || marker.comment || '',
        type: marker.type,
        image: marker.imageData || null,
        is_public: false
      };

      const savedMarker = await api.post('/markers', markerData);
      setSyncStatus('synced');
      toast.success('Marcador guardado en la nube');
      return savedMarker;
    } catch (error) {
      console.error('Error saving marker to DB:', error);
      setSyncStatus('offline');
      toast.error('Error al guardar en la nube. Guardado localmente.');
      return false;
    }
  };

  // Eliminar marcador de MongoDB
  const deleteMarkerFromDB = async (markerId: string) => {
    if (!user) return;

    try {
      setSyncStatus('syncing');
      await api.delete(`/markers/${markerId}`);
      setSyncStatus('synced');
      toast.success('Marcador eliminado');
    } catch (error) {
      console.error('Error deleting marker from DB:', error);
      setSyncStatus('offline');
      toast.error('Error al eliminar de la nube');
    }
  };

  // Guardar marcadores (compatible con versión anterior)
  const saveCustomMarkers = (markers: MapMarker[]) => {
    localStorage.setItem(`custom-markers-${mapName}`, JSON.stringify(markers));
    setCustomMarkers(markers);
  };

  // Manejar click en el mapa para agregar marcador
  const handleMapClick = (latlng: L.LatLng) => {
    console.log('handleMapClick llamado:', latlng, 'isAddingMarker:', isAddingMarker);
    if (isAddingMarker) {
      const position: [number, number] = [latlng.lat, latlng.lng];
      console.log('Posición guardada:', position);
      setPendingPosition(position);
      setShowMarkerForm(true);
      setIsAddingMarker(false);
    }
  };

  // Agregar nuevo marcador personalizado
  const handleAddMarker = async () => {
    if (!pendingPosition || !markerForm.title.trim()) return;

    const newMarker: MapMarker = {
      id: `custom-${Date.now()}`,
      position: pendingPosition,
      title: markerForm.title,
      description: markerForm.description,
      type: markerForm.type,
      isCustom: true,
      comment: markerForm.comment,
      imageData: markerForm.imageData
    };

    // Guardar localmente primero
    const updatedMarkers = [...customMarkers, newMarker];
    saveCustomMarkers(updatedMarkers);

    // Si hay usuario, guardar en DB
    if (user) {
      const savedMarker = await saveMarkerToDB(newMarker);
      if (savedMarker) {
        // Actualizar el ID temporal con el ID real de la DB
        newMarker.id = savedMarker._id;
        const markersWithRealId = updatedMarkers.map(m => 
          m.id === `custom-${Date.now()}` ? newMarker : m
        );
        saveCustomMarkers(markersWithRealId);
      }
    }
    
    // Reset form
    setMarkerForm({ title: '', description: '', type: 'custom', comment: '', imageData: '' });
    setPendingPosition(null);
    setShowMarkerForm(false);
  };

  // Eliminar marcador personalizado
  const handleDeleteMarker = async (markerId: string) => {
    const updatedMarkers = customMarkers.filter(m => m.id !== markerId);
    saveCustomMarkers(updatedMarkers);

    // Si hay usuario, eliminar de DB
    if (user && !markerId.startsWith('custom-')) {
      await deleteMarkerFromDB(markerId);
    }
  };

  // Cancelar adición de marcador
  const handleCancelMarker = () => {
    setShowMarkerForm(false);
    setPendingPosition(null);
    setIsAddingMarker(false);
    setMarkerForm({ title: '', description: '', type: 'custom', comment: '', imageData: '' });
  };

  // Manejar subida de imagen
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Máximo 2MB.');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      setMarkerForm({ ...markerForm, imageData });
    };
    reader.readAsDataURL(file);
  };
  
  if (!mapConfig) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Mapa no encontrado</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // Export markers to JSON file
  const handleExportMarkers = async () => {
    try {
      const response = await api.get('/markers/export/all');
      const dataStr = JSON.stringify(response, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `arc-raiders-markers-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Marcadores exportados correctamente');
    } catch (error) {
      console.error('Error exporting markers:', error);
      toast.error('Error al exportar los marcadores');
    }
  };

  // Import markers from JSON file
  const handleImportMarkers = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const markersData = JSON.parse(text);
      
      await api.post('/markers/import', markersData);
      toast.success('Marcadores importados correctamente');
      
      // Reload markers from DB
      await loadMarkersFromDB();
    } catch (error) {
      console.error('Error importing markers:', error);
      toast.error('Error al importar los marcadores. Verifica que el archivo sea válido.');
    }
    
    // Reset input
    event.target.value = '';
  };

  // Migrate markers from localStorage to MongoDB
  const handleMigrateMarkers = async () => {
    try {
      const localStorageKey = `custom-markers-${mapName}`;
      const localMarkers = localStorage.getItem(localStorageKey);
      
      if (!localMarkers) {
        toast.error('No hay marcadores locales para migrar');
        return;
      }

      const markers = JSON.parse(localMarkers);
      
      // Convert to DB format
      const markersToMigrate = markers.map((m: MapMarker) => ({
        map_name: mapName,
        position: {
          lat: m.position[0],
          lng: m.position[1]
        },
        title: m.title,
        description: m.description || m.comment || '',
        type: m.type || 'custom',
        image: m.imageData || '',
        is_public: false
      }));

      await api.post('/markers/migrate', { markers: markersToMigrate });
      
      // Clear localStorage after successful migration
      localStorage.removeItem(localStorageKey);
      
      toast.success(`${markers.length} marcadores migrados correctamente`);
      setShowMigrationDialog(false);
      
      // Load from DB
      await loadMarkersFromDB();
    } catch (error) {
      console.error('Error migrating markers:', error);
      toast.error('Error al migrar los marcadores');
    }
  };

  // Skip migration and keep using localStorage
  const handleSkipMigration = () => {
    setShowMigrationDialog(false);
    loadMarkersFromLocalStorage();
  };

  // Calcular los límites del mapa basados en las dimensiones de la imagen
  const bounds: L.LatLngBoundsExpression = [
    [0, 0],
    [mapConfig.height, mapConfig.width]
  ];

  // Crear iconos personalizados según el tipo de marcador
  const getMarkerIcon = (type?: string, isCustom?: boolean) => {
    const iconSize: [number, number] = [32, 32];
    const iconAnchor: [number, number] = [16, 32];
    
    let iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
    
    // Iconos para marcadores personalizados
    if (isCustom) {
      iconUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iIzhhMmJlMiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=';
    } else {
      // Iconos para marcadores predefinidos
      switch (type) {
        case 'loot':
          iconUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iI2ZmYzEwNyIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=';
          break;
        case 'entrance':
          iconUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iIzRhZGRlNyIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=';
          break;
        case 'enemy':
          iconUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iI2RjMjYyNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=';
          break;
        default:
          iconUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxMiIgZmlsbD0iI2VmNDQ0NCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=';
      }
    }
    
    return new L.Icon({
      iconUrl,
      iconSize,
      iconAnchor,
      popupAnchor: [0, -32]
    });
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold text-white">{mapConfig.name}</h2>
              <p className="text-gray-400 text-sm">
                Mapa interactivo - Zoom y pan habilitados
              </p>
            </div>
            {/* Sync Status Indicator */}
            {user && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                syncStatus === 'synced' 
                  ? 'bg-green-600/20 text-green-400' 
                  : syncStatus === 'syncing'
                  ? 'bg-yellow-600/20 text-yellow-400'
                  : 'bg-gray-600/20 text-gray-400'
              }`}>
                {syncStatus === 'synced' ? (
                  <>
                    <Cloud size={16} />
                    <span>Sincronizado</span>
                  </>
                ) : syncStatus === 'syncing' ? (
                  <>
                    <Cloud size={16} className="animate-pulse" />
                    <span>Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <CloudOff size={16} />
                    <span>Sin conexión</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddingMarker(!isAddingMarker)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                isAddingMarker 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
            >
              {isAddingMarker ? (
                <>
                  <span>✕</span>
                  <span>Cancelar</span>
                </>
              ) : (
                <>
                  <Plus size={18} />
                  <span>Agregar Marcador</span>
                </>
              )}
            </button>
            {customMarkers.length > 0 && (
              <span className="px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg text-sm flex items-center gap-2">
                <MapPin size={16} />
                {customMarkers.length} personalizados
              </span>
            )}
            {/* Export/Import Buttons */}
            {user && customMarkers.length > 0 && (
              <>
                <button
                  onClick={handleExportMarkers}
                  className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-all flex items-center gap-2 text-sm"
                  title="Exportar marcadores"
                >
                  <Download size={16} />
                  <span>Exportar</span>
                </button>
                <button
                  onClick={() => document.getElementById('import-markers-input')?.click()}
                  className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-all flex items-center gap-2 text-sm"
                  title="Importar marcadores"
                >
                  <Upload size={16} />
                  <span>Importar</span>
                </button>
                <input
                  id="import-markers-input"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportMarkers}
                />
              </>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors flex items-center gap-2"
        >
          <span>✕</span>
          <span>Cerrar</span>
        </button>
      </div>

      {/* Controles de ayuda */}
      <div className="absolute top-24 right-4 bg-gray-900/90 backdrop-blur-sm z-10 p-4 rounded-lg text-white text-sm max-w-xs">
        <h3 className="font-bold mb-2">Controles:</h3>
        <ul className="space-y-1 text-gray-300">
          <li>🖱️ <strong>Arrastra</strong> para mover el mapa</li>
          <li>🔍 <strong>Scroll</strong> para hacer zoom</li>
          <li>📍 <strong>Click en marcadores</strong> para ver detalles</li>
          {isAddingMarker && (
            <li className="text-cyan-400">📌 <strong>Click en el mapa</strong> para colocar marcador</li>
          )}
        </ul>
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-purple-400">
            💡 Usa el botón "Agregar Marcador" para marcar tus ubicaciones favoritas
          </p>
        </div>
      </div>

      {/* Indicador de modo agregar marcador */}
      {isAddingMarker && (
        <div className="absolute top-32 left-1/2 transform -translate-x-1/2 bg-cyan-600 text-white px-6 py-3 rounded-full shadow-lg z-10 flex items-center gap-3 animate-pulse">
          <MapPin size={20} />
          <span className="font-medium">Click en el mapa para colocar el marcador</span>
        </div>
      )}

      {/* Mapa interactivo */}
      <div className="w-full h-full pt-20">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white text-lg">Cargando mapa de {mapConfig.name}...</p>
            </div>
          </div>
        )}
        
        <MapContainer
          center={[mapConfig.height / 2, mapConfig.width / 2]}
          zoom={-2}
          minZoom={-3}
          maxZoom={2}
          crs={L.CRS.Simple}
          style={{ 
            height: '100%', 
            width: '100%', 
            background: '#1a1a1a'
          }}
          zoomControl={true}
          attributionControl={false}
          preferCanvas={false}
          zoomAnimation={true}
          scrollWheelZoom={true}
          doubleClickZoom={!isAddingMarker}
          dragging={true}
        >
          <MapController bounds={bounds} />
          <MapClickHandler onMapClick={handleMapClick} isAddingMarker={isAddingMarker} />
          
          <ImageOverlay
            url={mapConfig.image}
            bounds={bounds}
            opacity={1}
            zIndex={1}
            interactive={false}
            bubblingMouseEvents={true}
            eventHandlers={{
              load: () => {
                setIsLoading(false);
              }
            }}
          />

          {/* Marcadores predefinidos */}
          {mapConfig.markers?.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              icon={getMarkerIcon(marker.type, false)}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-bold text-lg mb-2">{marker.title}</h3>
                  {marker.description && (
                    <p className="text-gray-600 mb-2">{marker.description}</p>
                  )}
                  {marker.type && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {marker.type}
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Marcadores personalizados */}
          {customMarkers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              icon={getMarkerIcon(marker.type, true)}
            >
              <Popup maxWidth={320} minWidth={250}>
                <div className="text-sm">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg text-gray-900">{marker.title}</h3>
                    <button
                      onClick={() => handleDeleteMarker(marker.id)}
                      className="ml-2 p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                      title="Eliminar marcador"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  {marker.imageData && (
                    <div className="mb-3 -mx-3 -mt-3">
                      <img 
                        src={marker.imageData} 
                        alt={marker.title}
                        className="w-full h-auto rounded-t"
                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  
                  {marker.description && (
                    <div className="mb-3">
                      <p className="text-gray-700 leading-relaxed">{marker.description}</p>
                    </div>
                  )}
                  
                  {marker.comment && (
                    <div className="mb-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare size={14} className="text-blue-600" />
                        <p className="text-xs text-blue-600 font-semibold uppercase">Lo que viste:</p>
                      </div>
                      <p className="text-gray-800 text-sm leading-relaxed">{marker.comment}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                      <MapPin size={12} />
                      Personalizado
                    </span>
                    {marker.type && marker.type !== 'custom' && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium capitalize">
                        {marker.type}
                      </span>
                    )}
                    {marker.imageData && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        <ImageIcon size={12} />
                        Con imagen
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-gray-900/90 backdrop-blur-sm z-10 p-4 rounded-lg">
        <h3 className="text-white font-bold mb-3">Leyenda:</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
            <span className="text-gray-300">Ubicación</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white"></div>
            <span className="text-gray-300">Loot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-cyan-500 border-2 border-white"></div>
            <span className="text-gray-300">Entrada</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-700 border-2 border-white"></div>
            <span className="text-gray-300">Enemigo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500 border-2 border-white"></div>
            <span className="text-gray-300">Personalizado</span>
          </div>
        </div>
      </div>

      {/* Modal para agregar marcador */}
      {showMarkerForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border-2 border-cyan-500/50 rounded-lg p-6 max-w-lg w-full shadow-2xl my-4 relative z-[10000]">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="text-cyan-400" />
              Agregar Marcador Personalizado
            </h3>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={markerForm.title}
                  onChange={(e) => setMarkerForm({ ...markerForm, title: e.target.value })}
                  placeholder="Ej: Campamento enemigo, Cofre de loot..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ¿Qué es este lugar? (opcional)
                </label>
                <textarea
                  value={markerForm.description}
                  onChange={(e) => setMarkerForm({ ...markerForm, description: e.target.value })}
                  placeholder="Describe qué hay en esta ubicación..."
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ¿Qué viste aquí? (opcional)
                </label>
                <textarea
                  value={markerForm.comment}
                  onChange={(e) => setMarkerForm({ ...markerForm, comment: e.target.value })}
                  placeholder="Enemigos, items encontrados, estrategias..."
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subir imagen (opcional)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-cyan-600 file:text-white file:cursor-pointer hover:file:bg-cyan-700"
                  />
                  {markerForm.imageData && (
                    <div className="relative">
                      <img 
                        src={markerForm.imageData} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded border border-gray-700"
                      />
                      <button
                        onClick={() => setMarkerForm({ ...markerForm, imageData: '' })}
                        className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">Máximo 2MB - JPG, PNG, GIF</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de marcador
                </label>
                <select
                  value={markerForm.type}
                  onChange={(e) => setMarkerForm({ ...markerForm, type: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="custom">Personalizado</option>
                  <option value="loot">Loot / Botín</option>
                  <option value="location">Ubicación importante</option>
                  <option value="entrance">Entrada / Salida</option>
                  <option value="enemy">Enemigo / Peligro</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4 mt-4 border-t border-gray-700">
              <button
                onClick={handleAddMarker}
                disabled={!markerForm.title.trim()}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Guardar Marcador
              </button>
              <button
                onClick={handleCancelMarker}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Migration Dialog */}
      {showMigrationDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg border border-cyan-500/30 max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-cyan-600/20 rounded-lg">
                <Cloud size={24} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Migrar Marcadores</h3>
                <p className="text-sm text-gray-400">Sincroniza tus marcadores con la nube</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                Hemos detectado que tienes marcadores guardados localmente en este mapa. 
                Ahora puedes sincronizarlos con tu cuenta para:
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span>Acceder desde cualquier dispositivo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span>No perder tu progreso</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span>Backup automático en la nube</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleMigrateMarkers}
                className="flex-1 px-4 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <Cloud size={18} />
                Migrar Ahora
              </button>
              <button
                onClick={handleSkipMigration}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors"
              >
                Ahora No
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Los marcadores locales se eliminarán después de la migración exitosa
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;

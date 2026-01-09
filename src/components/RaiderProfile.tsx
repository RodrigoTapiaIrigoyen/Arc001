/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Sword, Shield, Users, Zap, Save, Edit2, Eye, Trophy, Target, Heart } from 'lucide-react';
import toast from 'react-hot-toast';

interface RaiderProfile {
  _id?: string;
  user_id: string;
  username: string;
  avatar?: string;
  
  // Configuración del Raider
  equipment: 'heavy' | 'light' | 'mixed';
  strategy: 'aggressive' | 'passive' | 'extraction';
  company: 'solo' | 'duo' | 'trio';
  
  // Raider Type (generado automáticamente)
  raider_type: string;
  raider_description: string;
  raider_emoji: string;
  
  // Estadísticas de Comunidad
  community_reputation: number;
  posts_shared: number;
  groups_created: number;
  friends_count: number;
  days_in_community: number;
  
  // Preferencias
  preferred_weapons: string[];
  playstyle_notes: string;
  
  created_at: Date;
  updated_at: Date;
}

export default function RaiderProfile() {
  const [profile, setProfile] = useState<RaiderProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    equipment: 'light' as const,
    strategy: 'extraction' as const,
    company: 'solo' as const,
    preferred_weapons: [] as string[],
    playstyle_notes: ''
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        fetchProfile(user.userId);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/raider-profiles/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setFormData({
          equipment: data.profile.equipment,
          strategy: data.profile.strategy,
          company: data.profile.company,
          preferred_weapons: data.profile.preferred_weapons || [],
          playstyle_notes: data.profile.playstyle_notes || ''
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateRaiderType = (equipment: string, strategy: string, company: string) => {
    // Lógica para determinar el tipo de raider
    if (strategy === 'passive' && equipment === 'light') {
      return { type: 'Rat', emoji: '🐀', description: 'Sigiloso y evasivo, ataca desde las sombras' };
    } else if (strategy === 'aggressive' && equipment === 'heavy') {
      return { type: 'Roof Rat', emoji: '🏹', description: 'Francotirador desde las alturas con equipo pesado' };
    } else if (strategy === 'extraction' && equipment === 'light' && company === 'solo') {
      return { type: 'Carroñero', emoji: '🦅', description: 'Superviviente calculador que espera el momento perfecto' };
    } else if (strategy === 'aggressive' && equipment === 'mixed') {
      return { type: 'Veterano', emoji: '⚔️', description: 'Jugador experimentado y versátil' };
    } else if (strategy === 'extraction' && company === 'trio') {
      return { type: 'Escuadrón Élite', emoji: '🛡️', description: 'Equipo coordinado de extractores profesionales' };
    } else if (strategy === 'extraction' && equipment === 'light') {
      return { type: 'Freebie Fred', emoji: '🎒', description: 'Extractor con equipo básico' };
    } else if (company === 'duo') {
      return { type: 'Dúo Mortal', emoji: '👥', description: 'Pareja coordinada y peligrosa' };
    } else {
      return { type: 'Superviviente', emoji: '🌍', description: 'Raider adaptable con estilo único' };
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const raiderType = calculateRaiderType(formData.equipment, formData.strategy, formData.company);

    try {
      const method = profile ? 'PUT' : 'POST';
      const response = await fetch(`${API_URL}/raider-profiles`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          equipment: formData.equipment,
          strategy: formData.strategy,
          company: formData.company,
          preferred_weapons: formData.preferred_weapons,
          playstyle_notes: formData.playstyle_notes,
          raider_type: raiderType.type,
          raider_emoji: raiderType.emoji,
          raider_description: raiderType.description
        })
      });

      if (!response.ok) throw new Error('Error al guardar perfil');

      const data = await response.json();
      setProfile(data.profile);
      setIsEditing(false);
      toast.success('¡Perfil actualizado!');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar perfil');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-slate-700 border-t-yellow-400 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sword className="w-5 h-5 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">Tu Perfil de Raider</h1>
          </div>
          <p className="text-slate-300 text-sm">Define tu estilo de juego y sé conocido en la comunidad</p>
        </div>

        {!isEditing && profile ? (
          // Vista de Perfil Completo
          <div className="space-y-4">
            {/* Tarjeta Principal del Raider */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-yellow-400/30 rounded-lg p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={profile.avatar || '/default-avatar.svg'}
                      alt={profile.username}
                      className="w-16 h-16 rounded-full border-2 border-yellow-400"
                    />
                    <div>
                      <h2 className="text-2xl font-bold text-white">{profile.username}</h2>
                      <p className="text-slate-400 text-sm">Raider de Esperanza</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition flex items-center gap-2 text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                </div>

                {/* Clasificación Principal */}
                <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700">
                  <div className="text-center">
                    <div className="text-6xl mb-2">{profile.raider_emoji}</div>
                    <h3 className="text-2xl font-bold text-yellow-400 mb-1">{profile.raider_type}</h3>
                    <p className="text-slate-300">{profile.raider_description}</p>
                  </div>
                </div>

                {/* Características */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-400" />
                      <p className="text-slate-400 text-sm font-medium">Equipo</p>
                    </div>
                    <p className="text-white font-medium capitalize">
                      {profile.equipment === 'heavy' && '🛡️ Armadura Pesada'}
                      {profile.equipment === 'light' && '⚡ Equipo Ligero'}
                      {profile.equipment === 'mixed' && '⚔️ Equipado Mixto'}
                    </p>
                  </div>

                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-orange-400" />
                      <p className="text-slate-400 text-sm font-medium">Estrategia</p>
                    </div>
                    <p className="text-white font-medium capitalize">
                      {profile.strategy === 'aggressive' && '⚡ Agresivo'}
                      {profile.strategy === 'passive' && '🎯 Pasivo'}
                      {profile.strategy === 'extraction' && '💰 Extracción'}
                    </p>
                  </div>

                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-green-400" />
                      <p className="text-slate-400 text-sm font-medium">Compañía</p>
                    </div>
                    <p className="text-white font-medium capitalize">
                      {profile.company === 'solo' && '🚶 Solo'}
                      {profile.company === 'duo' && '👥 Dúo'}
                      {profile.company === 'trio' && '🛡️ Trío'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm">Reputación</p>
                  <Trophy className="w-4 h-4 text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-yellow-400">⭐ {profile.community_reputation}</p>
                <p className="text-slate-500 text-xs mt-1">Puntos de comunidad</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm">Posts</p>
                  <Heart className="w-4 h-4 text-red-400" />
                </div>
                <p className="text-2xl font-bold text-red-400">{profile.posts_shared}</p>
                <p className="text-slate-500 text-xs mt-1">Contribuciones</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm">Amigos</p>
                  <Target className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-blue-400">{profile.friends_count}</p>
                <p className="text-slate-500 text-xs mt-1">En la comunidad</p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-400 text-sm">Tiempo</p>
                  <Eye className="w-4 h-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-400">{profile.days_in_community}d</p>
                <p className="text-slate-500 text-xs mt-1">Días en la comunidad</p>
              </div>
            </div>

            {/* Detalles Adicionales */}
            {(profile.preferred_weapons?.length > 0 || profile.playstyle_notes) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profile.preferred_weapons?.length > 0 && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h3 className="text-white font-bold mb-2">Armas Preferidas</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.preferred_weapons.map((weapon) => (
                        <span key={weapon} className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">
                          {weapon}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.playstyle_notes && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h3 className="text-white font-bold mb-2">Notas de Estilo</h3>
                    <p className="text-slate-300 text-sm">{profile.playstyle_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Formulario de Edición
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
              <h2 className="text-xl font-bold text-white">Configura tu Perfil de Raider</h2>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Equipo */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Tu Equipo
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['heavy', 'light', 'mixed'] as const).map((eq) => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => setFormData({ ...formData, equipment: eq })}
                        className={`p-4 rounded-lg border-2 transition font-medium capitalize ${
                          formData.equipment === eq
                            ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                            : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {eq === 'heavy' && '🛡️ Pesado'}
                        {eq === 'light' && '⚡ Ligero'}
                        {eq === 'mixed' && '⚔️ Mixto'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estrategia */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    <Zap className="w-4 h-4 inline mr-2" />
                    Tu Estrategia
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['aggressive', 'passive', 'extraction'] as const).map((strat) => (
                      <button
                        key={strat}
                        type="button"
                        onClick={() => setFormData({ ...formData, strategy: strat })}
                        className={`p-4 rounded-lg border-2 transition font-medium capitalize ${
                          formData.strategy === strat
                            ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                            : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {strat === 'aggressive' && '⚡ Agresivo'}
                        {strat === 'passive' && '🎯 Pasivo'}
                        {strat === 'extraction' && '💰 Extracción'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compañía */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    <Users className="w-4 h-4 inline mr-2" />
                    Prefieres Jugar
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['solo', 'duo', 'trio'] as const).map((comp) => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => setFormData({ ...formData, company: comp })}
                        className={`p-4 rounded-lg border-2 transition font-medium capitalize ${
                          formData.company === comp
                            ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                            : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {comp === 'solo' && '🚶 Solo'}
                        {comp === 'duo' && '👥 Dúo'}
                        {comp === 'trio' && '🛡️ Trío'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Armas Preferidas */}
                <div>
                  <label className="block text-white font-medium mb-2">Armas Preferidas (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: AK, M4, Mosin, Shotgun (separadas por comas)"
                    value={formData.preferred_weapons.join(', ')}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferred_weapons: e.target.value.split(',').map(w => w.trim()).filter(Boolean)
                    })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-400"
                  />
                </div>

                {/* Notas de Estilo */}
                <div>
                  <label className="block text-white font-medium mb-2">Descripción de tu Estilo (opcional)</label>
                  <textarea
                    placeholder="Cuéntanos más sobre cómo juegas..."
                    value={formData.playstyle_notes}
                    onChange={(e) => setFormData({ ...formData, playstyle_notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:border-yellow-400"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      if (profile) {
                        setFormData({
                          equipment: profile.equipment,
                          strategy: profile.strategy,
                          company: profile.company,
                          preferred_weapons: profile.preferred_weapons || [],
                          playstyle_notes: profile.playstyle_notes || ''
                        });
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

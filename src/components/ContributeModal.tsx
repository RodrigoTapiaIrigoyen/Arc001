import { useState } from 'react';
import { X, Upload, CheckCircle } from 'lucide-react';

interface ContributeModalProps {
  enemyId: string;
  enemyName: string;
  currentStats: {
    hp_min: number;
    hp_max: number;
    damage_min: number;
    damage_max: number;
  };
  onClose: () => void;
  onSubmit: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000/api';

export default function ContributeModal({ enemyId, enemyName, currentStats, onClose, onSubmit }: ContributeModalProps) {
  const [contributionType, setContributionType] = useState<'hp' | 'damage' | 'ability' | 'description'>('hp');
  const [hpMin, setHpMin] = useState(currentStats.hp_min.toString());
  const [hpMax, setHpMax] = useState(currentStats.hp_max.toString());
  const [damageMin, setDamageMin] = useState(currentStats.damage_min.toString());
  const [damageMax, setDamageMax] = useState(currentStats.damage_max.toString());
  const [newAbility, setNewAbility] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [userName, setUserName] = useState('');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let contribution: any = {
        type: contributionType,
        user_name: userName || 'Anonymous',
        evidence: evidence || null,
        auto_approve: false,
      };

      switch (contributionType) {
        case 'hp':
          contribution.old_value = { min: currentStats.hp_min, max: currentStats.hp_max };
          contribution.new_value = { min: parseInt(hpMin), max: parseInt(hpMax) };
          break;
        case 'damage':
          contribution.old_value = { min: currentStats.damage_min, max: currentStats.damage_max };
          contribution.new_value = { min: parseInt(damageMin), max: parseInt(damageMax) };
          break;
        case 'ability':
          contribution.old_value = null;
          contribution.new_value = newAbility;
          break;
        case 'description':
          contribution.old_value = null;
          contribution.new_value = newDescription;
          break;
      }

      const response = await fetch(`${API_URL}/enemies/${enemyId}/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contribution),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSubmit();
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting contribution:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1f2e] rounded-lg p-8 max-w-md w-full text-center border border-green-500/50">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-400 mb-2">¡Contribución Enviada!</h3>
          <p className="text-gray-300">
            Tu contribución está pendiente de aprobación por la comunidad.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1f2e] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-cyan-500/30">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20">
          <h2 className="text-2xl font-bold text-cyan-400">
            Contribuir Stats - {enemyName}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cyan-500/10 rounded-lg transition-colors"
          >
            <X className="text-gray-400" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Tipo de Contribución */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Contribución
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'hp', label: 'HP Stats' },
                { value: 'damage', label: 'Damage Stats' },
                { value: 'ability', label: 'Nueva Habilidad' },
                { value: 'description', label: 'Descripción' },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setContributionType(type.value as 'hp' | 'damage' | 'ability' | 'description')}
                  className={`p-3 rounded-lg border transition-colors ${
                    contributionType === type.value
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                      : 'bg-[#0a0e1a] border-gray-700/30 text-gray-400 hover:border-cyan-500/30'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campos según tipo */}
          {contributionType === 'hp' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  HP Mínimo
                </label>
                <input
                  type="number"
                  value={hpMin}
                  onChange={(e) => setHpMin(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  HP Máximo
                </label>
                <input
                  type="number"
                  value={hpMax}
                  onChange={(e) => setHpMax(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>
            </div>
          )}

          {contributionType === 'damage' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Damage Mínimo
                </label>
                <input
                  type="number"
                  value={damageMin}
                  onChange={(e) => setDamageMin(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Damage Máximo
                </label>
                <input
                  type="number"
                  value={damageMax}
                  onChange={(e) => setDamageMax(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>
            </div>
          )}

          {contributionType === 'ability' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nueva Habilidad
              </label>
              <input
                type="text"
                value={newAbility}
                onChange={(e) => setNewAbility(e.target.value)}
                placeholder="Ej: Shield Regeneration"
                className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                required
              />
            </div>
          )}

          {contributionType === 'description' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nueva Descripción
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                required
              />
            </div>
          )}

          {/* Información del Contribuyente */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tu Nombre (Opcional)
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Anonymous"
              className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          {/* Evidencia */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Upload size={16} className="inline mr-2" />
              Evidencia (URL a screenshot/video - Opcional)
            </label>
            <input
              type="url"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="https://imgur.com/..."
              className="w-full px-4 py-2 bg-[#0a0e1a] border border-gray-700/30 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Contribuciones con evidencia tienen mayor prioridad de aprobación
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-700/30 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enviando...' : 'Enviar Contribución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { X, User, Loader, Save, Upload, Camera } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface EditProfileProps {
  userId: string;
  onClose: () => void;
  onSave: () => void;
}

interface ProfileData {
  fullName: string;
  bio: string;
  avatar: string;
}

export default function EditProfile({ userId, onClose, onSave }: EditProfileProps) {
  const [formData, setFormData] = useState<ProfileData>({
    fullName: '',
    bio: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const response = await api.get(`/users/${userId}`);
      setFormData({
        fullName: response.profile.fullName || '',
        bio: response.profile.bio || '',
        avatar: response.profile.avatar || ''
      });
    } catch (error: any) {
      console.error('Error al cargar perfil:', error);
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.bio.length > 500) {
      toast.error('La biografía no puede exceder 500 caracteres');
      return;
    }

    if (formData.fullName.length > 100) {
      toast.error('El nombre no puede exceder 100 caracteres');
      return;
    }

    setSaving(true);

    try {
      await api.patch(`/users/${userId}`, formData);
      toast.success('Perfil actualizado correctamente');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      toast.error(error.message || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede exceder 5MB');
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Subir archivo
    handleFileUpload(file);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('avatar', file);

      const response = await api.postFormData(`/users/${userId}/avatar`, formDataUpload);
      
      setFormData(prev => ({
        ...prev,
        avatar: response.avatarUrl
      }));
      
      toast.success('Avatar subido correctamente');
    } catch (error: any) {
      console.error('Error al subir avatar:', error);
      toast.error(error.message || 'Error al subir avatar');
      setPreviewImage(null);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader className="animate-spin text-yellow-400" size={32} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1420] border border-yellow-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-500/10 to-yellow-500/10 border-b border-yellow-500/30 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-green-500">
            Editar Perfil
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 p-1">
                <div className="w-full h-full rounded-full bg-[#0f1420] flex items-center justify-center overflow-hidden">
                  {previewImage || formData.avatar ? (
                    <img 
                      src={previewImage || formData.avatar} 
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = '<svg class="text-yellow-400" width="48" height="48"><use href="#user-icon"/></svg>';
                      }}
                    />
                  ) : (
                    <User size={48} className="text-yellow-400" />
                  )}
                </div>
              </div>
              
              {/* Upload Button Overlay */}
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={uploading}
                className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              >
                {uploading ? (
                  <Loader className="animate-spin text-white" size={32} />
                ) : (
                  <Camera className="text-white" size={32} />
                )}
              </button>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={uploading}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-green-500 text-black font-bold rounded-lg hover:shadow-lg hover:shadow-yellow-500/50 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Upload size={16} />
              {uploading ? 'Subiendo...' : 'Subir Imagen'}
            </button>
            
            <p className="text-xs text-gray-500 text-center">
              Haz clic en la imagen o el botón para subir<br />
              Máximo 5MB • JPEG, PNG, GIF, WEBP
            </p>
          </div>

          {/* Avatar URL (opcional) */}
          <div>
            <label className="block text-sm font-bold text-yellow-400 mb-2">
              URL del Avatar (Opcional)
            </label>
            <input
              type="url"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              placeholder="https://ejemplo.com/tu-avatar.jpg"
              className="w-full bg-[#1a1f2e] border border-green-500/20 rounded-lg px-4 py-3 text-white focus:border-green-500/50 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              También puedes pegar una URL de imagen externa
            </p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold text-yellow-400 mb-2">
              Nombre Completo
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Tu nombre completo"
              maxLength={100}
              className="w-full bg-[#1a1f2e] border border-green-500/20 rounded-lg px-4 py-3 text-white focus:border-green-500/50 focus:outline-none"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Visible para todos los usuarios</span>
              <span>{formData.fullName.length}/100</span>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-bold text-yellow-400 mb-2">
              Biografía
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Cuéntanos sobre ti..."
              maxLength={500}
              rows={5}
              className="w-full bg-[#1a1f2e] border border-green-500/20 rounded-lg px-4 py-3 text-white focus:border-green-500/50 focus:outline-none resize-none"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Una breve descripción sobre ti</span>
              <span>{formData.bio.length}/500</span>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-400">
              <strong>Nota:</strong> Tu nombre de usuario y email no pueden ser modificados desde aquí. 
              Contacta a un administrador si necesitas cambiarlos.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-[#1a1f2e] border border-red-500/30 text-gray-300 font-bold rounded-lg hover:bg-red-500/10 hover:text-white transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

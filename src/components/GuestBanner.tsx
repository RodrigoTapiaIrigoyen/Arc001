import { Lock, UserPlus, LogIn } from 'lucide-react';

interface GuestBannerProps {
  message: string;
  onRegister: () => void;
  onLogin: () => void;
}

export default function GuestBanner({ message, onRegister, onLogin }: GuestBannerProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1420] border-2 border-yellow-500/30 rounded-2xl p-8 text-center shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-500/20 to-red-500/20 border border-yellow-500/30 rounded-full mb-4">
            <Lock className="text-yellow-400" size={32} />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-3">
            Función Restringida
          </h3>
          
          <p className="text-gray-300 mb-6">
            {message}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={onRegister}
              className="w-full bg-gradient-to-r from-red-600 via-yellow-600 to-green-600 hover:from-red-700 hover:via-yellow-700 hover:to-green-700 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <UserPlus size={18} />
              Crear Cuenta Gratis
            </button>
            
            <button
              onClick={onLogin}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 border border-gray-600"
            >
              <LogIn size={18} />
              Ya tengo cuenta
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4">
            Es gratis y toma menos de 1 minuto
          </p>
        </div>
      </div>
    </div>
  );
}

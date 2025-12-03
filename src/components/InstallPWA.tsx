import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Mostrar banner solo si no ha sido instalado antes
      const hasInstalledBefore = localStorage.getItem('pwa-installed');
      const hasDismissedBanner = localStorage.getItem('pwa-banner-dismissed');
      
      if (!hasInstalledBefore && !hasDismissedBanner) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detectar si ya está instalado
    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pwa-installed', 'true');
      setShowInstallBanner(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'true');
      setShowInstallBanner(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', 'true');
    setShowInstallBanner(false);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gradient-to-br from-yellow-500 to-orange-500 text-black rounded-lg shadow-2xl p-4 z-50 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-black/20 rounded-lg flex items-center justify-center">
          <Download className="text-black" size={20} />
        </div>
        
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">¡Instala la App!</h3>
          <p className="text-sm text-black/80 mb-3">
            Instala ARC Raiders en tu dispositivo para acceso rápido y notificaciones.
          </p>
          
          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-black text-yellow-400 font-semibold py-2 px-4 rounded-lg hover:bg-black/90 transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 bg-black/20 hover:bg-black/30 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

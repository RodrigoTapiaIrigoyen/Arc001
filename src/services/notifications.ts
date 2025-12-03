/**
 * Servicio de notificaciones del navegador
 */
class NotificationService {
  private permission: NotificationPermission = 'default';
  private soundEnabled: boolean = true;
  
  // Sonidos
  private messageSound: HTMLAudioElement | null = null;
  private offerSound: HTMLAudioElement | null = null;

  constructor() {
    this.permission = Notification.permission;
    this.loadSoundPreference();
    this.initSounds();
  }

  /**
   * Solicitar permiso para notificaciones
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error al solicitar permiso de notificaciones:', error);
      return false;
    }
  }

  /**
   * Verificar si se puede mostrar notificaciones
   */
  canShowNotifications(): boolean {
    return this.permission === 'granted' && !this.isPageVisible();
  }

  /**
   * Verificar si la página está visible
   */
  private isPageVisible(): boolean {
    return document.visibilityState === 'visible';
  }

  /**
   * Mostrar notificación de nuevo mensaje
   */
  showMessageNotification(username: string, message: string) {
    if (!this.canShowNotifications()) {
      // Si la página está visible, solo reproducir sonido
      if (this.isPageVisible() && this.soundEnabled) {
        this.playMessageSound();
      }
      return;
    }

    const notification = new Notification(`Nuevo mensaje de ${username}`, {
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      icon: '/icon-message.png',
      badge: '/badge.png',
      tag: `message-${username}`,
      requireInteraction: false,
      silent: !this.soundEnabled
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // Navegar a mensajes
      window.location.hash = '#/messages';
    };

    // Reproducir sonido
    if (this.soundEnabled) {
      this.playMessageSound();
    }

    // Auto-cerrar después de 5 segundos
    setTimeout(() => notification.close(), 5000);
  }

  /**
   * Mostrar notificación de nueva oferta
   */
  showOfferNotification(type: 'new' | 'accepted' | 'rejected' | 'countered', itemName: string, username?: string) {
    if (!this.canShowNotifications() && !this.isPageVisible()) {
      return;
    }

    const titles = {
      new: `Nueva oferta por ${itemName}`,
      accepted: `¡Oferta aceptada!`,
      rejected: `Oferta rechazada`,
      countered: `Contraoferta recibida`
    };

    const bodies = {
      new: username ? `${username} te hizo una oferta` : 'Tienes una nueva oferta',
      accepted: `Tu oferta por ${itemName} fue aceptada`,
      rejected: `Tu oferta por ${itemName} fue rechazada`,
      countered: username ? `${username} hizo una contraoferta` : 'Tienes una contraoferta'
    };

    if (!this.canShowNotifications()) {
      // Solo sonido si está visible
      if (this.soundEnabled) {
        this.playOfferSound();
      }
      return;
    }

    const notification = new Notification(titles[type], {
      body: bodies[type],
      icon: '/icon-trade.png',
      badge: '/badge.png',
      tag: `offer-${itemName}`,
      requireInteraction: type === 'accepted',
      silent: !this.soundEnabled
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      // Navegar a marketplace
      window.location.hash = '#/marketplace';
    };

    // Reproducir sonido
    if (this.soundEnabled) {
      this.playOfferSound();
    }

    // Auto-cerrar después de 7 segundos (excepto accepted)
    if (type !== 'accepted') {
      setTimeout(() => notification.close(), 7000);
    }
  }

  /**
   * Inicializar sonidos
   */
  private initSounds() {
    // Sonido de mensaje (frecuencia media, corto)
    this.messageSound = this.createSound(800, 0.1, 'sine');
    
    // Sonido de oferta (frecuencia más alta, dos tonos)
    this.offerSound = this.createSound(1000, 0.15, 'sine');
  }

  /**
   * Crear sonido con Web Audio API
   */
  private createSound(frequency: number, duration: number, type: OscillatorType): HTMLAudioElement | null {
    try {
      // Crear AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // No retornamos HTMLAudioElement, usamos Web Audio API directamente
      return null;
    } catch (error) {
      console.error('Error al inicializar audio:', error);
      return null;
    }
  }

  /**
   * Reproducir sonido de mensaje
   */
  playMessageSound() {
    if (!this.soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
    }
  }

  /**
   * Reproducir sonido de oferta (dos tonos)
   */
  playOfferSound() {
    if (!this.soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Primer tono
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.frequency.value = 1000;
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      osc1.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 0.1);

      // Segundo tono (más alto)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 1200;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
      osc2.start(audioContext.currentTime + 0.15);
      osc2.stop(audioContext.currentTime + 0.25);
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
    }
  }

  /**
   * Activar/desactivar sonidos
   */
  toggleSound(enabled: boolean) {
    this.soundEnabled = enabled;
    localStorage.setItem('soundEnabled', enabled.toString());
  }

  /**
   * Obtener estado de sonido
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Cargar preferencia de sonido
   */
  private loadSoundPreference() {
    const saved = localStorage.getItem('soundEnabled');
    this.soundEnabled = saved !== 'false'; // Por defecto true
  }
}

// Singleton
export const notificationService = new NotificationService();

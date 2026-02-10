// -*- coding: utf-8 -*-
// @charset "UTF-8"

/**
 * Système de notifications navigateur et sons
 */

// Demander la permission pour les notifications
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('Ce navigateur ne supporte pas les notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Afficher une notification navigateur
export const showBrowserNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/logo-bvr.png',
      badge: '/logo-bvr.png',
      ...options
    });

    // Auto-fermer après 5 secondes
    setTimeout(() => notification.close(), 5000);

    return notification;
  }
  return null;
};

// Jouer un son de notification (synthétique)
export const playNotificationSound = (type = 'default') => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Différents sons selon le type
    switch (type) {
      case 'vote':
        // Son de vote (deux notes rapides)
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.3;
        oscillator.start();
        setTimeout(() => {
          oscillator.frequency.value = 1000;
        }, 100);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;

      case 'elimination':
        // Son dramatique (descente de fréquence)
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.4;
        oscillator.start();
        oscillator.frequency.exponentialRampToValueAtTime(
          200,
          audioContext.currentTime + 0.5
        );
        oscillator.stop(audioContext.currentTime + 0.5);
        break;

      case 'message':
        // Son de message (note courte)
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.2;
        oscillator.type = 'sine';
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
        break;

      case 'victory':
        // Son de victoire (montée joyeuse)
        oscillator.frequency.value = 400;
        gainNode.gain.value = 0.3;
        oscillator.type = 'square';
        oscillator.start();
        oscillator.frequency.exponentialRampToValueAtTime(
          800,
          audioContext.currentTime + 0.3
        );
        oscillator.stop(audioContext.currentTime + 0.4);
        setTimeout(() => {
          const osc2 = audioContext.createOscillator();
          const gain2 = audioContext.createGain();
          osc2.connect(gain2);
          gain2.connect(audioContext.destination);
          osc2.frequency.value = 1000;
          gain2.gain.value = 0.3;
          osc2.start();
          osc2.stop(audioContext.currentTime + 0.2);
        }, 200);
        break;

      case 'warning':
        // Son d'avertissement (bip urgent)
        oscillator.frequency.value = 1200;
        gainNode.gain.value = 0.3;
        oscillator.type = 'square';
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
        setTimeout(() => {
          const osc2 = audioContext.createOscillator();
          const gain2 = audioContext.createGain();
          osc2.connect(gain2);
          gain2.connect(audioContext.destination);
          osc2.frequency.value = 1200;
          gain2.gain.value = 0.3;
          osc2.type = 'square';
          osc2.start();
          osc2.stop(audioContext.currentTime + 0.15);
        }, 200);
        break;

      default:
        // Son par défaut (bip simple)
        oscillator.frequency.value = 700;
        gainNode.gain.value = 0.2;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    }
  } catch (error) {
    console.warn('Impossible de jouer le son:', error);
  }
};

// Vérifier si l'utilisateur est actif sur la page
export const isPageVisible = () => {
  return !document.hidden;
};

// Envoyer une notification complète (browser + son)
export const sendNotification = (title, message, type = 'default', options = {}) => {
  const soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
  const notificationsEnabled = localStorage.getItem('notificationsEnabled') !== 'false';

  // Jouer le son si activé
  if (soundEnabled) {
    playNotificationSound(type);
  }

  // Afficher la notification navigateur si la page n'est pas visible
  if (notificationsEnabled && !isPageVisible()) {
    showBrowserNotification(title, {
      body: message,
      tag: type,
      requireInteraction: type === 'vote' || type === 'warning',
      ...options
    });
  }
};

// Toggle des préférences utilisateur
export const toggleSound = () => {
  const current = localStorage.getItem('soundEnabled') !== 'false';
  localStorage.setItem('soundEnabled', (!current).toString());
  return !current;
};

export const toggleNotifications = () => {
  const current = localStorage.getItem('notificationsEnabled') !== 'false';
  localStorage.setItem('notificationsEnabled', (!current).toString());
  return !current;
};

export const isSoundEnabled = () => {
  return localStorage.getItem('soundEnabled') !== 'false';
};

export const areNotificationsEnabled = () => {
  return localStorage.getItem('notificationsEnabled') !== 'false';
};

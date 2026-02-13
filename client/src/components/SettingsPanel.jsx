// -*- coding: utf-8 -*-
// @charset "UTF-8"
import { useState, useEffect } from 'react';
import { 
  toggleSound, 
  toggleNotifications, 
  isSoundEnabled, 
  areNotificationsEnabled,
  requestNotificationPermission 
} from '../utils/notifications';

function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(isSoundEnabled());
    setNotificationsEnabled(areNotificationsEnabled());
  }, []);

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundEnabled(newState);
  };

  const handleToggleNotifications = async () => {
    const hasPermission = await requestNotificationPermission();
    if (hasPermission) {
      const newState = toggleNotifications();
      setNotificationsEnabled(newState);
    } else {
      alert('Veuillez autoriser les notifications dans les paramètres de votre navigateur');
    }
  };

  return (
    <>
      {/* Bouton d'ouverture */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: '3px solid #2C5F7F',
          color: '#FFF',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
        title="Paramètres"
      >
        ⚙️
      </button>

      {/* Panel des paramètres */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          left: '20px',
          width: '280px',
          background: 'linear-gradient(135deg, #E8D5B7 0%, #C9B492 100%)',
          borderRadius: '12px',
          border: '4px solid #2C5F7F',
          boxShadow: '0 0 0 2px #8B6F47, 0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 1000,
          animation: 'slideUp 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '15px',
            borderBottom: '3px solid #2C5F7F',
            background: 'linear-gradient(180deg, rgba(44, 95, 127, 0.1) 0%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '18px',
              color: '#2C1810',
              fontFamily: 'Arial, Helvetica, sans-serif'
            }}>
              ⚙️ Paramètres
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#2C1810',
                padding: '0',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              ×
            </button>
          </div>

          {/* Options */}
          <div style={{ padding: '15px' }}>
            {/* Option Sons */}
            <div style={{
              padding: '12px',
              marginBottom: '10px',
              background: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onClick={handleToggleSound}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'}
            >
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2C1810', marginBottom: '4px' }}>
                  {soundEnabled ? '🔊' : '🔇'} Sons
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Effets sonores du jeu
                </div>
              </div>
              <div style={{
                width: '50px',
                height: '26px',
                background: soundEnabled ? '#4CAF50' : '#ccc',
                borderRadius: '13px',
                position: 'relative',
                transition: 'background 0.3s'
              }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: soundEnabled ? '26px' : '2px',
                  transition: 'left 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>

            {/* Option Notifications */}
            <div style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onClick={handleToggleNotifications}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'}
            >
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2C1810', marginBottom: '4px' }}>
                  {notificationsEnabled ? '🔔' : '🔕'} Notifications
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Alertes navigateur
                </div>
              </div>
              <div style={{
                width: '50px',
                height: '26px',
                background: notificationsEnabled ? '#4CAF50' : '#ccc',
                borderRadius: '13px',
                position: 'relative',
                transition: 'background 0.3s'
              }}>
                <div style={{
                  width: '22px',
                  height: '22px',
                  background: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: notificationsEnabled ? '26px' : '2px',
                  transition: 'left 0.3s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

export default SettingsPanel;

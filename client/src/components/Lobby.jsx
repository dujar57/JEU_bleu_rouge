// -*- coding: utf-8 -*-
// @charset "UTF-8"
import { useState } from 'react';

function Lobby({ gameCode, gameData, pseudo, startGame }) {
  const [selectedDuration, setSelectedDuration] = useState(3600000); // Par défaut 1h

  if (!gameData) {
    return (
      <div className="container">
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  const isHost = gameData.players[0]?.pseudo === pseudo;

  const durations = [
    { label: '⚡ 20 minutes', value: 20 * 60 * 1000 },
    { label: '⏱️ 1 heure', value: 60 * 60 * 1000 },
    { label: '🕐 6 heures', value: 6 * 60 * 60 * 1000 },
    { label: '📅 1 jour', value: 24 * 60 * 60 * 1000 },
    { label: '📅 2 jours', value: 2 * 24 * 60 * 60 * 1000 },
    { label: '📅 4 jours', value: 4 * 24 * 60 * 60 * 1000 },
    { label: '📅 5 jours', value: 5 * 24 * 60 * 60 * 1000 },
    { label: '📅 10 jours', value: 10 * 24 * 60 * 60 * 1000 }
  ];

  const handleStartGame = () => {
    startGame(selectedDuration);
  };

  return (
    <div className="container">
      <div className="game-code">
        <h3>Code de la partie</h3>
        <div className="code">{gameCode}</div>
      </div>

      <h2>Joueurs ({gameData.players.length})</h2>
      <div className="players-list">
        {gameData.players.map((player, index) => (
          <div key={index} className="player-item">
            <div>
              <div className="player-name">
                {player.pseudo} {player.pseudo === pseudo && '(Vous)'}
              </div>
              <div className="player-info">{player.realLifeInfo}</div>
            </div>
          </div>
        ))}
      </div>

      {isHost && gameData.players.length >= 4 && (
        <>
          <div style={{
            marginTop: '25px',
            padding: '25px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 100%)',
            borderRadius: '20px',
            border: '4px dashed #2C5F7F',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5), 0 4px 8px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ 
              fontSize: '24px', 
              marginBottom: '20px', 
              textAlign: 'center',
              color: '#E74C3C',
              fontFamily: "'Archivo Black', sans-serif",
              textTransform: 'uppercase',
              letterSpacing: '3px',
              textShadow: '2px 2px 0 rgba(231,76,60,0.3)'
            }}>⏰ Durée de la partie</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '15px'
            }}>
              {durations.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setSelectedDuration(duration.value)}
                  style={{
                    padding: '16px',
                    background: selectedDuration === duration.value 
                      ? 'linear-gradient(180deg, #5DADE2 0%, #2C5F7F 100%)'
                      : 'linear-gradient(180deg, #E8D5B7 0%, rgba(232,213,183,0.7) 100%)',
                    border: selectedDuration === duration.value
                      ? '4px solid #2C5F7F'
                      : '3px solid rgba(44,95,127,0.4)',
                    borderRadius: '15px',
                    color: selectedDuration === duration.value ? 'white' : '#2C3E50',
                    cursor: 'pointer',
                    fontSize: '17px',
                    fontWeight: selectedDuration === duration.value ? '900' : '700',
                    transition: 'all 0.3s ease',
                    textShadow: selectedDuration === duration.value ? '1px 1px 0 rgba(0,0,0,0.3)' : 'none',
                    boxShadow: selectedDuration === duration.value 
                      ? '0 4px 0 #2C3E50, 0 6px 12px rgba(0,0,0,0.3)'
                      : '0 2px 4px rgba(0,0,0,0.2)',
                    transform: selectedDuration === duration.value ? 'translateY(-2px)' : 'none'
                  }}
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleStartGame} style={{ marginTop: '25px' }}>Lancer la partie</button>
        </>
      )}

      {isHost && gameData.players.length < 4 && (
        <div style={{ 
          textAlign: 'center', 
          color: '#E74C3C', 
          marginTop: '25px',
          fontSize: '19px',
          fontWeight: '700',
          padding: '20px',
          background: 'rgba(231,76,60,0.1)',
          borderRadius: '15px',
          border: '3px dashed #E74C3C'
        }}>
          En attente de joueurs (minimum 4)
        </div>
      )}

      {!isHost && (
        <div style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
          En attente que l'hôte lance la partie...
        </div>
      )}

      {gameData.players.length >= 8 && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: 'linear-gradient(135deg, rgba(139, 0, 255, 0.1) 0%, rgba(255, 20, 147, 0.1) 100%)',
          borderRadius: '10px',
          border: '1px solid rgba(139, 0, 255, 0.3)'
        }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
            🎭 Mode Traîtres Activé !
          </div>
          <div style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.5' }}>
            Avec 8+ joueurs, 2 traîtres seront infiltrés (1 par équipe).
            Ils forment une 3ème équipe secrète et ne se connaissent que par leur numéro de joueur.
          </div>
        </div>
      )}
    </div>
  );
}

export default Lobby;

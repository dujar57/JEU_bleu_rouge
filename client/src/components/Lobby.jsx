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
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', textAlign: 'center' }}>⏰ Durée de la partie</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px'
            }}>
              {durations.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setSelectedDuration(duration.value)}
                  style={{
                    padding: '12px',
                    background: selectedDuration === duration.value 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'rgba(255,255,255,0.1)',
                    border: selectedDuration === duration.value
                      ? '2px solid #667eea'
                      : '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: selectedDuration === duration.value ? 'bold' : 'normal',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {duration.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleStartGame} style={{ marginTop: '20px' }}>Lancer la partie</button>
        </>
      )}

      {isHost && gameData.players.length < 4 && (
        <div style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
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

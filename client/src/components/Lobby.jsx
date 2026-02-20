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
      <div className="logo-circle"><img src="/logo-bvr.png" alt="Logo Bleu vs Rouge" className="logo-img" /></div>
      <div className="logo">
        <h1>
          <span className="blue">BLEU</span>
          <span className="vs">VS</span>
          <span className="red">ROUGE</span>
        </h1>
      </div>
      
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
            padding: '20px',
            background: 'rgba(255,255,255,0.4)',
            borderRadius: '8px',
            border: '3px dashed #8b6f47',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ 
              fontSize: '20px', 
              marginBottom: '18px', 
              textAlign: 'center',
              color: '#2c1810',
              fontFamily: 'Arial, Helvetica, sans-serif',
              letterSpacing: '2px'
            }}>⏰ DURÉE DE LA PARTIE</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {durations.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setSelectedDuration(duration.value)}
                  style={{
                    padding: '14px',
                    background: selectedDuration === duration.value 
                      ? 'linear-gradient(180deg, #7c6a46 0%, #5d4e37 100%)'
                      : 'linear-gradient(180deg, #d4a574 0%, #b8935d 100%)',
                    border: selectedDuration === duration.value
                      ? '3px solid #2c1810'
                      : '2px solid #8b6f47',
                    borderRadius: '6px',
                    color: selectedDuration === duration.value ? '#f4e4c1' : '#2c1810',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '700',
                    transition: 'all 0.3s ease',
                    textShadow: selectedDuration === duration.value ? '1px 1px 0 rgba(0,0,0,0.3)' : 'none',
                    boxShadow: selectedDuration === duration.value 
                      ? '0 4px 0 #1a0f0a, 0 6px 10px rgba(0,0,0,0.3)'
                      : '0 2px 0 #1a0f0a, 0 4px 6px rgba(0,0,0,0.2)',
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

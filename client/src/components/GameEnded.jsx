// -*- coding: utf-8 -*-
// @charset "UTF-8"
import { useState } from 'react';

function GameEnded({ endGameData, onReturnHome }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!endGameData) return null;

  const getWinnerColor = (winner) => {
    switch(winner) {
      case 'BLEU': return 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
      case 'ROUGE': return 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)';
      case 'TRAÎTRES': return 'linear-gradient(135deg, #8B00FF 0%, #FF1493 100%)';
      case 'AMOUREUX': return 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)';
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  const getWinnerEmoji = (winner) => {
    switch(winner) {
      case 'BLEU': return '🔵';
      case 'ROUGE': return '🔴';
      case 'TRAÎTRES': return '🎭';
      case 'AMOUREUX': return '💕';
      default: return '🏆';
    }
  };

  return (
    <div className="container">
      <div className="logo-circle"><img src="/logo-bvr.png" alt="Logo Bleu vs Rouge" className="logo-img" /></div>
      <div className="logo">
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
          <span className="blue">BLEU</span>
          <span className="vs">VS</span>
          <span className="red">ROUGE</span>
        </h1>
      </div>
      
      <div style={{
        padding: '30px',
        background: getWinnerColor(endGameData.winner),
        borderRadius: '15px',
        marginBottom: '20px',
        textAlign: 'center',
        color: 'white',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        animation: 'pulse 2s ease-in-out infinite'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '15px', animation: 'bounce 1s ease-in-out' }}>
          {getWinnerEmoji(endGameData.winner)}
        </div>
        <h1 style={{ fontSize: '36px', marginBottom: '10px', color: 'white', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
          🏆 FIN DE PARTIE
        </h1>
        <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '10px' }}>
          {endGameData.message}
        </h2>
      </div>

      {/* Statistiques rapides */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          padding: '15px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '10px',
          textAlign: 'center',
          color: 'white',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '5px' }}>✨</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{endGameData.survivors?.length || 0}</div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Survivants</div>
        </div>
        
        <div style={{
          padding: '15px',
          background: 'linear-gradient(135deg, #F44336 0%, #d32f2f 100%)',
          borderRadius: '10px',
          textAlign: 'center',
          color: 'white',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '5px' }}>💀</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {endGameData.totalPlayers ? endGameData.totalPlayers - (endGameData.survivors?.length || 0) : '?'}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>Éliminés</div>
        </div>

        {endGameData.traitors && endGameData.traitors.length > 0 && (
          <div style={{
            padding: '15px',
            background: 'linear-gradient(135deg, #8B00FF 0%, #FF1493 100%)',
            borderRadius: '10px',
            textAlign: 'center',
            color: 'white',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '5px' }}>🎭</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{endGameData.traitors.length}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Traîtres</div>
          </div>
        )}
      </div>

      {/* Bouton pour afficher/masquer les détails */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          width: '100%',
          padding: '15px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #2C5F7F 0%, #1a3a4d 100%)',
          border: '3px solid #8B6F47',
          borderRadius: '10px',
          color: '#FFF',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {showDetails ? '📊 Masquer les détails' : '📊 Voir les détails'}
      </button>

      {/* Détails conditionnels */}
      {showDetails && (
        <>
          {endGameData.survivors && endGameData.survivors.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>
                ✨ Survivants ({endGameData.survivors.length})
              </h3>
              <div className="players-list">
                {endGameData.survivors.map((survivor, index) => (
                  <div 
                    key={index} 
                    className={`player-item ${survivor.team}`}
                    style={{ marginBottom: '10px' }}
                  >
                    <div>
                      <div className="player-name">
                        Joueur {survivor.anonymousNumber}
                        {survivor.isTraitor && ' 🎭'}
                      </div>
                      <div className="player-info">
                        {survivor.team === 'bleu' ? '🔵' : '🔴'} {survivor.team} - {survivor.role}
                        {survivor.isTraitor && ' (Traître)'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {endGameData.traitors && endGameData.traitors.length > 0 && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              background: 'rgba(139, 0, 255, 0.1)',
              borderRadius: '10px',
              border: '1px solid rgba(139, 0, 255, 0.3)'
            }}>
              <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
                🎭 Les Traîtres Révélés
              </h3>
              {endGameData.traitors.map((traitor, index) => (
                <div key={index} style={{ textAlign: 'center', fontSize: '16px' }}>
                  Joueur #{traitor.anonymousNumber} = {traitor.pseudo}
                </div>
              ))}
            </div>
          )}

          {endGameData.lovers && endGameData.lovers.length > 0 && (
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              background: 'rgba(255, 107, 107, 0.1)',
              borderRadius: '10px',
              border: '1px solid rgba(255, 107, 107, 0.3)'
            }}>
              <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>
                💕 Les Amoureux Révélés
              </h3>
              {endGameData.lovers.map((lover, index) => (
                <div key={index} style={{ textAlign: 'center', fontSize: '16px' }}>
                  Joueur #{lover.anonymousNumber} = {lover.pseudo} ({lover.team === 'bleu' ? '🔵' : '🔴'} {lover.team})
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: '15px', marginTop: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => window.location.reload()}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '15px 25px',
            fontSize: '18px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            border: '3px solid #2C5F7F',
            borderRadius: '10px',
            color: '#FFF',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
          }}
        >
          🔄 Nouvelle partie
        </button>

        <button 
          onClick={onReturnHome}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '15px 25px',
            fontSize: '18px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #2C5F7F 0%, #1a3a4d 100%)',
            border: '3px solid #8B6F47',
            borderRadius: '10px',
            color: '#FFF',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(44, 95, 127, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(44, 95, 127, 0.6)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(44, 95, 127, 0.4)';
          }}
        >
          🏠 Retour à l'accueil
        </button>
      </div>
    </div>
  );
}

export default GameEnded;

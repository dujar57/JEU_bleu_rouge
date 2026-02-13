// -*- coding: utf-8 -*-
// @charset "UTF-8"
import { useTranslation } from 'react-i18next';

function GameEnded({ endGameData, onReturnHome }) {
  const { t } = useTranslation();
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

  return (
    <div className="container">
      <div className="logo-circle"><img src="/logo-bvr.png" alt="Logo Blue vs Red" className="logo-img" /></div>
      <div className="logo">
        <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
          <span className="blue">{t('game.title.blue')}</span>
          <span className="vs">{t('game.title.vs')}</span>
          <span className="red">{t('game.title.red')}</span>
        </h1>
      </div>
      
      <div style={{
        padding: '30px',
        background: getWinnerColor(endGameData.winner),
        borderRadius: '15px',
        marginBottom: '20px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px', color: 'white' }}>
          🏆 {t('gameEnded.title')}
        </h1>
        <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '10px' }}>
          {endGameData.message}
        </h2>
      </div>

      {endGameData.survivors && endGameData.survivors.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>
            ✨ {t('gameEnded.survivors')} ({endGameData.survivors.length})
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
                    {t('game.players')} {survivor.anonymousNumber}
                    {survivor.isTraitor && ' 🎭'}
                  </div>
                  <div className="player-info">
                    {survivor.team === 'bleu' ? '🔵' : '🔴'} {survivor.team} - {survivor.role}
                    {survivor.isTraitor && ` (${t('lobby.traitors')})`}
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
            🎭 {t('gameEnded.rolesReveal')}
          </h3>
          {endGameData.traitors.map((traitor, index) => (
            <div key={index} style={{ textAlign: 'center', fontSize: '16px' }}>
              {t('game.players')} #{traitor.anonymousNumber} = {traitor.pseudo}
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
              {t('game.players')} #{lover.anonymousNumber} = {lover.pseudo} ({lover.team === 'bleu' ? '🔵' : '🔴'} {lover.team})
            </div>
          ))}
        </div>
      )}

      <button 
        onClick={onReturnHome}
        style={{
          width: '100%',
          padding: '15px',
          fontSize: '18px',
          marginTop: '20px'
        }}
      >
        🏠 {t('gameEnded.returnHome')}
      </button>
    </div>
  );
}

export default GameEnded;

// -*- coding: utf-8 -*-
// @charset "UTF-8"
import { useState, useEffect, useRef } from 'react';

function GameHistory({ socket, gameCode }) {
  const [history, setHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const historyEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Écouter les événements de jeu et les ajouter à l'historique
    const addHistoryEvent = (event) => {
      setHistory(prev => [...prev, { ...event, timestamp: Date.now() }]);
      // Auto-scroll en bas quand ouvert
      setTimeout(() => {
        if (historyEndRef.current && isOpen) {
          historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    };

    // Événement: Partie démarrée
    socket.on('game_started', (data) => {
      addHistoryEvent({
        type: 'game_started',
        icon: '🎮',
        message: 'La partie a commencé !',
        color: '#4CAF50'
      });
    });

    // Événement: Changement de phase de vote
    socket.on('voting_phase_change', (data) => {
      if (data.phase === 'DISCUSSION') {
        addHistoryEvent({
          type: 'discussion_start',
          icon: '💬',
          message: `Discussion ${data.voteNumber}/${data.totalVotes}`,
          color: '#2196F3'
        });
      } else if (data.phase === 'VOTING') {
        addHistoryEvent({
          type: 'voting_start',
          icon: '🗳️',
          message: `Vote ${data.voteNumber}/${data.totalVotes} en cours`,
          color: '#FF9800'
        });
      }
    });

    // Événement: Résultats du vote
    socket.on('vote_results', (data) => {
      if (data.eliminated && data.eliminated.length > 0) {
        data.eliminated.forEach(player => {
          addHistoryEvent({
            type: 'elimination',
            icon: '💀',
            message: `${player.pseudo} a été éliminé (${player.reason})`,
            color: '#F44336',
            details: `Équipe ${player.team === 'bleu' ? '🔵' : '🔴'} - ${player.role}`
          });
        });
      }
    });

    // Événement: Message de chat (pour compter l'activité)
    socket.on('chat_message', (data) => {
      addHistoryEvent({
        type: 'chat',
        icon: '💬',
        message: `Joueur #${data.playerNumber} a envoyé un message`,
        color: '#9E9E9E',
        preview: data.message.substring(0, 50) + (data.message.length > 50 ? '...' : '')
      });
    });

    // Événement: Fin de partie
    socket.on('game_ended', (data) => {
      let winnerEmoji = '🏆';
      if (data.winner === 'BLEU') winnerEmoji = '🔵';
      if (data.winner === 'ROUGE') winnerEmoji = '🔴';
      if (data.winner === 'TRAITRES') winnerEmoji = '🎭';
      if (data.winner === 'AMOUREUX') winnerEmoji = '💕';

      addHistoryEvent({
        type: 'game_ended',
        icon: winnerEmoji,
        message: data.message || `Victoire : ${data.winner}`,
        color: '#FFD700',
        details: `${data.survivors?.length || 0} survivant(s)`
      });
    });

    return () => {
      socket.off('game_started');
      socket.off('voting_phase_change');
      socket.off('vote_results');
      socket.off('chat_message');
      socket.off('game_ended');
    };
  }, [socket, isOpen]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getEventTypeLabel = (type) => {
    const labels = {
      game_started: 'Début',
      discussion_start: 'Discussion',
      voting_start: 'Vote',
      elimination: 'Élimination',
      chat: 'Chat',
      game_ended: 'Fin'
    };
    return labels[type] || type;
  };

  return (
    <>
      {/* Bouton pour ouvrir/fermer l'historique */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          padding: '12px 20px',
          background: isOpen 
            ? 'linear-gradient(135deg, #F44336 0%, #d32f2f 100%)'
            : 'linear-gradient(135deg, #2C5F7F 0%, #1a3a4d 100%)',
          border: '3px solid #8B6F47',
          borderRadius: '8px',
          color: '#FFF',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        📜 Historique ({history.length})
        <span style={{ fontSize: '12px' }}>{isOpen ? '▼' : '▲'}</span>
      </button>

      {/* Panel d'historique */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          left: '20px',
          width: '400px',
          maxHeight: '60vh',
          background: 'linear-gradient(135deg, #E8D5B7 0%, #C9B492 100%)',
          borderRadius: '10px',
          border: '4px solid #2C5F7F',
          boxShadow: '0 0 0 2px #8B6F47, 0 10px 40px rgba(0,0,0,0.5)',
          zIndex: 998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '15px 20px',
            borderBottom: '3px solid #2C5F7F',
            background: 'linear-gradient(180deg, rgba(44, 95, 127, 0.1) 0%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '20px',
              color: '#2C1810',
              fontFamily: 'Arial, Helvetica, sans-serif'
            }}>
              📜 Journal de Partie
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

          {/* Liste des événements */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '15px'
          }}>
            {history.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#999',
                padding: '40px 20px',
                fontSize: '15px'
              }}>
                Aucun événement pour le moment
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {history.map((event, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '8px',
                      border: `2px solid ${event.color}`,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s',
                      cursor: 'default'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}>
                      <span style={{ fontSize: '24px' }}>{event.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <span style={{
                            fontSize: '11px',
                            color: event.color,
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {getEventTypeLabel(event.type)}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            color: '#666',
                            fontFamily: 'monospace'
                          }}>
                            {formatTime(event.timestamp)}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#2C1810',
                          fontWeight: '600',
                          lineHeight: '1.4'
                        }}>
                          {event.message}
                        </div>
                        {event.details && (
                          <div style={{
                            fontSize: '12px',
                            color: '#666',
                            marginTop: '4px',
                            fontStyle: 'italic'
                          }}>
                            {event.details}
                          </div>
                        )}
                        {event.preview && (
                          <div style={{
                            fontSize: '12px',
                            color: '#888',
                            marginTop: '6px',
                            padding: '6px 8px',
                            background: 'rgba(0,0,0,0.05)',
                            borderRadius: '4px',
                            fontStyle: 'italic'
                          }}>
                            "{event.preview}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={historyEndRef} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default GameHistory;

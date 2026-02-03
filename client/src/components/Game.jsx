// -*- coding: utf-8 -*-
// @charset "UTF-8"
import { useState, useEffect } from 'react';

function Game({ gameCode, gameData, myRole, pseudo, socket }) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [votingPhase, setVotingPhase] = useState(null);
  const [voteInfo, setVoteInfo] = useState(null);
  const [selectedVote, setSelectedVote] = useState(null);
  const [voteConfirmed, setVoteConfirmed] = useState(false);
  const [eliminationMessage, setEliminationMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    // Écouter les changements de phase de vote
    socket.on('voting_phase_change', (data) => {
      setVotingPhase(data.phase);
      setVoteInfo(data);
      setVoteConfirmed(false);
      setSelectedVote(null);
    });

    // Écouter la confirmation de vote
    socket.on('vote_confirmed', (data) => {
      setVoteConfirmed(true);
    });

    // Écouter les résultats de vote
    socket.on('vote_results', (data) => {
      setEliminationMessage(data);
      setTimeout(() => {
        setEliminationMessage(null);
        setVotingPhase(null);
        setVoteInfo(null);
      }, 5000);
    });

    // Écouter les messages de chat
    socket.on('chat_message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    return () => {
      socket.off('voting_phase_change');
      socket.off('vote_confirmed');
      socket.off('vote_results');
      socket.off('chat_message');
    };
  }, [socket]);

  useEffect(() => {
    if (!gameData || !gameData.nextEventTime) return;

    const updateTimer = () => {
      const remaining = gameData.nextEventTime - Date.now();
      setTimeRemaining(Math.max(0, remaining));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [gameData]);

  const formatTime = (ms) => {
    if (!ms) return '0s';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const h = hours % 24;
      return `${days}j ${h}h`;
    } else if (hours > 0) {
      const m = minutes % 60;
      return `${hours}h ${m}min`;
    } else if (minutes > 0) {
      const s = seconds % 60;
      return `${minutes}min ${s}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (!gameData || !myRole) {
    return (
      <div className="container">
        <div className="loading">Initialisation du jeu...</div>
      </div>
    );
  }

  const teamEmoji = myRole.team === 'bleu' ? '🔵' : '🔴';
  const teamName = myRole.team === 'bleu' ? 'ÉQUIPE BLEUE' : 'ÉQUIPE ROUGE';

  const getRoleDescription = (role) => {
    switch (role) {
      case 'representant':
        return '👑 Représentant - Vous représentez votre équipe';
      case 'tueur':
        return '🔪 Tueur - Vous avez le pouvoir d\'éliminer';
      case 'lambda':
        return '👤 Membre Lambda - Vous êtes un membre normal';
      default:
        return role;
    }
  };

  // Déterminer l'équipe réelle du joueur
  const actualTeam = myRole.isTraitor ? 'TRAÎTRES' : teamName;
  const actualEmoji = myRole.isTraitor ? '🎭' : teamEmoji;

  const handleVote = (targetSocketId) => {
    if (voteConfirmed) return;
    setSelectedVote(targetSocketId);
  };

  const confirmVote = () => {
    if (!selectedVote) return;
    socket.emit('cast_vote', { gameCode, targetSocketId: selectedVote });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || currentMessage.length > 200) return;
    
    socket.emit('chat_message', { 
      gameCode, 
      message: currentMessage.trim() 
    });
    
    setCurrentMessage('');
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container">
      {timeRemaining !== null && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          background: timeRemaining < 300000 
            ? 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '10px',
          textAlign: 'center',
          animation: timeRemaining < 60000 ? 'pulse 1s infinite' : 'none'
        }}>
          <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '5px' }}>
            ⏰ Temps restant
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
            {formatTime(timeRemaining)}
          </div>
          {timeRemaining < 300000 && (
            <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
              ⚠️ Fin de partie imminente !
            </div>
          )}
        </div>
      )}

      <div className="role-card">
        <h2>Votre Rôle Secret</h2>
        {myRole.isTraitor ? (
          <>
            <div className="team" style={{ background: 'linear-gradient(135deg, #8B00FF 0%, #FF1493 100%)' }}>
              {actualEmoji} {actualTeam}
            </div>
            <div style={{ fontSize: '14px', color: '#999', marginTop: '5px' }}>
              Infiltré dans : {teamEmoji} {teamName}
            </div>
            <div className="role">{getRoleDescription(myRole.role)} (couverture)</div>
            {myRole.traitorInfo && (
              <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(139, 0, 255, 0.1)', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: '#8B00FF', marginBottom: '5px' }}>🤝 Votre partenaire traître :</div>
                <div style={{ fontSize: '13px' }}>
                  <strong>Joueur {myRole.traitorInfo.anonymousNumber}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Infiltré : {myRole.traitorInfo.team === 'bleu' ? '🔵' : '🔴'} {myRole.traitorInfo.team}
                </div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>
                  ⚠️ Vous ne connaissez que son numéro de joueur, pas son nom réel
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="team">{teamEmoji} {teamName}</div>
            <div className="role">{getRoleDescription(myRole.role)}</div>
          </>
        )}
        {myRole.munitions > 0 && (
          <div style={{ marginTop: '10px', fontSize: '16px' }}>
            💣 Munitions : {myRole.munitions}
          </div>
        )}
      </div>

      {/* Affichage des résultats d'élimination */}
      {eliminationMessage && (
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
          borderRadius: '10px',
          textAlign: 'center',
          color: 'white',
          animation: 'pulse 0.5s ease-in-out'
        }}>
          <h3 style={{ marginBottom: '10px', color: 'white' }}>{eliminationMessage.message}</h3>
          {eliminationMessage.eliminated && eliminationMessage.eliminated.map((dead, idx) => (
            <div key={idx} style={{ fontSize: '14px', marginTop: '5px' }}>
              💀 {dead.pseudo} - {dead.reason}
            </div>
          ))}
        </div>
      )}

      {/* Phase de discussion */}
      {votingPhase === 'DISCUSSION' && voteInfo && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          background: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
          borderRadius: '10px',
          textAlign: 'center',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '10px' }}>
            💬 Phase de Discussion {voteInfo.voteNumber}/{voteInfo.totalVotes}
          </h3>
          <div style={{ fontSize: '14px' }}>
            Discutez et préparez votre vote
          </div>
          <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.9 }}>
            Le vote commence dans {formatTime(voteInfo.discussionEnd - Date.now())}
          </div>
        </div>
      )}

      {/* Phase de vote */}
      {votingPhase === 'VOTING' && voteInfo && (
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '10px',
          color: 'white'
        }}>
          <h3 style={{ color: 'white', marginBottom: '10px', textAlign: 'center' }}>
            🗳️ Phase de Vote {voteInfo.voteNumber}/{voteInfo.totalVotes}
          </h3>
          <div style={{ fontSize: '14px', textAlign: 'center', marginBottom: '15px' }}>
            Votez pour éliminer un joueur (n'importe quelle équipe)
          </div>
          
          {!voteConfirmed ? (
            <>
              <div style={{ 
                maxHeight: '200px', 
                overflowY: 'auto',
                marginBottom: '15px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '10px'
              }}>
                {gameData.players.filter(p => p.isAlive && p.pseudo !== pseudo).map((player, index) => (
                  <div 
                    key={index}
                    onClick={() => handleVote(player.socketId)}
                    style={{
                      padding: '10px',
                      margin: '5px 0',
                      background: selectedVote === player.socketId 
                        ? 'rgba(255,255,255,0.3)' 
                        : 'rgba(255,255,255,0.1)',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      border: selectedVote === player.socketId ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>
                      #{player.anonymousNumber} {player.pseudo}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      {player.team === 'bleu' ? '🔵' : '🔴'} {player.team}
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedVote && (
                <button 
                  onClick={confirmVote}
                  style={{
                    width: '100%',
                    padding: '15px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    background: 'white',
                    color: '#f5576c',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Confirmer mon vote
                </button>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
              ✅ Vote enregistré !
            </div>
          )}
          
          <div style={{ fontSize: '12px', marginTop: '10px', textAlign: 'center', opacity: 0.9 }}>
            Fin du vote dans {formatTime(voteInfo.votingEnd - Date.now())}
          </div>
        </div>
      )}

      <h2>Joueurs en vie ({gameData.players.filter(p => p.isAlive).length})</h2>
      
      <div style={{ 
        fontSize: '11px', 
        color: '#888', 
        marginBottom: '10px', 
        textAlign: 'center',
        padding: '5px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '5px'
      }}>
        💡 #Numéro = Joueur anonyme | Nom = Identité réelle
      </div>

      <div className="players-list">
        {gameData.players.map((player, index) => (
          player.isAlive && (
            <div key={index} className={`player-item ${player.team || ''}`}>
              <div>
                <div className="player-name">
                  <span style={{ 
                    display: 'inline-block', 
                    background: 'rgba(255,255,255,0.1)', 
                    padding: '2px 8px', 
                    borderRadius: '12px',
                    fontSize: '11px',
                    marginRight: '8px',
                    fontWeight: 'bold'
                  }}>
                    #{player.anonymousNumber || index + 1}
                  </span>
                  {player.pseudo} {player.pseudo === pseudo && '(Vous)'}
                </div>
                <div className="player-info">{player.realLifeInfo}</div>
              </div>
            </div>
          )
        ))}
      </div>

      {!votingPhase && !eliminationMessage && (
        <div style={{ textAlign: 'center', color: '#999', marginTop: '20px', fontSize: '14px' }}>
          ⏰ En attente de la prochaine phase de vote...
        </div>
      )}

      {/* Bouton Chat Flottant */}
      <button
        onClick={() => setShowChat(!showChat)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          zIndex: 1000,
          transition: 'transform 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
      >
        💬
        {messages.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#ff4444',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {messages.length > 9 ? '9+' : messages.length}
          </span>
        )}
      </button>

      {/* Fenêtre de Chat */}
      {showChat && (
        <div style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '350px',
          maxWidth: 'calc(100vw - 40px)',
          height: '500px',
          background: 'white',
          borderRadius: '15px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 999,
          overflow: 'hidden'
        }}>
          {/* En-tête du chat */}
          <div style={{
            padding: '15px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>💬 Chat Anonyme</div>
              <div style={{ fontSize: '11px', opacity: 0.9 }}>Messages par numéro de joueur</div>
            </div>
            <button
              onClick={() => setShowChat(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          </div>

          {/* Zone des messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '15px',
            background: '#f5f5f5'
          }}>
            {messages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#999', 
                padding: '20px',
                fontSize: '14px'
              }}>
                Aucun message pour le moment.<br/>
                Commencez la discussion !
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} style={{
                  marginBottom: '10px',
                  padding: '10px',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                    fontSize: '12px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: '#667eea' }}>
                      Joueur #{msg.playerNumber}
                    </span>
                    <span style={{ color: '#999' }}>
                      {formatTimestamp(msg.timestamp)}
                    </span>
                  </div>
                  <div style={{ color: '#333', fontSize: '14px', wordWrap: 'break-word' }}>
                    {msg.message}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Zone de saisie */}
          <form onSubmit={sendMessage} style={{
            padding: '15px',
            borderTop: '1px solid #ddd',
            background: 'white',
            display: 'flex',
            gap: '10px'
          }}>
            <input
              type="text"
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              placeholder="Votre message... (max 200 car.)"
              maxLength={200}
              style={{
                flex: 1,
                padding: '10px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '16px'
              }}
              disabled={!currentMessage.trim()}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Game;

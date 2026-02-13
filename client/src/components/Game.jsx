// -*- coding: utf-8 -*-
// @charset "UTF-8"
import { useState, useEffect } from 'react';
import GameHistory from './GameHistory';
import { sendNotification, requestNotificationPermission } from '../utils/notifications';

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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useState(null);
  const [isEliminated, setIsEliminated] = useState(false); // État spectateur
  
  // États pour les pouvoirs spéciaux
  const [powerTarget, setPowerTarget] = useState(null);
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [activePower, setActivePower] = useState(null);
  const [detectiveInfo, setDetectiveInfo] = useState([]);
  const [journalistQuestion, setJournalistQuestion] = useState('');
  
  // États pour le Boulanger
  const [saveableTargets, setSaveableTargets] = useState([]);
  const [showBakerModal, setShowBakerModal] = useState(false);
  
  // État pour joueur réanimé
  const [canRevivedKill, setCanRevivedKill] = useState(false);
  const [showRevivedKillModal, setShowRevivedKillModal] = useState(false);

  // Système de notifications flottantes
  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };

  // Vérifier au chargement si le joueur est déjà éliminé
  useEffect(() => {
    // Demander la permission pour les notifications
    requestNotificationPermission();

    if (gameData && gameData.players) {
      const currentPlayer = gameData.players.find(p => p.pseudo === pseudo);
      if (currentPlayer && !currentPlayer.isAlive) {
        setIsEliminated(true);
      }
    }
  }, [gameData, pseudo]);

  useEffect(() => {
    // Écouter les changements de phase de vote
    socket.on('voting_phase_change', (data) => {
      setVotingPhase(data.phase);
      setVoteInfo(data);
      setVoteConfirmed(false);
      setSelectedVote(null);
      
      // Notification automatique avec son
      if (data.phase === 'DISCUSSION') {
        addNotification(`💬 Phase de discussion ${data.voteNumber}/${data.totalVotes} - Préparez-vous à voter !`, 'info');
        sendNotification(
          'Phase de Discussion',
          `Discussion ${data.voteNumber}/${data.totalVotes} - Préparez vos arguments`,
          'default'
        );
      } else if (data.phase === 'VOTING') {
        addNotification(`🗳️ VOTE EN COURS - N'oubliez pas de voter ! ${data.voteNumber}/${data.totalVotes}`, 'warning', 8000);
        sendNotification(
          'VOTE EN COURS !',
          `C'est l'heure de voter ! (${data.voteNumber}/${data.totalVotes})`,
          'vote'
        );
      }
    });

    // Écouter la confirmation de vote
    socket.on('vote_confirmed', (data) => {
      setVoteConfirmed(true);
      addNotification('✅ Votre vote a été enregistré avec succès !', 'success');
      sendNotification(
        'Vote Confirmé',
        'Votre vote a bien été enregistré',
        'default'
      );
    });

    // Écouter les résultats de vote
    socket.on('vote_results', (data) => {
      setEliminationMessage(data);
      
      // Vérifier si le joueur actuel a été éliminé
      if (data.eliminated && data.eliminated.length > 0) {
        const wasEliminated = data.eliminated.some(player => player.pseudo === pseudo);
        if (wasEliminated) {
          setIsEliminated(true);
          addNotification('💀 Vous avez été éliminé ! Mode spectateur activé.', 'warning', 10000);
          sendNotification(
            '💀 Vous êtes éliminé',
            'Vous pouvez continuer à suivre la partie en mode spectateur',
            'elimination'
          );
        } else {
          // Son d'élimination pour les autres
          sendNotification(
            'Élimination',
            `${data.eliminated.length} joueur(s) éliminé(s)`,
            'elimination'
          );
        }
      }
      
      setTimeout(() => {
        setEliminationMessage(null);
        setVotingPhase(null);
        setVoteInfo(null);
      }, 5000);
    });

    // Écouter l'élection du représentant
    socket.on('representant_elected', (data) => {
      if (data.youAreRep) {
        // Le joueur est élu représentant !
        addNotification('👑 VOUS AVEZ ÉTÉ ÉLU REPRÉSENTANT ! Vous connaissez votre équipe et êtes immunisé contre les tueurs.', 'success', 10000);
        sendNotification(
          '👑 Vous êtes Représentant !',
          'Vous connaissez tous les membres de votre équipe',
          'default'
        );
        // Mettre à jour le rôle localement
        if (myRole) {
          myRole.role = 'representant';
          myRole.isRepresentant = true;
          myRole.teamMates = data.teamMates;
        }
      } else {
        addNotification(
          `👑 ${data.message}\nBleu: Joueur #${data.blueRep} | Rouge: Joueur #${data.redRep}`,
          'info',
          8000
        );
        sendNotification(
          'Représentants Élus',
          'Les chefs d\'équipe ont été désignés !',
          'default'
        );
      }
    });

    // Écouter les messages de chat
    socket.on('chat_message', (data) => {
      setMessages(prev => [...prev, data]);
      if (!showChat) {
        setUnreadCount(prev => prev + 1);
        addNotification(`💬 Nouveau message de Joueur #${data.playerNumber}`, 'info', 3000);
        sendNotification(
          'Nouveau message',
          `Joueur #${data.playerNumber}: ${data.message.substring(0, 50)}...`,
          'message'
        );
      }
      // Auto-scroll vers le bas
      setTimeout(() => {
        if (chatEndRef[0]) {
          chatEndRef[0].scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    });

    // Écouter les informations des détecteurs
    socket.on('detective_info', (data) => {
      const info = {
        id: Date.now(),
        type: data.type,
        message: data.message,
        timestamp: new Date().toLocaleTimeString()
      };
      setDetectiveInfo(prev => [info, ...prev].slice(0, 20)); // Garder 20 derniers
      
      addNotification(data.message, 'info', 10000);
      sendNotification(
        data.type === 'player' ? '🔍 Détection Joueur' : '🕵️ Détection Métier',
        data.message,
        'default'
      );
    });

    // Écouter les actions confirmées
    socket.on('action_confirmed', (data) => {
      addNotification(data.message, 'success', 5000);
    });

    // Écouter les révélations de tueur
    socket.on('killer_revealed', (data) => {
      addNotification(data.message, 'warning', 10000);
      sendNotification('🛡️ Tueur Révélé !', data.message, 'default');
    });

    // Écouter les actions de tueur
    socket.on('killer_action', (data) => {
      setEliminationMessage(data);
      addNotification(data.message, 'warning', 8000);
      
      setTimeout(() => {
        setEliminationMessage(null);
      }, 5000);
    });

    // Écouter les réponses du journaliste
    socket.on('journalist_answer', (data) => {
      addNotification(
        `📰 ${data.question}\n➡️ Réponse: ${data.answer}\n${data.warning}`,
        'info',
        15000
      );
    });

    // Écouter les résultats d'enquête du stalker
    socket.on('investigation_result', (data) => {
      addNotification(data.message, 'info', 10000);
    });

    // Écouter les échanges de pseudos
    socket.on('pseudos_swapped', (data) => {
      addNotification(data.message, 'warning', 8000);
    });

    // Écouter les conversions du guru
    socket.on('conversion_success', (data) => {
      addNotification(data.message, 'success', 10000);
      sendNotification('🧙 Conversion Réussie !', data.message, 'default');
    });

    socket.on('conversion_failed', (data) => {
      addNotification(data.message, 'warning', 5000);
    });

    socket.on('you_are_converted', (data) => {
      addNotification(data.message, 'warning', 15000);
      sendNotification('🧙 Vous êtes Converti !', data.message, 'default');
      // Mettre à jour le rôle localement
      if (myRole) {
        myRole.isTraitor = true;
      }
    });

    // Écouter le vol de pseudo
    socket.on('pseudo_stolen', (data) => {
      addNotification(data.message, 'warning', 8000);
    });

    // Écouter l'opportunité de sauver (BOULANGER)
    socket.on('baker_can_save', (data) => {
      setSaveableTargets(data.targets);
      setShowBakerModal(true);
      addNotification(data.message, 'success', 30000);
      sendNotification('🍞 BOULANGER !', data.message, 'default');
    });

    // Écouter la réanimation
    socket.on('you_are_revived', (data) => {
      setCanRevivedKill(true);
      setShowRevivedKillModal(true);
      addNotification(data.message, 'success', 30000);
      sendNotification('🍞 VOUS ÊTES SAUVÉ !', data.message, 'default');
    });

    return () => {
      socket.off('voting_phase_change');
      socket.off('vote_confirmed');
      socket.off('vote_results');
      socket.off('representant_elected');
      socket.off('chat_message');
      socket.off('detective_info');
      socket.off('action_confirmed');
      socket.off('killer_revealed');
      socket.off('killer_action');
      socket.off('journalist_answer');
      socket.off('investigation_result');
      socket.off('pseudos_swapped');
      socket.off('conversion_success');
      socket.off('conversion_failed');
      socket.off('you_are_converted');
      socket.off('pseudo_stolen');
      socket.off('baker_can_save');
      socket.off('you_are_revived');
    };
  }, [socket, showChat]);

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

  // Rappels automatiques pour le vote
  useEffect(() => {
    if (!votingPhase || votingPhase !== 'VOTING' || !voteInfo || voteConfirmed) return;

    // Premier rappel après 30 secondes
    const reminder1 = setTimeout(() => {
      if (!voteConfirmed) {
        addNotification('⚠️ RAPPEL : Pensez à voter !', 'warning', 4000);
      }
    }, 30000);

    // Deuxième rappel 20 secondes avant la fin
    const timeUntilEnd = voteInfo.votingEnd - Date.now();
    if (timeUntilEnd > 20000) {
      const reminder2 = setTimeout(() => {
        if (!voteConfirmed) {
          addNotification('⚠️ URGENT : Plus que 20 secondes pour voter !', 'warning', 6000);
        }
      }, timeUntilEnd - 20000);

      return () => {
        clearTimeout(reminder1);
        clearTimeout(reminder2);
      };
    }

    return () => clearTimeout(reminder1);
  }, [votingPhase, voteInfo, voteConfirmed]);

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

  const getRoleDescription = () => {
    // Si roleInfo existe (nouveau système), l'utiliser
    if (myRole.roleInfo) {
      return `${myRole.roleInfo.emoji} ${myRole.roleInfo.name} - ${myRole.roleInfo.description}`;
    }
    
    // Fallback ancien système
    const role = myRole.role;
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
    
    // Auto-scroll immédiatement
    setTimeout(() => {
      if (chatEndRef[0]) {
        chatEndRef[0].scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  // Ouvrir le chat et réinitialiser le compteur
  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setUnreadCount(0);
    }
  };

  // Fonctions pour les pouvoirs spéciaux
  const usePower = (powerName, target = null) => {
    if (!gameCode || !socket) return;

    switch (powerName) {
      case 'protect':
        if (target) {
          socket.emit('protect_player', { gameCode, targetSocketId: target });
          setShowPowerModal(false);
        }
        break;
        
      case 'crypt':
        if (target) {
          socket.emit('crypt_player', { gameCode, targetSocketId: target });
          setShowPowerModal(false);
        }
        break;
        
      case 'kill':
        if (target) {
          socket.emit('use_killer_power', { gameCode, targetSocketId: target });
          setShowPowerModal(false);
        }
        break;
        
      case 'ask_question':
        if (target && journalistQuestion.trim()) {
          socket.emit('ask_question', { 
            gameCode, 
            targetSocketId: target,
            question: journalistQuestion.trim()
          });
          setJournalistQuestion('');
          setShowPowerModal(false);
        }
        break;
        
      case 'investigate':
        if (target) {
          socket.emit('investigate_name', { gameCode, targetSocketId: target });
          setShowPowerModal(false);
        }
        break;
        
      case 'swap_pseudos':
        socket.emit('swap_pseudos', { gameCode });
        break;
        
      case 'convert':
        if (target) {
          socket.emit('convert_player', { gameCode, targetSocketId: target });
          setShowPowerModal(false);
        }
        break;
        
      case 'steal_pseudo':
        if (target) {
          socket.emit('steal_pseudo', { gameCode, targetSocketId: target });
          setShowPowerModal(false);
        }
        break;
    }
  };

  const openPowerModal = (powerName) => {
    setActivePower(powerName);
    setShowPowerModal(true);
    setPowerTarget(null);
  };

  // Fonctions BOULANGER
  const savePlayer = (targetSocketId) => {
    if (!gameCode || !socket || !targetSocketId) return;
    socket.emit('save_player', { gameCode, targetSocketId });
    setShowBakerModal(false);
  };

  const revivedKill = (targetSocketId) => {
    if (!gameCode || !socket || !targetSocketId) return;
    socket.emit('revived_kill', { gameCode, targetSocketId });
    setShowRevivedKillModal(false);
    setCanRevivedKill(false);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', gap: '20px', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
      {/* Notifications flottantes - Top Right */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '260px',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '350px'
      }}>
        {notifications.map(notif => (
          <div
            key={notif.id}
            style={{
              padding: '15px 20px',
              background: notif.type === 'warning' ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' :
                         notif.type === 'success' ? 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)' :
                         'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: '4px solid #2C5F7F',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              fontFamily: 'Archivo Black',
              boxShadow: '0 0 0 2px #E8D5B7, 0 8px 25px rgba(0,0,0,0.4)',
              animation: 'slideInRight 0.5s ease-out',
              cursor: 'pointer'
            }}
            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
          >
            {notif.message}
          </div>
        ))}
      </div>

      {/* Panneau latéral rétro arcade - FIXED à droite */}
      <div style={{
        position: 'fixed',
        right: '20px',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '200px',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        border: '6px solid #0f3460',
        boxShadow: '0 0 0 3px #e94560, 0 10px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(233,69,96,0.2)',
        borderRadius: '15px',
        padding: '20px 15px',
        fontFamily: '"Courier New", monospace',
        zIndex: 1000
      }}>
        {/* Timer 1: Temps de partie restant */}
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <div style={{ 
            fontSize: '10px', 
            color: '#0ff', 
            letterSpacing: '1px',
            marginBottom: '10px',
            textShadow: '0 0 5px #0ff',
            fontWeight: 'bold'
          }}>
            MATCH TIME
          </div>
          <svg width="140" height="140" viewBox="0 0 140 140" style={{ margin: '0 auto', display: 'block' }}>
            <circle cx="70" cy="70" r="60" fill="none" stroke="#0f3460" strokeWidth="8" />
            <circle cx="70" cy="70" r="60" fill="none" stroke="#e94560" strokeWidth="8"
              strokeDasharray={`${timeRemaining ? (timeRemaining / 1800000) * 377 : 377} 377`}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ 
                transition: 'stroke-dasharray 1s linear',
                filter: 'drop-shadow(0 0 8px #e94560)'
              }}
            />
            <circle cx="70" cy="70" r="50" fill="#16213e" stroke="#0ff" strokeWidth="2" 
              style={{ filter: 'drop-shadow(0 0 5px #0ff)' }}
            />
            <text x="70" y="65" textAnchor="middle" fill="#0ff" fontSize="18" fontFamily="monospace" fontWeight="bold"
              style={{ textShadow: '0 0 5px #0ff' }}>
              {timeRemaining ? Math.floor(timeRemaining / 60000) : '30'}
            </text>
            <text x="70" y="80" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="monospace">
              MIN
            </text>
          </svg>
        </div>

        {/* Timer 2: Prochain vote */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '10px', 
            color: '#ff0', 
            letterSpacing: '1px',
            marginBottom: '10px',
            textShadow: '0 0 5px #ff0',
            fontWeight: 'bold'
          }}>
            NEXT VOTE
          </div>
          <svg width="140" height="140" viewBox="0 0 140 140" style={{ margin: '0 auto', display: 'block' }}>
            <circle cx="70" cy="70" r="60" fill="none" stroke="#0f3460" strokeWidth="8" />
            <circle cx="70" cy="70" r="60" fill="none" stroke="#00ff88" strokeWidth="8"
              strokeDasharray={voteInfo && voteInfo.discussionEnd ? 
                `${((voteInfo.discussionEnd - Date.now()) / 120000) * 377} 377` : '377 377'}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ 
                transition: 'stroke-dasharray 1s linear',
                filter: 'drop-shadow(0 0 8px #00ff88)'
              }}
            />
            <circle cx="70" cy="70" r="50" fill="#16213e" stroke="#ff0" strokeWidth="2"
              style={{ filter: 'drop-shadow(0 0 5px #ff0)' }}
            />
            <text x="70" y="65" textAnchor="middle" fill="#ff0" fontSize="18" fontFamily="monospace" fontWeight="bold"
              style={{ textShadow: '0 0 5px #ff0' }}>
              {voteInfo && voteInfo.discussionEnd ? 
                Math.floor((voteInfo.discussionEnd - Date.now()) / 1000) : '--'}
            </text>
            <text x="70" y="80" textAnchor="middle" fill="#fff" fontSize="10" fontFamily="monospace">
              SEC
            </text>
          </svg>
        </div>

        {/* Indicateurs de phase */}
        <div style={{ 
          marginTop: '20px', 
          padding: '8px', 
          background: votingPhase ? 'rgba(233,69,96,0.3)' : 'rgba(15,52,96,0.3)',
          border: `2px solid ${votingPhase ? '#e94560' : '#0f3460'}`,
          borderRadius: '5px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '9px', color: '#fff', letterSpacing: '1px', fontWeight: 'bold' }}>
            {votingPhase === 'VOTING' ? '🗳️ VOTE' : 
             votingPhase === 'DISCUSSION' ? '💬 TALK' : '⏸️ WAIT'}
          </div>
        </div>
      </div>

      {/* Zone principale du jeu */}
      <div className="container" style={{ flex: 1, marginRight: '240px' }}>
    <div className="logo-circle"><img src="/logo-bvr.png" alt="Logo Bleu vs Rouge" className="logo-img" /></div>
      <div className="logo">
        <h1 style={{ fontSize: '48px', marginBottom: '15px' }}>
          <span className="blue">BLEU</span>
          <span className="vs">VS</span>
          <span className="red">ROUGE</span>
        </h1>
      </div>

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
            <div className="role">{getRoleDescription()} (couverture)</div>
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
            <div className="role">{getRoleDescription()}</div>
          </>
        )}
        {myRole.munitions > 0 && (
          <div style={{ marginTop: '10px', fontSize: '16px' }}>
            💣 Munitions : {myRole.munitions}
          </div>
        )}
        
        {/* Affichage pour les Amoureux */}
        {myRole.isLover && myRole.loverRealName && (
          <div style={{ 
            marginTop: '15px', 
            padding: '12px', 
            background: 'linear-gradient(135deg, rgba(233, 30, 99, 0.2) 0%, rgba(156, 39, 176, 0.2) 100%)',
            border: '2px solid rgba(233, 30, 99, 0.5)',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '16px', color: '#E91E63', marginBottom: '5px' }}>
              💕 VOUS ÊTES AMOUREUX !
            </div>
            <div style={{ fontSize: '14px', color: '#fff' }}>
              Votre partenaire : <strong>{myRole.loverRealName}</strong>
            </div>
            <div style={{ fontSize: '12px', color: '#ddd', marginTop: '5px' }}>
              ⚠️ Si l'un meurt, l'autre meurt aussi. Pour gagner, soyez les 2 derniers survivants !
            </div>
          </div>
        )}
      </div>

      {/* Interface des Pouvoirs Spéciaux */}
      {myRole.roleInfo && myRole.roleInfo.powers && !isEliminated && (
        <div className="role-card" style={{ marginTop: '15px' }}>
          <h2>{myRole.roleInfo.emoji} Pouvoirs Spéciaux</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Gardien de la Paix */}
            {myRole.roleInfo.powers.protect && (
              <button 
                onClick={() => openPowerModal('protect')}
                style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  border: '2px solid #E8D5B7',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                🛡️ Protéger un joueur
              </button>
            )}
            
            {/* Cyberpompier */}
            {myRole.roleInfo.powers.crypt && (
              <button 
                onClick={() => openPowerModal('crypt')}
                style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                  border: '2px solid #E8D5B7',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                🔒 Crypter un joueur
              </button>
            )}
            
            {/* Tueur */}
            {myRole.roleInfo.powers.kill && myRole.munitions > 0 && (
              <button 
                onClick={() => openPowerModal('kill')}
                style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)',
                  border: '2px solid #E8D5B7',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                🔪 Tuer un joueur ({myRole.munitions} munitions)
              </button>
            )}
            
            {/* Journaliste */}
            {myRole.roleInfo.powers.askQuestion && (
              <button 
                onClick={() => openPowerModal('ask_question')}
                style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                  border: '2px solid #E8D5B7',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                📰 Poser une question
              </button>
            )}
            
            {/* Stalker */}
            {myRole.roleInfo.powers.investigate && (
              <button 
                onClick={() => openPowerModal('investigate')}
                style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                  border: '2px solid #E8D5B7',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                🔎 Enquêter sur un joueur
              </button>
            )}
            
            {/* Hacker */}
            {myRole.roleInfo.powers.swapPseudos && (
              <button 
                onClick={() => usePower('swap_pseudos')}
                disabled={myRole.powerUses && myRole.powerUses.swapPseudos >= 1}
                style={{
                  padding: '12px',
                  background: myRole.powerUses && myRole.powerUses.swapPseudos >= 1 
                    ? '#666' 
                    : 'linear-gradient(135deg, #00BCD4 0%, #0097A7 100%)',
                  border: '2px solid #E8D5B7',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: myRole.powerUses && myRole.powerUses.swapPseudos >= 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  opacity: myRole.powerUses && myRole.powerUses.swapPseudos >= 1 ? 0.5 : 1
                }}
              >
                💻 Échanger les pseudos ({myRole.powerUses?.swapPseudos || 0}/1)
              </button>
            )}
            
            {/* Guru */}
            {myRole.roleInfo.powers.convert && (
              <button 
                onClick={() => openPowerModal('convert')}
                disabled={myRole.powerUses && myRole.powerUses.convert >= 1}
                style={{
                  padding: '12px',
                  background: myRole.powerUses && myRole.powerUses.convert >= 1
                    ? '#666'
                    : 'linear-gradient(135deg, #673AB7 0%, #512DA8 100%)',
                  border: '2px solid #E8D5B7',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: myRole.powerUses && myRole.powerUses.convert >= 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  opacity: myRole.powerUses && myRole.powerUses.convert >= 1 ? 0.5 : 1
                }}
              >
                🧙 Convertir un joueur ({myRole.powerUses?.convert || 0}/1)
              </button>
            )}
            
            {/* Usurpateur */}
            {myRole.roleInfo.powers.stealPseudo && (
              <button 
                onClick={() => openPowerModal('steal_pseudo')}
                disabled={myRole.powerUses && myRole.powerUses.stealPseudo >= 1}
                style={{
                  padding: '12px',
                  background: myRole.powerUses && myRole.powerUses.stealPseudo >= 1
                    ? '#666'
                    : 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
                  border: '2px solid #E8D5B7',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: myRole.powerUses && myRole.powerUses.stealPseudo >= 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  opacity: myRole.powerUses && myRole.powerUses.stealPseudo >= 1 ? 0.5 : 1
                }}
              >
                🎭 Voler un pseudo ({myRole.powerUses?.stealPseudo || 0}/1)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Panel d'informations des Détecteurs */}
      {myRole.roleInfo && (myRole.roleInfo.powers?.detectPlayers || myRole.roleInfo.powers?.detectJobs) && detectiveInfo.length > 0 && (
        <div className="role-card" style={{ marginTop: '15px', maxHeight: '300px', overflow: 'auto' }}>
          <h2>🔍 Informations de Détection</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {detectiveInfo.map(info => (
              <div 
                key={info.id}
                style={{
                  padding: '10px',
                  background: 'rgba(103, 126, 234, 0.1)',
                  border: '1px solid rgba(103, 126, 234, 0.3)',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}
              >
                <div style={{ color: '#667eea', fontSize: '11px', marginBottom: '4px' }}>
                  {info.timestamp}
                </div>
                <div style={{ color: '#fff' }}>
                  {info.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bandeau Mode Spectateur */}
      {isEliminated && (
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          background: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
          border: '4px solid #E74C3C',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'white',
          boxShadow: '0 0 20px rgba(231, 76, 60, 0.5), inset 0 0 20px rgba(231, 76, 60, 0.2)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>👻</div>
          <h3 style={{ 
            color: '#E74C3C', 
            marginBottom: '10px',
            fontSize: '24px',
            textShadow: '0 0 10px rgba(231, 76, 60, 0.8)'
          }}>
            MODE SPECTATEUR
          </h3>
          <div style={{ fontSize: '16px', marginBottom: '10px' }}>
            Vous avez été éliminé
          </div>
          <div style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.6' }}>
            Vous pouvez continuer à suivre la partie et utiliser le chat,<br />
            mais vous ne pouvez plus voter.
          </div>
        </div>
      )}

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
              💀 Joueur {dead.anonymousNumber} - {dead.reason}
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
          background: isEliminated 
            ? 'linear-gradient(135deg, #757575 0%, #424242 100%)'
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          borderRadius: '10px',
          color: 'white',
          opacity: isEliminated ? 0.6 : 1
        }}>
          <h3 style={{ color: 'white', marginBottom: '10px', textAlign: 'center' }}>
            🗳️ Phase de Vote {voteInfo.voteNumber}/{voteInfo.totalVotes}
          </h3>
          <div style={{ fontSize: '14px', textAlign: 'center', marginBottom: '15px' }}>
            {isEliminated 
              ? '👻 Vous ne pouvez pas voter (éliminé)'
              : 'Votez pour éliminer un joueur (n\'importe quelle équipe)'
            }
          </div>
          
          {!voteConfirmed && !isEliminated ? (
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
                      Joueur {player.anonymousNumber}
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
          ) : voteConfirmed && !isEliminated ? (
            <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
              ✅ Vote enregistré !
            </div>
          ) : isEliminated ? (
            <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', opacity: 0.7 }}>
              👻 Vous êtes en mode spectateur
            </div>
          ) : null}
          
          <div style={{ fontSize: '12px', marginTop: '10px', textAlign: 'center', opacity: 0.9 }}>
            Fin du vote dans {formatTime(voteInfo.votingEnd - Date.now())}
          </div>
        </div>
      )}

      {/* Compteur de joueurs en vie */}
      <div style={{
        marginBottom: '20px',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '10px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h3 style={{ color: 'white', marginBottom: '5px', fontSize: '24px' }}>
          👥 Joueurs en vie
        </h3>
        <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
          {gameData.players.filter(p => p.isAlive).length}
        </div>
      </div>

      {/* Bilan des morts */}
      {gameData.players.some(p => !p.isAlive) && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>💀 Joueurs éliminés</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff6b6b' }}>
            {gameData.players.filter(p => !p.isAlive).length}
          </div>
        </div>
      )}

      {!votingPhase && !eliminationMessage && (
        <div style={{ textAlign: 'center', color: '#999', marginTop: '20px', fontSize: '14px' }}>
          ⏰ En attente de la prochaine phase de vote...
        </div>
      )}

      {/* Bouton Chat Flottant - Responsive */}
      <button
        onClick={toggleChat}
        aria-label="Ouvrir le chat"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          width: window.innerWidth < 768 ? '60px' : '70px',
          height: window.innerWidth < 768 ? '60px' : '70px',
          borderRadius: '50%',
          background: showChat 
            ? 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: '4px solid #E8D5B7',
          color: 'white',
          fontSize: window.innerWidth < 768 ? '24px' : '28px',
          cursor: 'pointer',
          boxShadow: '0 0 0 4px #2C5F7F, 0 8px 25px rgba(0,0,0,0.4)',
          zIndex: 1001,
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.15) rotate(5deg)';
          e.target.style.boxShadow = '0 0 0 4px #2C5F7F, 0 12px 35px rgba(102,126,234,0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1) rotate(0deg)';
          e.target.style.boxShadow = '0 0 0 4px #2C5F7F, 0 8px 25px rgba(0,0,0,0.4)';
        }}
      >
        {showChat ? '✕' : '💬'}
        {unreadCount > 0 && !showChat && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#ff4444',
            borderRadius: '50%',
            minWidth: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            padding: '0 6px',
            boxShadow: '0 2px 8px rgba(255,68,68,0.5)',
            animation: 'pulse 2s infinite'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Fenêtre de Chat - RESPONSIVE */}
      {showChat && (
        <div style={{
          position: 'fixed',
          bottom: window.innerWidth < 768 ? '0' : '100px',
          left: window.innerWidth < 768 ? '0' : '20px',
          right: window.innerWidth < 768 ? '0' : 'auto',
          width: window.innerWidth < 768 ? '100%' : '550px',
          maxWidth: window.innerWidth < 768 ? '100%' : 'calc(100vw - 40px)',
          height: window.innerWidth < 768 ? '100vh' : '700px',
          maxHeight: window.innerWidth < 768 ? '100vh' : 'calc(100vh - 120px)',
          background: '#E8D5B7',
          border: window.innerWidth < 768 ? 'none' : '6px solid #2C5F7F',
          borderRadius: window.innerWidth < 768 ? '0' : '15px',
          boxShadow: window.innerWidth < 768 
            ? 'none' 
            : '0 0 0 4px #E8D5B7, 0 15px 50px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 9999,
          overflow: 'hidden',
          animation: window.innerWidth < 768 ? 'slideUpMobile 0.3s ease-out' : 'slideUp 0.3s ease-out'
        }}>;
          {/* En-tête du chat */}
          <div style={{
            padding: window.innerWidth < 768 ? '18px' : '15px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: window.innerWidth < 768 ? '18px' : '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💬 Chat Anonyme
                {messages.length > 0 && (
                  <span style={{
                    background: 'rgba(255,255,255,0.25)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'normal'
                  }}>
                    {messages.length}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '4px' }}>Messages par numéro de joueur</div>
            </div>
            <button
              onClick={toggleChat}
              aria-label="Fermer le chat"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.3)';
                e.target.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'rotate(0deg)';
              }}
            >
              ×
            </button>
          </div>

          {/* Zone des messages - Scrollable */}
          <div 
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: window.innerWidth < 768 ? '12px' : '15px',
              background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
              scrollBehavior: 'smooth'
            }}
            className="chat-messages-container"
          >
            {messages.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                color: '#999', 
                padding: window.innerWidth < 768 ? '40px 20px' : '60px 20px',
                fontSize: '14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{ fontSize: '48px', opacity: 0.5 }}>💬</div>
                <div>
                  Aucun message pour le moment.<br/>
                  <strong>Commencez la discussion !</strong>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div key={idx} style={{
                    marginBottom: '12px',
                    padding: window.innerWidth < 768 ? '12px' : '10px 12px',
                    background: 'white',
                    borderLeft: '4px solid #667eea',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    animation: 'fadeIn 0.3s ease-out',
                    transition: 'transform 0.2s',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px',
                      fontSize: '12px',
                      gap: '10px'
                    }}>
                      <span style={{ 
                        fontWeight: 'bold', 
                        color: '#667eea',
                        background: 'rgba(102,126,234,0.1)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}>
                        🎮 Joueur #{msg.playerNumber}
                      </span>
                      <span style={{ color: '#999', fontSize: '11px', flexShrink: 0 }}>
                        {formatTimestamp(msg.timestamp)}
                      </span>
                    </div>
                    <div style={{ 
                      color: '#333', 
                      fontSize: window.innerWidth < 768 ? '14px' : '12px', 
                      wordWrap: 'break-word',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {msg.message}
                    </div>
                  </div>
                ))}
                <div ref={(el) => chatEndRef[0] = el} style={{ height: '1px' }} />
              </>
            )}
          </div>

          {/* Zone de saisie - Sticky bottom */}
          <form onSubmit={sendMessage} style={{
            padding: window.innerWidth < 768 ? '16px' : '15px',
            borderTop: '3px solid #2C5F7F',
            background: '#E8D5B7',
            display: 'flex',
            gap: window.innerWidth < 768 ? '8px' : '10px',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
          }}>
            <input
              type="text"
              value={currentMessage}
              onChange={e => setCurrentMessage(e.target.value)}
              placeholder={window.innerWidth < 768 ? "Message..." : "Écrivez votre message..."}
              maxLength={200}
              autoFocus={window.innerWidth >= 768}
              style={{
                flex: 1,
                padding: window.innerWidth < 768 ? '16px' : '18px',
                border: '3px solid #2C5F7F',
                borderRadius: '10px',
                fontSize: window.innerWidth < 768 ? '16px' : '15px',
                outline: 'none',
                background: 'white',
                fontFamily: 'Courier Prime, monospace',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={e => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102,126,234,0.2)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#2C5F7F';
                e.target.style.boxShadow = 'none';
              }}
              disabled={false}
            />
            <button
              type="submit"
              aria-label="Envoyer le message"
              style={{
                padding: window.innerWidth < 768 ? '14px 20px' : '12px 24px',
                background: currentMessage.trim() 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : 'linear-gradient(135deg, #ccc 0%, #aaa 100%)',
                border: '3px solid #2C5F7F',
                borderRadius: '10px',
                color: 'white',
                fontWeight: 'bold',
                cursor: currentMessage.trim() ? 'pointer' : 'not-allowed',
                fontSize: window.innerWidth < 768 ? '20px' : '18px',
                transition: 'all 0.2s',
                boxShadow: currentMessage.trim() ? '0 4px 12px rgba(102,126,234,0.4)' : 'none',
                minWidth: window.innerWidth < 768 ? '56px' : '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              disabled={!currentMessage.trim()}
              onMouseEnter={e => {
                if (currentMessage.trim()) {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102,126,234,0.5)';
                }
              }}
              onMouseLeave={e => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = currentMessage.trim() ? '0 4px 12px rgba(102,126,234,0.4)' : 'none';
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Modal de sélection de cible pour les pouvoirs */}
      {showPowerModal && activePower && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.3s ease-out'
        }} onClick={() => setShowPowerModal(false)}>
          <div style={{
            background: '#E8D5B7',
            border: '6px solid #2C5F7F',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 0 0 4px #E8D5B7, 0 15px 50px rgba(0,0,0,0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px', color: '#2C5F7F', textAlign: 'center' }}>
              {activePower === 'protect' && '🛡️ Choisir un joueur à protéger'}
              {activePower === 'crypt' && '🔒 Choisir un joueur à crypter'}
              {activePower === 'kill' && '🔪 Choisir une cible à éliminer'}
              {activePower === 'ask_question' && '📰 Poser une question à un joueur'}
              {activePower === 'investigate' && '🔎 Enquêter sur un joueur'}
              {activePower === 'convert' && '🧙 Choisir un joueur à convertir'}
              {activePower === 'steal_pseudo' && '🎭 Choisir un pseudo à voler'}
            </h2>

            {/* Question du journaliste */}
            {activePower === 'ask_question' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#2C5F7F' }}>
                  Votre question (max 100 caractères) :
                </label>
                <input
                  type="text"
                  value={journalistQuestion}
                  onChange={(e) => setJournalistQuestion(e.target.value.slice(0, 100))}
                  placeholder="Posez une question..."
                  maxLength={100}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '3px solid #2C5F7F',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'Courier Prime, monospace'
                  }}
                />
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {journalistQuestion.length}/100
                </div>
              </div>
            )}

            {/* Liste des joueurs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {gameData.players.filter(p => p.isAlive && p.pseudo !== pseudo).map(player => (
                <button
                  key={player.socketId}
                  onClick={() => setPowerTarget(player.socketId)}
                  style={{
                    padding: '15px',
                    background: powerTarget === player.socketId 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                      : 'white',
                    border: `3px solid ${powerTarget === player.socketId ? '#667eea' : '#2C5F7F'}`,
                    borderRadius: '10px',
                    color: powerTarget === player.socketId ? 'white' : '#2C5F7F',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Joueur {player.anonymousNumber}</span>
                    {powerTarget === player.socketId && <span>✓</span>}
                  </div>
                </button>
              ))}
            </div>

            {/* Boutons d'action */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  if (powerTarget) {
                    usePower(activePower, powerTarget);
                  }
                }}
                disabled={!powerTarget || (activePower === 'ask_question' && !journalistQuestion.trim())}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: (!powerTarget || (activePower === 'ask_question' && !journalistQuestion.trim()))
                    ? '#ccc'
                    : 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
                  border: '3px solid #2C5F7F',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: (!powerTarget || (activePower === 'ask_question' && !journalistQuestion.trim()))
                    ? 'not-allowed'
                    : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Confirmer
              </button>
              <button
                onClick={() => setShowPowerModal(false)}
                style={{
                  flex: 1,
                  padding: '15px',
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                  border: '3px solid #2C5F7F',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal BOULANGER - Sauver un joueur */}
      {showBakerModal && saveableTargets.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.3s ease-out'
        }} onClick={() => setShowBakerModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
            border: '6px solid #2C5F7F',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 0 0 4px #E8D5B7, 0 15px 50px rgba(0,0,0,0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px', color: 'white', textAlign: 'center' }}>
              🍞 BOULANGER - Sauver un joueur !
            </h2>
            <p style={{ color: 'white', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>
              Un membre de votre équipe va être éliminé ! Vous avez 30 secondes pour le sauver.
              Le joueur sauvé pourra tuer quelqu'un en représailles !
            </p>

            {/* Liste des joueurs sauvables */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {saveableTargets.map(target => {
                const player = gameData.players.find(p => p.socketId === target.socketId);
                return player ? (
                  <button
                    key={target.socketId}
                    onClick={() => savePlayer(target.socketId)}
                    style={{
                      padding: '15px',
                      background: 'white',
                      border: '3px solid #2C5F7F',
                      borderRadius: '10px',
                      color: '#2C5F7F',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)';
                      e.target.style.color = 'white';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'white';
                      e.target.style.color = '#2C5F7F';
                    }}
                  >
                    🍞 Sauver le Joueur #{player.anonymousNumber}
                  </button>
                ) : null;
              })}
            </div>

            <button
              onClick={() => setShowBakerModal(false)}
              style={{
                width: '100%',
                padding: '15px',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                border: '3px solid #2C5F7F',
                borderRadius: '10px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Ne pas sauver
            </button>
          </div>
        </div>
      )}

      {/* Modal JOUEUR SAUVÉ - Tuer en représailles */}
      {showRevivedKillModal && canRevivedKill && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.3s ease-out'
        }} onClick={() => setShowRevivedKillModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)',
            border: '6px solid #2C5F7F',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 0 0 4px #E8D5B7, 0 15px 50px rgba(0,0,0,0.5)'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: '20px', color: 'white', textAlign: 'center' }}>
              🍞 VOUS ÊTES SAUVÉ !
            </h2>
            <p style={{ color: 'white', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>
              Un boulanger vous a sauvé de l'élimination ! Vous pouvez maintenant TUER UN JOUEUR en représailles.
              ⚠️ Vous ne pouvez pas tuer le boulanger qui vous a sauvé.
            </p>

            {/* Liste des joueurs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {gameData.players.filter(p => p.isAlive && p.pseudo !== pseudo).map(player => (
                <button
                  key={player.socketId}
                  onClick={() => revivedKill(player.socketId)}
                  style={{
                    padding: '15px',
                    background: 'white',
                    border: '3px solid #2C5F7F',
                    borderRadius: '10px',
                    color: '#2C5F7F',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, #F44336 0%, #D32F2F 100%)';
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.color = '#2C5F7F';
                  }}
                >
                  ☠️ Tuer le Joueur #{player.anonymousNumber}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowRevivedKillModal(false)}
              style={{
                width: '100%',
                padding: '15px',
                background: 'linear-gradient(135deg, #666 0%, #444 100%)',
                border: '3px solid #2C5F7F',
                borderRadius: '10px',
                color: 'white',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Ne pas tuer (pour l'instant)
            </button>
          </div>
        </div>
      )}

      {/* Historique de la partie */}
      <GameHistory socket={socket} gameCode={gameCode} />
      </div>
    </div>
  );
}

export default Game;

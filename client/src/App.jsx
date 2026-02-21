// -*- coding: utf-8 -*-
// @charset "UTF-8"
import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';
import GameEnded from './components/GameEnded';
import ProfilePage from './components/ProfilePage';
import Tutorial from './components/Tutorial';
import SettingsPanel from './components/SettingsPanel';

// URL UNIQUE - RENDER UNIQUEMENT
const SOCKET_URL = 'https://jeu-bleu-rouge.onrender.com';
const API_URL = 'https://jeu-bleu-rouge.onrender.com';

console.log('🔌 Connexion Socket.io vers:', SOCKET_URL);

function App() {
  const [screen, setScreen] = useState('HOME'); // HOME, LOBBY, GAME, PROFILE
  const [gameCode, setGameCode] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [myRole, setMyRole] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState('');
  const [endGameData, setEndGameData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [csrfToken, setCsrfToken] = useState(null); // ✅ Token CSRF
  const [showTutorial, setShowTutorial] = useState(false); // État pour le tutoriel
  const [socketKey, setSocketKey] = useState(0); // Pour forcer la recréation du socket
  
  const socketRef = useRef(null);

  // Vérifier si c'est la première visite
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  // � Récupérer le token CSRF au démarrage
  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        const response = await fetch(`${API_URL}/api/csrf-token`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrfToken);
          console.log('🔐 Token CSRF récupéré');
        }
      } catch (error) {
        console.error('❌ Erreur récupération token CSRF:', error);
      }
    }
    
    fetchCsrfToken();
  }, []);

  // 🔌 Initialiser et gérer le socket (se recréera quand socketKey change)
  useEffect(() => {
    // Charger l'utilisateur depuis localStorage
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Créer le socket avec le token actuel
    console.log('🔌 Création du socket...', token ? 'avec auth' : 'sans auth');
    const socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Debug socket
    socket.onAny((event, ...args) => {
      console.log('📡 Socket événement reçu:', event, args);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion Socket.io:', error);
    });

    socket.on('connect_timeout', () => {
      console.error('⏱️ Timeout de connexion Socket.io');
    });

    // Gestion de la connexion Socket.io
    socket.on('connect', () => {
      console.log('✅ Connecté au serveur');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Déconnecté du serveur');
      setIsConnected(false);
    });

    // Écoute la création de partie
    socket.on('game_created', (data) => {
      console.log('✅ Partie créée:', data);
      setGameCode(data.gameCode);
      setScreen('LOBBY');
      setIsLoading(false);
    });

    // Écoute la connexion à une partie
    socket.on('game_joined', (data) => {
      console.log('✅ Partie rejointe:', data);
      setGameCode(data.gameCode);
      setScreen('LOBBY');
      setIsLoading(false);
    });

    // Écoute les mises à jour de la salle
    socket.on('update_room', (data) => {
      setGameData(data);
      if (data.status === 'PLAYING') {
        setScreen('GAME');
      }
    });

    // Écoute l'attribution du rôle
    socket.on('your_role', (data) => {
      setMyRole(data);
    });

    // Écoute les erreurs
    socket.on('error', (data) => {
      console.error('❌ Erreur:', data.message);
      setError(data.message);
      setIsLoading(false);
      setTimeout(() => setError(''), 3000);
    });

    // Écoute la fin de partie
    socket.on('game_ended', (data) => {
      setEndGameData(data);
      setScreen('GAME_ENDED');
    });

    return () => {
      console.log('🔌 Nettoyage du socket...');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('game_created');
      socket.off('game_joined');
      socket.off('update_room');
      socket.off('your_role');
      socket.off('error');
      socket.off('game_ended');
      socket.disconnect();
    };
  }, [socketKey]); // Se recrée quand socketKey change

  const createGame = (pseudo, realLifeInfo) => {
    console.log('🎮 Création de partie...', { pseudo, realLifeInfo });
    setPseudo(pseudo);
    setIsLoading(true);
    
    // Envoyer le userId si l'utilisateur est connecté
    const gameData = { pseudo, realLifeInfo };
    if (user && user._id) {
      gameData.userId = user._id;
    }
    
    if (socketRef.current) {
      socketRef.current.emit('create_game', gameData);
    }
  };

  const joinGame = (code, pseudo, realLifeInfo) => {
    console.log('👥 Rejoindre la partie...', { code, pseudo, realLifeInfo });
    setPseudo(pseudo);
    setIsLoading(true);
    if (socketRef.current) {
      socketRef.current.emit('join_game', { gameCode: code, pseudo, realLifeInfo });
    }
  };

  const startGame = (duration) => {
    if (socketRef.current) {
      socketRef.current.emit('start_game', { gameCode, duration });
    }
  };

  const returnHome = () => {
    setScreen('HOME');
    setGameCode('');
    setPseudo('');
    setMyRole(null);
    setGameData(null);
    setEndGameData(null);
  };

  const handleLoginSuccess = (userData) => {
    console.log('✅ Connexion réussie, reconnexion du socket...');
    setUser(userData);
    // Forcer la recréation du socket avec le nouveau token
    setSocketKey(k => k + 1);
  };

  return (
    <div>
      {/* Bouton d'aide flottant pour rouvrir le tutoriel */}
      {!showTutorial && screen === 'HOME' && (
        <button
          onClick={() => setShowTutorial(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2C5F7F 0%, #1a3a4d 100%)',
            border: '3px solid #8B6F47',
            color: '#FFF',
            fontSize: '28px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
          }}
          title="Ouvrir le tutoriel"
        >
          ?
        </button>
      )}

      {/* Tutorial modal */}
      {showTutorial && (
        <Tutorial onClose={() => setShowTutorial(false)} />
      )}

      {/* Panneau de paramètres */}
      <SettingsPanel />

      {!isConnected && (
        <div style={{ 
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
          color: '#f4e4c1',
          padding: '12px 24px',
          borderRadius: '6px',
          border: '3px solid #7f1d1d',
          fontWeight: '700',
          fontSize: '14px',
          textShadow: '1px 1px 0 rgba(0,0,0,0.3)',
          boxShadow: '0 4px 0 #7f1d1d, 0 6px 12px rgba(0,0,0,0.4)',
          fontFamily: 'Arial, Helvetica, sans-serif',
          zIndex: 9999
        }}>
          ⚠️ Connexion au serveur en cours...
        </div>
      )}
      
      {error && <div className="error" style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '500px',
        zIndex: 9999
      }}>{error}</div>}
      
      {isLoading && (
        <div style={{ 
          position: 'fixed', 
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          background: 'rgba(44, 24, 16, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f4e4c1 0%, #e8d5b7 100%)',
            padding: '40px 60px',
            borderRadius: '8px',
            border: '3px solid #8b6f47',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
            textAlign: 'center',
            color: '#2c1810',
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '24px',
            letterSpacing: '2px'
          }}>
            ⏳ Chargement...
          </div>
        </div>
      )}

      {screen === 'HOME' && (
        <Home 
          createGame={createGame} 
          joinGame={joinGame}
          onViewProfile={() => setScreen('PROFILE')}
          onLoginSuccess={handleLoginSuccess}
          csrfToken={csrfToken}
        />
      )}

      {screen === 'PROFILE' && (
        <ProfilePage 
          user={user}
          onBack={() => setScreen('HOME')}
          onRejoinGame={(gameCode) => {
            setScreen('HOME');
            // Le rejoin sera géré par Home
          }}
          csrfToken={csrfToken}
        />
      )}

      {screen === 'LOBBY' && (
        <Lobby
          gameCode={gameCode}
          gameData={gameData}
          pseudo={pseudo}
          startGame={startGame}
        />
      )}

      {screen === 'GAME' && (
        <Game
          gameCode={gameCode}
          gameData={gameData}
          myRole={myRole}
          pseudo={pseudo}
          socket={socketRef.current}
        />
      )}

      {screen === 'GAME_ENDED' && (
        <GameEnded
          endGameData={endGameData}
          onReturnHome={returnHome}
        />
      )}
    </div>
  );
}

export default App;

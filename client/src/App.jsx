import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game';

const socket = io('http://localhost:3000');

function App() {
  const [screen, setScreen] = useState('HOME'); // HOME, LOBBY, GAME
  const [gameCode, setGameCode] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [myRole, setMyRole] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Écoute la création de partie
    socket.on('game_created', (data) => {
      setGameCode(data.gameCode);
      setScreen('LOBBY');
    });

    // Écoute la connexion à une partie
    socket.on('game_joined', (data) => {
      setGameCode(data.gameCode);
      setScreen('LOBBY');
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
      setError(data.message);
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      socket.off('game_created');
      socket.off('game_joined');
      socket.off('update_room');
      socket.off('your_role');
      socket.off('error');
    };
  }, []);

  const createGame = (pseudo, realLifeInfo) => {
    setPseudo(pseudo);
    socket.emit('create_game', { pseudo, realLifeInfo });
  };

  const joinGame = (code, pseudo, realLifeInfo) => {
    setPseudo(pseudo);
    socket.emit('join_game', { gameCode: code, pseudo, realLifeInfo });
  };

  const startGame = () => {
    socket.emit('start_game', { gameCode });
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}

      {screen === 'HOME' && (
        <Home createGame={createGame} joinGame={joinGame} />
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
          socket={socket}
        />
      )}
    </div>
  );
}

export default App;

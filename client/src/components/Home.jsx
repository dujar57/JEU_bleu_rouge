import { useState } from 'react';

function Home({ createGame, joinGame }) {
  const [mode, setMode] = useState(''); // 'create' ou 'join'
  const [pseudo, setPseudo] = useState('');
  const [realLifeInfo, setRealLifeInfo] = useState('');
  const [code, setCode] = useState('');

  const handleCreateGame = () => {
    if (pseudo.trim() && realLifeInfo.trim()) {
      createGame(pseudo, realLifeInfo);
    }
  };

  const handleJoinGame = () => {
    if (pseudo.trim() && realLifeInfo.trim() && code.trim()) {
      joinGame(code.toUpperCase(), pseudo, realLifeInfo);
    }
  };

  if (mode === '') {
    return (
      <div className="container">
        <h1>🔵 BLEU vs ROUGE 🔴</h1>
        <button onClick={() => setMode('create')}>Créer une partie</button>
        <button className="secondary" onClick={() => setMode('join')}>
          Rejoindre une partie
        </button>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="container">
        <h2>Créer une partie</h2>
        <input
          type="text"
          placeholder="Votre pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
        />
        <input
          type="text"
          placeholder="Votre classe (ex: Terminale 2)"
          value={realLifeInfo}
          onChange={(e) => setRealLifeInfo(e.target.value)}
        />
        <button onClick={handleCreateGame}>Créer</button>
        <button className="secondary" onClick={() => setMode('')}>
          Retour
        </button>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="container">
        <h2>Rejoindre une partie</h2>
        <input
          type="text"
          placeholder="Code de la partie"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={4}
        />
        <input
          type="text"
          placeholder="Votre pseudo"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
        />
        <input
          type="text"
          placeholder="Votre classe (ex: Terminale 2)"
          value={realLifeInfo}
          onChange={(e) => setRealLifeInfo(e.target.value)}
        />
        <button onClick={handleJoinGame}>Rejoindre</button>
        <button className="secondary" onClick={() => setMode('')}>
          Retour
        </button>
      </div>
    );
  }
}

export default Home;

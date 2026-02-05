// -*- coding: utf-8 -*-
// @charset "UTF-8"
import { useState } from 'react';

function Home({ createGame, joinGame }) {
  const [mode, setMode] = useState(''); // 'create' ou 'join'
  const [pseudo, setPseudo] = useState('');
  const [realLifeInfo, setRealLifeInfo] = useState('');
  const [code, setCode] = useState('');

  const handleCreateGame = (e) => {
    e.preventDefault();
    console.log('🔵 handleCreateGame appelé', { pseudo, realLifeInfo });
    if (pseudo.trim() && realLifeInfo.trim()) {
      console.log('✅ Validation OK, appel createGame');
      createGame(pseudo, realLifeInfo);
    } else {
      console.log('❌ Validation échouée');
      alert('Veuillez remplir tous les champs');
    }
  };

  const handleJoinGame = (e) => {
    e.preventDefault();
    console.log('🔴 handleJoinGame appelé', { pseudo, realLifeInfo, code });
    if (pseudo.trim() && realLifeInfo.trim() && code.trim()) {
      console.log('✅ Validation OK, appel joinGame');
      joinGame(code.toUpperCase(), pseudo, realLifeInfo);
    } else {
      console.log('❌ Validation échouée');
      alert('Veuillez remplir tous les champs');
    }
  };

  if (mode === '') {
    return (
      <div className="container">
        <div className="logo-circle"><img src="/logo-bvr.png" alt="Logo Bleu vs Rouge" className="logo-img" /></div>
        <div className="logo">
          <h1>
            <span className="blue">BLEU</span>
            <span className="vs">VS</span>
            <span className="red">ROUGE</span>
          </h1>
          <p className="tagline">INFILTRATION • DÉDUCTION • ÉLIMINATION</p>
        </div>
        <button onClick={() => setMode('create')}>📝 Créer une partie</button>
        <button className="secondary" onClick={() => setMode('join')}>
          🎯 Rejoindre une partie
        </button>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="container">
        <h2>📝 Créer une partie</h2>
        <p style={{
          marginBottom: '25px',
          fontSize: '14px',
          color: '#5d4e37',
          fontStyle: 'italic'
        }}>
          Remplissez les informations ci-dessous
        </p>
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
        <button onClick={handleCreateGame}>✓ Créer</button>
        <button className="secondary" onClick={() => setMode('')}>
          ← Retour
        </button>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="container">
        <h2>🎯 Rejoindre une partie</h2>
        <p style={{
          marginBottom: '25px',
          fontSize: '14px',
          color: '#5d4e37',
          fontStyle: 'italic'
        }}>
          Entrez le code de la partie
        </p>
        <input
          type="text"
          placeholder="Code de la partie (4 lettres)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={4}
          style={{ textTransform: 'uppercase', textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
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
        <button onClick={handleJoinGame}>✓ Rejoindre</button>
        <button className="secondary" onClick={() => setMode('')}>
          ← Retour
        </button>
      </div>
    );
  }
}

export default Home;

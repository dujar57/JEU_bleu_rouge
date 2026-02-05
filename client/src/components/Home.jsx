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
        
        <div className="description">
          <p><strong>🎯 OBJECTIF :</strong> Découvrez qui sont les traîtres infiltrés dans votre équipe avant qu'il ne soit trop tard !</p>
          <p><strong>👥 JOUEURS :</strong> 4 minimum (8+ pour les traîtres)</p>
          <p><strong>⏱️ DURÉE :</strong> De 20 minutes à 10 jours</p>
        </div>

        <button onClick={() => setMode('create')}>🎮 CRÉER UNE PARTIE</button>
        <button className="secondary" onClick={() => setMode('join')}>
          🔗 REJOINDRE UNE PARTIE
        </button>
        
        <div className="rules">
          <h3>📋 COMMENT JOUER ?</h3>
          <ul>
            <li><strong>Deux équipes :</strong> Bleus contre Rouges</li>
            <li><strong>Traîtres cachés :</strong> Certains joueurs infiltrent l'équipe adverse</li>
            <li><strong>Votes réguliers :</strong> Éliminez les suspects à chaque tour</li>
            <li><strong>Chat anonyme :</strong> Discutez sans révéler votre identité</li>
            <li><strong>Gagnez :</strong> Éliminez tous les adversaires ou démasquez les traîtres</li>
          </ul>
        </div>
        
        <div className="auth-links">
          <a href="/login.html">CONNEXION</a>
          <span style={{ color: 'rgba(44,95,127,0.3)', fontSize: '24px' }}>|</span>
          <a href="/register.html">INSCRIPTION</a>
        </div>
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

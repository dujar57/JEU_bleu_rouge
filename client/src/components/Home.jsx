// -*- coding: utf-8 -*-
// @charset "UTF-8"
import { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import AccountMenu from './AccountMenu';

function Home({ createGame, joinGame, onViewProfile, onLoginSuccess, csrfToken }) {
    // Synchronisation utilisateur après modification du profil
    const handleUserUpdate = (updatedUser) => {
      setUser(updatedUser);
    };
  const [mode, setMode] = useState(''); // 'create', 'join', 'login', ou 'register'
  const [pseudo, setPseudo] = useState('');
  const [realLifeInfo, setRealLifeInfo] = useState('');
  const [code, setCode] = useState('');
  const [user, setUser] = useState(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setMode(''); // Return to main screen
    // Appeler le callback du parent App.jsx pour reconnecter le socket
    if (onLoginSuccess) {
      onLoginSuccess(userData);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowAccountMenu(false);
    alert('👋 Déconnexion réussie !');
  };

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

  if (mode === 'login') {
    return <Login onBack={() => setMode('')} onLoginSuccess={handleLoginSuccess} csrfToken={csrfToken} />;
  }

  if (mode === 'register') {
    return <Register onBack={() => setMode('')} onRegisterSuccess={handleLoginSuccess} csrfToken={csrfToken} />;
  }

  if (mode === '') {
    return (
      <>
        {/* Account Button - Top Left */}
        {user && (
          <button
            onClick={() => setShowAccountMenu(true)}
            className="account-button"
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            👤
          </button>
        )}

        {/* Account Menu Modal */}
        {showAccountMenu && (
          <AccountMenu
            user={user}
            onClose={() => setShowAccountMenu(false)}
            onLogout={handleLogout}
            csrfToken={csrfToken}
            onUserUpdate={handleUserUpdate}
            onRejoinGame={(gameCode) => {
              setCode(gameCode);
              setShowAccountMenu(false);
              // Auto-remplir les champs et rejoindre directement
              if (user.username) {
                setPseudo(user.username);
                setMode('join');
                setCode(gameCode);
              }
            }}
          />
        )}

        <div className="container">
        {/* Bandeau de bienvenue si connecté - CLIQUABLE */}
        {user && (
          <div 
            onClick={onViewProfile}
            className="user-banner"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 0 0 4px #E8D5B7, 0 15px 40px rgba(102,126,234,0.5), inset 0 2px 8px rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 0 4px #E8D5B7, 0 10px 30px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.3)';
            }}
          >
            <div className="user-banner-title">
              ⚡ CONNECTÉ ⚡
            </div>
            <div className="user-banner-username">
              🎮 JOUEUR : <span className="user-banner-name">{user.username.toUpperCase()}</span> 🎮
            </div>
            <div className="user-banner-stats">
              🏆 {user.gamesPlayed || 0} parties • {user.gamesWon || 0} victoires
            </div>
            <div className="user-banner-hint">
              👆 CLIQUEZ POUR VOIR VOTRE PROFIL DÉTAILLÉ
            </div>
          </div>
        )}
        
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
          <p><strong>🎯 OBJECTIF :</strong> Éliminer les autres équipes grâce aux rôles secrets et aux stratégies, jusqu'à devenir le dernier camp survivant.</p>
          <p><strong>👥 JOUEURS :</strong> 4 minimum (8+ pour les traîtres)</p>
          <p><strong>⏱️ DURÉE :</strong> De 20 minutes à 10 jours</p>
        </div>

        <button onClick={() => setMode('create')}>🎮 CRÉER UNE PARTIE</button>
        <button className="secondary" onClick={() => setMode('join')}>
          🔗 REJOINDRE UNE PARTIE
        </button>
        
        {/* Auth Links - Show Login/Register or Logout */}
        <div className="auth-links">
          {!user ? (
            <>
              <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: '#2C5F7F', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Arial, Helvetica, sans-serif' }}>CONNEXION</button>
              <span style={{ color: 'rgba(44,95,127,0.3)', fontSize: '24px' }}>|</span>
              <button onClick={() => setMode('register')} style={{ background: 'none', border: 'none', color: '#2C5F7F', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Arial, Helvetica, sans-serif' }}>INSCRIPTION</button>
            </>
          ) : (
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ff416c', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Arial, Helvetica, sans-serif' }}>
              🚪 DÉCONNEXION
            </button>
          )}
        </div>
        
        <div className="rules">
          <h3>📋 RÈGLES DU JEU</h3>
          <ul>
            <li><strong>Deux équipes :</strong> Bleus contre Rouges, assignées aléatoirement</li>
            <li><strong>Rôles secrets :</strong> Chaque joueur reçoit un rôle unique avec des pouvoirs spéciaux</li>
            <li><strong>Double identité :</strong> Un nom réel visible + un numéro anonyme pour le chat</li>
            <li><strong>Votes stratégiques :</strong> Éliminez un joueur à chaque tour de vote</li>
            <li><strong>Représentant :</strong> Élu après le 1er vote, sa mort peut faire perdre l'équipe</li>
            <li><strong>Victoire :</strong> Éliminer le représentant adverse et tous ses coéquipiers</li>
          </ul>
        </div>
      </div>
      </>
    );
  }

  if (mode === 'login') {
    return <Login onBack={() => setMode('')} onLoginSuccess={handleLoginSuccess} />;
  }

  if (mode === 'register') {
    return <Register onBack={() => setMode('')} onRegisterSuccess={handleLoginSuccess} csrfToken={csrfToken} />;
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

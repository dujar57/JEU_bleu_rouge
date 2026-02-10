// -*- coding: utf-8 -*-
// @charset "UTF-8"
import { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import AccountMenu from './AccountMenu';

function Home({ createGame, joinGame, onViewProfile }) {
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
    return <Login onBack={() => setMode('')} onLoginSuccess={handleLoginSuccess} />;
  }

  if (mode === 'register') {
    return <Register onBack={() => setMode('')} />;
  }

  if (mode === '') {
    return (
      <>
        {/* Account Button - Top Left */}
        {user && (
          <button
            onClick={() => setShowAccountMenu(true)}
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: '4px solid #2C5F7F',
              boxShadow: '0 0 0 2px #E8D5B7, 0 8px 20px rgba(0,0,0,0.3)',
              color: 'white',
              fontSize: '28px',
              cursor: 'pointer',
              zIndex: 1000,
              transition: 'transform 0.2s'
            }}
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
            style={{
              position: 'relative',
              marginBottom: '30px',
              padding: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: '6px solid #2C5F7F',
              borderRadius: '15px',
              boxShadow: '0 0 0 4px #E8D5B7, 0 10px 30px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.3)',
              textAlign: 'center',
              animation: 'pulse 2s ease-in-out infinite',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 0 0 4px #E8D5B7, 0 15px 40px rgba(102,126,234,0.5), inset 0 2px 8px rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 0 4px #E8D5B7, 0 10px 30px rgba(0,0,0,0.3), inset 0 2px 8px rgba(255,255,255,0.3)';
            }}
          >
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              fontFamily: 'Archivo Black',
              textShadow: '0 0 10px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)',
              marginBottom: '8px',
              letterSpacing: '2px'
            }}>
              ⚡ CONNECTÉ ⚡
            </div>
            <div style={{
              fontSize: '20px',
              color: '#fff',
              fontFamily: 'Anton',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              letterSpacing: '1px'
            }}>
              🎮 JOUEUR : <span style={{ 
                color: '#00ff88',
                fontWeight: 'bold',
                textShadow: '0 0 10px #00ff88, 0 2px 4px rgba(0,0,0,0.5)'
              }}>{user.username.toUpperCase()}</span> 🎮
            </div>
            <div style={{
              marginTop: '10px',
              fontSize: '14px',
              color: 'rgba(255,255,255,0.8)',
              fontFamily: 'Courier Prime'
            }}>
              🏆 {user.gamesPlayed || 0} parties • {user.gamesWon || 0} victoires
            </div>
            <div style={{
              marginTop: '12px',
              fontSize: '12px',
              color: 'rgba(255,255,255,0.9)',
              fontFamily: 'Archivo Black',
              letterSpacing: '1px'
            }}>
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
        
        {/* Auth Links - Show Login/Register or Logout */}
        <div className="auth-links">
          {!user ? (
            <>
              <button onClick={() => setMode('login')} style={{ background: 'none', border: 'none', color: '#2C5F7F', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Archivo Black' }}>CONNEXION</button>
              <span style={{ color: 'rgba(44,95,127,0.3)', fontSize: '24px' }}>|</span>
              <button onClick={() => setMode('register')} style={{ background: 'none', border: 'none', color: '#2C5F7F', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Archivo Black' }}>INSCRIPTION</button>
            </>
          ) : (
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#ff416c', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Archivo Black' }}>
              🚪 DÉCONNEXION
            </button>
          )}
        </div>
      </div>
      </>
    );
  }

  if (mode === 'login') {
    return <Login onBack={() => setMode('')} onLoginSuccess={handleLoginSuccess} />;
  }

  if (mode === 'register') {
    return <Register onBack={() => setMode('')} />;
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

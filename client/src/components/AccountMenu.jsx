import { useState, useEffect } from 'react';

export default function AccountMenu({ user, onClose, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [matchHistory, setMatchHistory] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://jeu-bleu-rouge.onrender.com/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMatchHistory(data.matchHistory || []);
        setCurrentMatch(data.currentMatch || null);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(0,0,0,0.7)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: '#E8D5B7',
        border: '8px solid #2C5F7F',
        borderRadius: '20px',
        boxShadow: '0 0 0 4px #E8D5B7, 0 25px 50px rgba(0,0,0,0.5)',
        width: '90%',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #2C5F7F 0%, #1a3d5c 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontFamily: 'Archivo Black', fontSize: '24px' }}>
            👤 MON COMPTE
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '2px solid white',
              color: 'white',
              fontSize: '24px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: '#d4c5a7',
          borderBottom: '4px solid #2C5F7F'
        }}>
          {['profile', 'history', 'current'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '15px',
                background: activeTab === tab ? '#E8D5B7' : 'transparent',
                border: 'none',
                borderRight: '2px solid #2C5F7F',
                cursor: 'pointer',
                fontFamily: 'Archivo Black',
                fontSize: '14px',
                color: '#2C5F7F',
                textTransform: 'uppercase'
              }}
            >
              {tab === 'profile' && '📋 PROFIL'}
              {tab === 'history' && '🏆 HISTORIQUE'}
              {tab === 'current' && '🎮 MATCH EN COURS'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          background: '#E8D5B7'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#2C5F7F' }}>
              ⏳ Chargement...
            </div>
          ) : (
            <>
              {activeTab === 'profile' && (
                <div>
                  <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '3px solid #2C5F7F',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ marginTop: 0, color: '#2C5F7F' }}>Informations</h3>
                    <p><strong>👤 Pseudo:</strong> {user?.username || 'N/A'}</p>
                    <p><strong>📧 Email:</strong> {user?.email || 'N/A'}</p>
                    <p><strong>🎮 Parties jouées:</strong> {user?.gamesPlayed || 0}</p>
                    <p><strong>🏆 Victoires:</strong> {user?.gamesWon || 0}</p>
                    <p><strong>📊 Taux de victoire:</strong> {
                      user?.gamesPlayed > 0 
                        ? `${Math.round((user?.gamesWon / user?.gamesPlayed) * 100)}%`
                        : '0%'
                    }</p>
                  </div>

                  <button
                    onClick={onLogout}
                    style={{
                      width: '100%',
                      padding: '15px',
                      background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                      border: '3px solid #2C5F7F',
                      borderRadius: '10px',
                      color: 'white',
                      fontFamily: 'Archivo Black',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    🚪 DÉCONNEXION
                  </button>
                </div>
              )}

              {activeTab === 'history' && (
                <div>
                  {matchHistory.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#2C5F7F',
                      background: 'white',
                      borderRadius: '10px',
                      border: '3px solid #2C5F7F'
                    }}>
                      <p style={{ fontSize: '48px', margin: '0' }}>🎮</p>
                      <p>Aucune partie jouée pour le moment</p>
                    </div>
                  ) : (
                    matchHistory.map((match, index) => (
                      <div key={index} style={{
                        background: 'white',
                        padding: '15px',
                        borderRadius: '10px',
                        border: '3px solid #2C5F7F',
                        marginBottom: '10px'
                      }}>
                        <p><strong>🎯 Code:</strong> {match.gameId}</p>
                        <p><strong>🏆 Résultat:</strong> {match.won ? '✅ VICTOIRE' : '❌ DÉFAITE'}</p>
                        <p><strong>👥 Équipe:</strong> {match.team === 'bleu' ? '🔵 BLEU' : '🔴 ROUGE'}</p>
                        <p><strong>📅 Date:</strong> {new Date(match.date).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'current' && (
                <div>
                  {currentMatch ? (
                    <div style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '10px',
                      border: '3px solid #2C5F7F'
                    }}>
                      <h3 style={{ marginTop: 0, color: '#2C5F7F' }}>Match en cours</h3>
                      <p><strong>🎯 Code:</strong> {currentMatch.gameId}</p>
                      <p><strong>👥 Joueurs:</strong> {currentMatch.playerCount}</p>
                      <p><strong>⏱️ Temps restant:</strong> {currentMatch.timeRemaining}</p>
                      <button
                        onClick={() => {
                          // Rejoin match logic
                          onClose();
                        }}
                        style={{
                          width: '100%',
                          marginTop: '15px',
                          padding: '12px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: '3px solid #2C5F7F',
                          borderRadius: '8px',
                          color: 'white',
                          fontFamily: 'Archivo Black',
                          cursor: 'pointer'
                        }}
                      >
                        🎮 REJOINDRE LA PARTIE
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#2C5F7F',
                      background: 'white',
                      borderRadius: '10px',
                      border: '3px solid #2C5F7F'
                    }}>
                      <p style={{ fontSize: '48px', margin: '0' }}>⏸️</p>
                      <p>Aucun match en cours</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

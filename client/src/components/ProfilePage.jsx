import { useState, useEffect } from 'react';

export default function ProfilePage({ user, onBack, onRejoinGame }) {
  const [matchHistory, setMatchHistory] = useState([]);
  const [currentGames, setCurrentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    blueGames: 0,
    redGames: 0,
    traitorGames: 0,
    favoriteRole: 'N/A'
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
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
        setCurrentGames(data.currentGames || []);
        
        // Calculer les statistiques détaillées
        const history = data.matchHistory || [];
        const wins = history.filter(m => m.won).length;
        const losses = history.length - wins;
        const blueGames = history.filter(m => m.team === 'bleu').length;
        const redGames = history.filter(m => m.team === 'rouge').length;
        const traitorGames = history.filter(m => m.isTraitor).length;
        
        // Rôle favori
        const roles = history.map(m => m.role).filter(Boolean);
        const roleCount = roles.reduce((acc, role) => {
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});
        const favoriteRole = Object.keys(roleCount).length > 0
          ? Object.keys(roleCount).reduce((a, b) => roleCount[a] > roleCount[b] ? a : b)
          : 'N/A';
        
        setStats({
          totalGames: history.length,
          wins,
          losses,
          winRate: history.length > 0 ? Math.round((wins / history.length) * 100) : 0,
          blueGames,
          redGames,
          traitorGames,
          favoriteRole
        });
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'representant': return '👑';
      case 'tueur': return '🔪';
      case 'lambda': return '👤';
      default: return '❓';
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'representant': return 'Représentant';
      case 'tueur': return 'Tueur';
      case 'lambda': return 'Lambda';
      default: return role || 'N/A';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '20px',
      background: '#4FA8A8',
      backgroundImage: `
        repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px),
        repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(0,0,0,.03) 35px, rgba(0,0,0,.03) 70px)
      `
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header avec bouton retour */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: '4px solid #2C5F7F',
              borderRadius: '10px',
              color: 'white',
              fontFamily: 'Archivo Black',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 4px 0 #1a3d5c, 0 6px 12px rgba(0,0,0,0.4)'
            }}
          >
            ← RETOUR
          </button>
          
          <div style={{
            fontSize: '48px',
            fontFamily: 'Archivo Black',
            color: '#2C5F7F',
            textShadow: '0 0 10px rgba(255,255,255,0.5), 0 4px 8px rgba(0,0,0,0.3)'
          }}>
            📊 MON PROFIL
          </div>
          
          <div style={{ width: '140px' }}></div>
        </div>

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            fontSize: '24px',
            color: '#2C5F7F',
            fontFamily: 'Archivo Black'
          }}>
            ⏳ Chargement...
          </div>
        ) : (
          <>
            {/* Carte d'identité */}
            <div style={{
              background: 'linear-gradient(135deg, #E8D5B7 0%, #d4c5a7 100%)',
              border: '8px solid #2C5F7F',
              borderRadius: '20px',
              boxShadow: '0 0 0 4px #E8D5B7, 0 15px 40px rgba(0,0,0,0.5)',
              padding: '40px',
              marginBottom: '30px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                <div style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: '6px solid #2C5F7F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '80px',
                  boxShadow: '0 0 0 4px #E8D5B7, 0 10px 30px rgba(0,0,0,0.4)'
                }}>
                  👤
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '42px',
                    fontFamily: 'Archivo Black',
                    color: '#2C5F7F',
                    marginBottom: '15px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {user?.username || 'Joueur'}
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '18px' }}>
                    <div><strong>📧 Email:</strong> {user?.email}</div>
                    <div><strong>✅ Vérifié:</strong> {user?.emailVerified ? '✅ Oui' : '❌ Non'}</div>
                    <div><strong>📅 Membre depuis:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</div>
                    <div><strong>🎯 Rôle favori:</strong> {getRoleIcon(stats.favoriteRole)} {getRoleName(stats.favoriteRole)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistiques détaillées */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {[
                { label: 'Parties jouées', value: stats.totalGames, icon: '🎮', color: '#667eea' },
                { label: 'Victoires', value: stats.wins, icon: '🏆', color: '#56ab2f' },
                { label: 'Défaites', value: stats.losses, icon: '💀', color: '#ff416c' },
                { label: 'Taux de victoire', value: `${stats.winRate}%`, icon: '📊', color: '#f093fb' },
                { label: 'Parties Bleues', value: stats.blueGames, icon: '🔵', color: '#2C5F7F' },
                { label: 'Parties Rouges', value: stats.redGames, icon: '🔴', color: '#E74C3C' },
                { label: 'Fois Traître', value: stats.traitorGames, icon: '🎭', color: '#8B00FF' }
              ].map((stat, idx) => (
                <div key={idx} style={{
                  background: 'white',
                  border: '4px solid #2C5F7F',
                  borderRadius: '15px',
                  padding: '25px',
                  textAlign: 'center',
                  boxShadow: '0 0 0 2px #E8D5B7, 0 8px 20px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ fontSize: '48px', marginBottom: '10px' }}>{stat.icon}</div>
                  <div style={{
                    fontSize: '36px',
                    fontFamily: 'Archivo Black',
                    color: stat.color,
                    marginBottom: '5px'
                  }}>
                    {stat.value}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Section Parties en cours */}
            <div style={{
              background: 'linear-gradient(135deg, #E8D5B7 0%, #d4c5a7 100%)',
              border: '8px solid #2C5F7F',
              borderRadius: '20px',
              boxShadow: '0 0 0 4px #E8D5B7, 0 15px 40px rgba(0,0,0,0.5)',
              padding: '30px',
              marginBottom: '30px'
            }}>
              <h2 style={{
                fontSize: '32px',
                fontFamily: 'Archivo Black',
                color: '#2C5F7F',
                marginBottom: '25px',
                textAlign: 'center'
              }}>
                🎮 PARTIES EN COURS
              </h2>

              {currentGames.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666',
                  fontSize: '18px'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏸️</div>
                  <div style={{ fontFamily: 'Archivo Black' }}>Aucune partie en cours</div>
                  <div style={{ fontSize: '14px', marginTop: '10px' }}>Créez ou rejoignez une partie !</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {currentGames.map((game, index) => (
                    <div key={index} style={{
                      background: 'linear-gradient(135deg, #fff9e6 0%, #ffe5b4 100%)',
                      border: '4px solid #ff9800',
                      borderRadius: '15px',
                      padding: '20px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(255,152,0,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    }}
                    >
                      <div style={{
                        fontSize: '36px',
                        textAlign: 'center',
                        marginBottom: '15px'
                      }}>
                        🎮
                      </div>
                      
                      <div style={{
                        fontSize: '28px',
                        fontFamily: 'Courier Prime',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: '#2C5F7F',
                        marginBottom: '15px',
                        background: 'rgba(255,255,255,0.7)',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '2px solid #2C5F7F',
                        letterSpacing: '4px'
                      }}>
                        {game.gameId}
                      </div>

                      <div style={{
                        fontSize: '13px',
                        color: '#666',
                        marginBottom: '12px',
                        textAlign: 'center'
                      }}>
                        📅 Rejoint le {new Date(game.joinedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>

                      <button
                        onClick={() => {
                          if (onRejoinGame) {
                            onRejoinGame(game.gameId);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
                          border: '3px solid #2C5F7F',
                          borderRadius: '8px',
                          color: 'white',
                          fontFamily: 'Archivo Black',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        ▶️ REJOINDRE
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historique détaillé */}
            <div style={{
              background: 'linear-gradient(135deg, #E8D5B7 0%, #d4c5a7 100%)',
              border: '8px solid #2C5F7F',
              borderRadius: '20px',
              boxShadow: '0 0 0 4px #E8D5B7, 0 15px 40px rgba(0,0,0,0.5)',
              padding: '30px'
            }}>
              <h2 style={{
                fontSize: '32px',
                fontFamily: 'Archivo Black',
                color: '#2C5F7F',
                marginBottom: '25px',
                textAlign: 'center'
              }}>
                📜 HISTORIQUE DES PARTIES
              </h2>

              {matchHistory.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px',
                  color: '#666',
                  fontSize: '18px'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎮</div>
                  <div style={{ fontFamily: 'Archivo Black' }}>Aucune partie jouée pour le moment</div>
                  <div style={{ fontSize: '14px', marginTop: '10px' }}>Lancez votre première partie !</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {matchHistory.map((match, index) => (
                    <div key={index} style={{
                      background: match.won 
                        ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                        : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                      border: `4px solid ${match.won ? '#4caf50' : '#f44336'}`,
                      borderRadius: '15px',
                      padding: '20px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(10px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <div style={{
                          fontSize: '28px',
                          fontFamily: 'Archivo Black',
                          color: match.won ? '#2e7d32' : '#c62828'
                        }}>
                          {match.won ? '🏆 VICTOIRE' : '💀 DÉFAITE'}
                        </div>
                        
                        <div style={{
                          fontSize: '24px',
                          fontFamily: 'Courier Prime',
                          fontWeight: 'bold',
                          color: '#2C5F7F',
                          background: 'rgba(255,255,255,0.7)',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          border: '2px solid #2C5F7F'
                        }}>
                          {match.gameId}
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px',
                        fontSize: '16px',
                        marginBottom: '12px'
                      }}>
                        <div style={{
                          background: 'rgba(255,255,255,0.6)',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '2px solid rgba(0,0,0,0.1)'
                        }}>
                          <strong>👥 Équipe:</strong> {match.team === 'bleu' ? '🔵 BLEU' : '🔴 ROUGE'}
                        </div>
                        
                        <div style={{
                          background: 'rgba(255,255,255,0.6)',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '2px solid rgba(0,0,0,0.1)'
                        }}>
                          <strong>🎭 Rôle:</strong> {getRoleIcon(match.role)} {getRoleName(match.role)}
                        </div>
                        
                        <div style={{
                          background: 'rgba(255,255,255,0.6)',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '2px solid rgba(0,0,0,0.1)'
                        }}>
                          <strong>👤 Joueurs:</strong> {match.playerCount || 'N/A'}
                        </div>
                        
                        <div style={{
                          background: 'rgba(255,255,255,0.6)',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '2px solid rgba(0,0,0,0.1)'
                        }}>
                          <strong>⏱️ Durée:</strong> {match.duration ? `${match.duration} min` : 'N/A'}
                        </div>
                      </div>

                      {match.isTraitor && (
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(139, 0, 255, 0.2) 0%, rgba(139, 0, 255, 0.3) 100%)',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '2px solid #8B00FF',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#8B00FF',
                          textAlign: 'center',
                          marginBottom: '10px'
                        }}>
                          🎭 VOUS ÉTIEZ TRAÎTRE
                        </div>
                      )}

                      <div style={{
                        fontSize: '14px',
                        color: '#666',
                        textAlign: 'right',
                        fontStyle: 'italic'
                      }}>
                        📅 {new Date(match.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

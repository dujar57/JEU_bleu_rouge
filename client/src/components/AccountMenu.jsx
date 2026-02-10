import { useState, useEffect } from 'react';
import secureFetch from '../utils/api';

export default function AccountMenu({ user, onClose, onLogout, onRejoinGame, csrfToken }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [matchHistory, setMatchHistory] = useState([]);
  const [currentGames, setCurrentGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    if (user) {
      fetchUserData();
      setFormData({
        username: user.username || '',
        email: user.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await secureFetch('/api/auth/profile', {
        method: 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMatchHistory(data.matchHistory || []);
        setCurrentGames(data.currentGames || []);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateMessage('');
    setUpdateError('');

    // Validation
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setUpdateError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.newPassword && !formData.currentPassword) {
      setUpdateError('Le mot de passe actuel est requis pour changer de mot de passe');
      return;
    }

    try {
      const updateData = {};
      
      if (formData.username !== user.username) updateData.username = formData.username;
      if (formData.email !== user.email) updateData.email = formData.email;
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        setUpdateError('Aucune modification détectée');
        return;
      }

      const response = await secureFetch('/api/auth/update-profile', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      }, csrfToken);

      const data = await response.json();

      if (response.ok) {
        setUpdateMessage('✅ Profil mis à jour avec succès !');
        if (data.emailChanged) {
          setUpdateMessage(data.emailChanged);
        }
        
        // Mettre à jour le localStorage
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Réinitialiser le formulaire
        setFormData({
          username: data.user.username,
          email: data.user.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        setEditMode(false);
        
        // Recharger après 2 secondes pour afficher le nouveau profil
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setUpdateError(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      setUpdateError('Erreur de connexion au serveur');
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
                  {updateMessage && (
                    <div style={{
                      background: 'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
                      padding: '15px',
                      borderRadius: '10px',
                      marginBottom: '15px',
                      color: 'white',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      {updateMessage}
                    </div>
                  )}
                  
                  {updateError && (
                    <div style={{
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                      padding: '15px',
                      borderRadius: '10px',
                      marginBottom: '15px',
                      color: 'white',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      {updateError}
                    </div>
                  )}

                  <div style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '3px solid #2C5F7F',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ margin: 0, color: '#2C5F7F' }}>Informations</h3>
                      <button
                        onClick={() => {
                          setEditMode(!editMode);
                          setUpdateMessage('');
                          setUpdateError('');
                        }}
                        style={{
                          padding: '8px 16px',
                          background: editMode ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: '2px solid #2C5F7F',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}
                      >
                        {editMode ? '✖ Annuler' : '✏️ Modifier'}
                      </button>
                    </div>

                    {!editMode ? (
                      <>
                        <p><strong>👤 Pseudo:</strong> {user?.username || 'N/A'}</p>
                        <p><strong>📧 Email:</strong> {user?.email || 'N/A'}</p>
                        <p><strong>✅ Email vérifié:</strong> {user?.emailVerified ? '✅ Oui' : '❌ Non'}</p>
                        <p><strong>🎮 Parties jouées:</strong> {user?.gamesPlayed || 0}</p>
                        <p><strong>🏆 Victoires:</strong> {user?.gamesWon || 0}</p>
                        <p><strong>📊 Taux de victoire:</strong> {
                          user?.gamesPlayed > 0 
                            ? `${Math.round((user?.gamesWon / user?.gamesPlayed) * 100)}%`
                            : '0%'
                        }</p>
                        <p><strong>📅 Membre depuis:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</p>
                      </>
                    ) : (
                      <form onSubmit={handleUpdateProfile}>
                        <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2C5F7F' }}>
                            👤 Pseudo
                          </label>
                          <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '2px solid #2C5F7F',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2C5F7F' }}>
                            📧 Email
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '2px solid #2C5F7F',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                          <small style={{ color: '#666', fontSize: '11px' }}>
                            ⚠️ Changer l'email nécessite une nouvelle vérification
                          </small>
                        </div>

                        <hr style={{ margin: '20px 0', border: '1px solid #ddd' }} />

                        <div style={{ marginBottom: '10px' }}>
                          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2C5F7F' }}>
                            🔒 Changer le mot de passe (optionnel)
                          </label>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                          <input
                            type="password"
                            placeholder="Mot de passe actuel"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '2px solid #2C5F7F',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                          <input
                            type="password"
                            placeholder="Nouveau mot de passe"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '2px solid #2C5F7F',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                          <input
                            type="password"
                            placeholder="Confirmer nouveau mot de passe"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '10px',
                              border: '2px solid #2C5F7F',
                              borderRadius: '6px',
                              fontSize: '14px'
                            }}
                          />
                        </div>

                        <button
                          type="submit"
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
                            fontWeight: 'bold'
                          }}
                        >
                          💾 SAUVEGARDER
                        </button>
                      </form>
                    )}
                  </div>

                  <div style={{
                    background: 'white',
                    padding: '15px',
                    borderRadius: '10px',
                    border: '3px solid #2C5F7F',
                    marginBottom: '15px'
                  }}>
                    <h3 style={{ marginTop: 0, color: '#2C5F7F', fontSize: '16px' }}>⚙️ Préférences</h3>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}>
                      <input
                        type="checkbox"
                        checked={reminderEnabled}
                        onChange={(e) => setReminderEnabled(e.target.checked)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span>🔔 Recevoir des rappels de vote</span>
                    </label>
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
                      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Aucune partie jouée pour le moment</p>
                      <p style={{ fontSize: '14px', color: '#999' }}>Votre historique apparaîtra ici</p>
                    </div>
                  ) : (
                    matchHistory.map((match, index) => (
                      <div key={index} style={{
                        background: match.won 
                          ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)'
                          : 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                        padding: '15px',
                        borderRadius: '10px',
                        border: `3px solid ${match.won ? '#4caf50' : '#f44336'}`,
                        marginBottom: '10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ 
                            fontSize: '20px', 
                            fontWeight: 'bold', 
                            color: match.won ? '#2e7d32' : '#c62828' 
                          }}>
                            {match.won ? '🏆 VICTOIRE' : '💀 DÉFAITE'}
                          </div>
                          <div style={{ 
                            fontSize: '18px', 
                            fontFamily: 'Courier Prime', 
                            fontWeight: 'bold',
                            color: '#666'
                          }}>
                            {match.gameId}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
                          <p style={{ margin: '4px 0' }}><strong>👥 Équipe:</strong> {match.team === 'bleu' ? '🔵 BLEU' : '🔴 ROUGE'}</p>
                          <p style={{ margin: '4px 0' }}><strong>🎭 Rôle:</strong> {match.role || 'N/A'}</p>
                          <p style={{ margin: '4px 0' }}><strong>👤 Joueurs:</strong> {match.playerCount || 'N/A'}</p>
                          <p style={{ margin: '4px 0' }}><strong>⏱️ Durée:</strong> {match.duration ? `${match.duration} min` : 'N/A'}</p>
                        </div>
                        {match.isTraitor && (
                          <div style={{ 
                            marginTop: '8px', 
                            padding: '6px', 
                            background: 'rgba(139, 0, 255, 0.1)', 
                            borderRadius: '5px',
                            fontSize: '12px',
                            color: '#8B00FF',
                            fontWeight: 'bold'
                          }}>
                            🎭 TRAÎTRE
                          </div>
                        )}
                        <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666', textAlign: 'right' }}>
                          📅 {new Date(match.date).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'current' && (
                <div>
                  {currentGames.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px',
                      color: '#2C5F7F',
                      background: 'white',
                      borderRadius: '10px',
                      border: '3px solid #2C5F7F'
                    }}>
                      <p style={{ fontSize: '48px', margin: '0' }}>⏸️</p>
                      <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>Aucune partie en cours</p>
                      <p style={{ fontSize: '14px', color: '#999' }}>Créez ou rejoignez une partie pour commencer à jouer !</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {currentGames.map((game, index) => (
                        <div key={index} style={{
                          background: 'linear-gradient(135deg, #fff9e6 0%, #ffe5b4 100%)',
                          padding: '15px',
                          borderRadius: '10px',
                          border: '3px solid #ff9800',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                          }}>
                            <div style={{
                              fontSize: '24px',
                              fontFamily: 'Courier Prime',
                              fontWeight: 'bold',
                              color: '#2C5F7F',
                              background: 'rgba(255,255,255,0.7)',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '2px solid #2C5F7F',
                              letterSpacing: '3px'
                            }}>
                              {game.gameId}
                            </div>
                            <div style={{ fontSize: '28px' }}>🎮</div>
                          </div>
                          
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
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
                                onClose();
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
                            ▶️ REJOINDRE LA PARTIE
                          </button>
                        </div>
                      ))}
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

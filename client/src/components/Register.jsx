import { useState } from 'react';
import secureFetch from '../utils/api';

export default function Register({ onBack, onRegisterSuccess, csrfToken }) {
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ===== VÉRIFICATION EMAIL DÉSACTIVÉE =====
  // Les lignes ci-dessous sont conservées pour réactivation future
  // const [showVerificationCode, setShowVerificationCode] = useState(false);
  // const [verificationCode, setVerificationCode] = useState('');
  // const [registeredEmail, setRegisteredEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('❌ Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('❌ Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);

    try {
      const response = await secureFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: pseudo, email, password })
      }, csrfToken);

      const data = await response.json();

      if (response.ok) {
        // ⚠️ MODIFIÉ: Email auto-vérifié, connexion directe
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert('✅ Compte créé avec succès !\n\nVous êtes maintenant connecté.');
        if (onRegisterSuccess) onRegisterSuccess(data.user);
        onBack();
        
        // ❌ ANCIEN SYSTÈME (pour réactivation future):
        // setRegisteredEmail(email);
        // setShowVerificationCode(true);
        // setError('');
      } else {
        setError(data.error || data.message || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      console.error('Erreur inscription:', err);
      setError('Erreur réseau - Veuillez réessayer');
    } finally {
      setLoading(false);
    }
  };
  
  /* ===== CODE DE VÉRIFICATION DÉSACTIVÉ (pour réactivation future) =====
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await secureFetch('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token: verificationCode })
      }, csrfToken);

      const data = await response.json();

      if (response.ok) {
        alert('✅ Email vérifié avec succès !\n\nVous pouvez maintenant vous connecter.');
        if (onRegisterSuccess) onRegisterSuccess(data);
        onBack();
      } else {
        setError(data.error || data.message || 'Code invalide ou expiré');
      }
    } catch (err) {
      console.error('Erreur vérification:', err);
      setError('Erreur réseau - Veuillez réessayer');
    } finally {
      setLoading(false);
    }
  };

  // Interface de vérification du code
  if (showVerificationCode) {
    return (
      <div className="container">
        <div className="logo-circle">
          <img src="/logo-bvr.png" alt="Logo Bleu vs Rouge" className="logo-img" />
        </div>
        
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>📧 VÉRIFICATION EMAIL</h2>

        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '15px',
          marginBottom: '25px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '18px' }}>
            📨 Un code de vérification a été envoyé à :
          </p>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
            {registeredEmail}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '15px',
            background: '#ff6b6b',
            color: 'white',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyCode}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', textAlign: 'center' }}>
              🔢 Entrez le code à 6 chiffres
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              pattern="\d{6}"
              placeholder="123456"
              style={{
                width: '100%',
                padding: '20px',
                borderRadius: '12px',
                border: '3px solid #667eea',
                fontSize: '32px',
                textAlign: 'center',
                fontFamily: 'monospace',
                letterSpacing: '10px',
                fontWeight: 'bold'
              }}
            />
            <p style={{ 
              textAlign: 'center', 
              fontSize: '14px', 
              color: '#666', 
              marginTop: '10px' 
            }}>
              ⏱️ Le code expire dans 15 minutes
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || verificationCode.length !== 6}
            className="btn-primary"
            style={{ width: '100%', marginBottom: '15px' }}
          >
            {loading ? '⏳ Vérification...' : '✅ VÉRIFIER'}
          </button>

          <button
            type="button"
            onClick={() => setShowVerificationCode(false)}
            className="btn-secondary"
            style={{ width: '100%' }}
          >
            ← RETOUR
          </button>
        </form>
      </div>
    );
  }
  */

  // Interface d'inscription (formulaire initial)
  return (
    <div className="container">
      <div className="logo-circle">
        <img src="/logo-bvr.png" alt="Logo Bleu vs Rouge" className="logo-img" />
      </div>
      
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>📝 INSCRIPTION</h2>

      {error && (
        <div style={{
          padding: '15px',
          background: '#ff6b6b',
          color: 'white',
          borderRadius: '10px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            👤 Pseudo
          </label>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '3px solid #2C5F7F',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            📧 Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '3px solid #2C5F7F',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            🔒 Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '3px solid #2C5F7F',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            🔒 Confirmer le mot de passe
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '3px solid #2C5F7F',
              fontSize: '16px'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ width: '100%', marginBottom: '15px' }}
        >
          {loading ? '⏳ Inscription...' : '🚀 S\'INSCRIRE'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
          style={{ width: '100%' }}
        >
          ← RETOUR
        </button>
      </form>
    </div>
  );
}

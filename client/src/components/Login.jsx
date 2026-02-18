import { useState } from 'react';
import secureFetch from '../utils/api';

export default function Login({ onBack, onLoginSuccess, csrfToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ===== VÉRIFICATION EMAIL DÉSACTIVÉE =====
  // const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await secureFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }, csrfToken);

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        alert('✅ Connexion réussie !');
        if (onLoginSuccess) onLoginSuccess(data.user);
        onBack();
      } else {
        // ⚠️ MODIFIÉ: Plus de vérification email
        setError(data.message || data.error || 'Erreur de connexion');
        
        // ❌ ANCIEN SYSTÈME (pour réactivation future):
        // if (data.emailVerificationRequired) {
        //   setEmailVerificationRequired(true);
        //   setError('📧 Votre email n\'est pas encore vérifié.\n\nVeuillez consulter votre boîte mail (' + (data.email || email) + ') et cliquer sur le lien de confirmation.');
        // } else {
        //   setError(data.message || data.error || 'Erreur de connexion');
        // }
      }
    } catch (err) {
      setError('Erreur réseau - Veuillez réessayer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="logo-circle">
        <img src="/logo-bvr.png" alt="Logo Bleu vs Rouge" className="logo-img" />
      </div>
      
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>🔐 CONNEXION</h2>

      {error && (
        <div style={{
          padding: '15px',
          background: '#ff6b6b',
          color: 'white',
          borderRadius: '10px',
          marginBottom: '20px',
          textAlign: 'center',
          whiteSpace: 'pre-line'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
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

        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            🔒 Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {loading ? '⏳ Connexion...' : '🚀 SE CONNECTER'}
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

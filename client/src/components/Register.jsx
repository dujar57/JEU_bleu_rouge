import { useState } from 'react';
import secureFetch from '../utils/api';

export default function Register({ onBack, onRegisterSuccess, csrfToken }) {
  const [pseudo, setPseudo] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        alert('✅ Inscription réussie !\n\n📧 Un email de confirmation a été envoyé à ' + email + '\n\nVeuillez vérifier votre boîte de réception et cliquer sur le lien de validation avant de vous connecter.');
        if (onRegisterSuccess) onRegisterSuccess(data);
        onBack();
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

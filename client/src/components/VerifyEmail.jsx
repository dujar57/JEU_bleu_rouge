import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import '../index.css';

function VerifyEmail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (code.length !== 6) {
      setError(t('verifyEmail.codeLength'));
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/auth/verify-code', { code });
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || t('verifyEmail.errorVerifying'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">
          {success ? '✅ ' : '📧 '}
          {t('verifyEmail.title')}
        </h2>
        
        {success ? (
          <div className="success-message">
            <p>✅ {t('verifyEmail.success')}</p>
            <p>{t('verifyEmail.redirecting')}</p>
          </div>
        ) : (
          <>
            <p className="auth-subtitle">
              {t('verifyEmail.instructions')}
            </p>
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">{t('verifyEmail.codeLabel')}</label>
                <input
                  type="text"
                  className="form-input code-input"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  maxLength="6"
                  autoFocus
                  disabled={loading}
                  style={{
                    fontSize: '24px',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button 
                type="submit" 
                className="auth-button"
                disabled={loading || code.length !== 6}
              >
                {loading ? t('verifyEmail.verifying') : t('verifyEmail.verify')}
              </button>
            </form>
            
            <div className="auth-footer">
              <p>{t('verifyEmail.noCode')}</p>
              <button 
                className="link-button"
                onClick={() => navigate('/')}
              >
                {t('verifyEmail.backToHome')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;

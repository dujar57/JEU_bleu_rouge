const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Effectue une requête fetch avec headers CSRF et JWT
 * @param {string} endpoint - L'endpoint (ex: '/api/auth/login')
 * @param {object} options - Options fetch (method, body, etc.)
 * @param {string} csrfToken - Token CSRF récupéré au démarrage
 * @returns {Promise<Response>}
 */
export async function secureFetch(endpoint, options = {}, csrfToken = null) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Ajouter le token JWT si présent
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Ajouter le token CSRF pour POST/PUT/DELETE
  if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method?.toUpperCase())) {
    headers['x-csrf-token'] = csrfToken;
  }

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include' // Important pour les cookies CSRF
  });
}

export default secureFetch;

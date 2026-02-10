# 🔐 Guide d'implémentation CSRF côté client (React)

## 📌 Pourquoi ce guide ?

Avec la protection CSRF activée sur le serveur, **tous les POST/PUT/DELETE vers `/api/auth` et `/api/game` doivent inclure un token CSRF**, sinon ils seront rejetés avec une erreur 403.

---

## 🚀 Implémentation côté client

### 1. **Récupérer le token CSRF au démarrage**

Dans [client/src/App.jsx](client/src/App.jsx), ajouter :

```javascript
import { useState, useEffect } from 'react';

function App() {
  const [csrfToken, setCsrfToken] = useState(null);

  // Récupérer le token CSRF au chargement
  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        const response = await fetch(`${API_URL}/api/csrf-token`, {
          credentials: 'include' // Important : inclure les cookies
        });
        const data = await response.json();
        setCsrfToken(data.csrfToken);
        console.log('🔐 Token CSRF récupéré');
      } catch (error) {
        console.error('❌ Erreur récupération token CSRF:', error);
      }
    }
    
    fetchCsrfToken();
  }, []);

  // ... reste du code
}
```

### 2. **Créer un helper pour les requêtes authentifiées**

Créer [client/src/utils/api.js](client/src/utils/api.js) :

```javascript
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
  if (csrfToken && ['POST', 'PUT', 'DELETE'].includes(options.method?.toUpperCase())) {
    headers['x-csrf-token'] = csrfToken;
  }

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include' // Important pour les cookies CSRF
  });
}

export default secureFetch;
```

### 3. **Utiliser le helper dans les composants**

#### Exemple : [client/src/components/Login.jsx](client/src/components/Login.jsx)

**Avant** :
```javascript
const response = await fetch(`${API_URL}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

**Après** :
```javascript
import secureFetch from '../utils/api';

function Login({ csrfToken }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await secureFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }, csrfToken);
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.token);
        // ...
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };
  
  // ...
}
```

#### Exemple : [client/src/components/Register.jsx](client/src/components/Register.jsx)

```javascript
import secureFetch from '../utils/api';

function Register({ csrfToken }) {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const response = await secureFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    }, csrfToken);
    
    // ...
  };
}
```

### 4. **Passer le token CSRF aux composants enfants**

Dans [client/src/App.jsx](client/src/App.jsx) :

```javascript
function App() {
  const [csrfToken, setCsrfToken] = useState(null);
  
  // ... récupération du token CSRF (voir étape 1)
  
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login csrfToken={csrfToken} />} />
        <Route path="/register" element={<Register csrfToken={csrfToken} />} />
        <Route path="/game/:code" element={<Game csrfToken={csrfToken} />} />
        {/* ... */}
      </Routes>
    </Router>
  );
}
```

---

## 🔍 Vérification

### Test 1 : Sans token CSRF (devrait échouer)
```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: '123456' })
});

// Résultat attendu : 403 Forbidden - "invalid csrf token"
```

### Test 2 : Avec token CSRF (devrait réussir)
```javascript
// 1. Récupérer le token
const csrfRes = await fetch('http://localhost:3000/api/csrf-token', {
  credentials: 'include'
});
const { csrfToken } = await csrfRes.json();

// 2. Faire la requête avec le token
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken
  },
  credentials: 'include',
  body: JSON.stringify({ email: 'test@test.com', password: '123456' })
});

// Résultat attendu : 200 OK avec token JWT
```

---

## 🛡️ Comportement de la protection CSRF

### Routes protégées
- ✅ `POST /api/auth/register` - Inscription
- ✅ `POST /api/auth/login` - Connexion
- ✅ `POST /api/auth/logout` - Déconnexion
- ✅ `PUT /api/auth/update-profile` - Mise à jour profil
- ✅ `POST /api/game/*` - Toutes les routes de jeu

### Routes non protégées (GET/HEAD/OPTIONS)
- ✅ `GET /api/auth/profile` - Récupérer profil
- ✅ `GET /api/csrf-token` - Récupérer token CSRF
- ✅ `GET /api/auth/verify-email` - Vérifier email

### Méthodes HTTP concernées
- ✅ `POST` - Nécessite token CSRF
- ✅ `PUT` - Nécessite token CSRF
- ✅ `PATCH` - Nécessite token CSRF
- ✅ `DELETE` - Nécessite token CSRF
- ❌ `GET` - Pas besoin de token
- ❌ `HEAD` - Pas besoin de token
- ❌ `OPTIONS` - Pas besoin de token

---

## ⚠️ Erreurs courantes

### Erreur 1 : "invalid csrf token"
**Cause** : Token CSRF manquant ou invalide

**Solution** :
```javascript
// Vérifier que le token est présent
console.log('Token CSRF:', csrfToken);

// Vérifier le header
headers['x-csrf-token'] = csrfToken;
```

### Erreur 2 : "CSRF cookie not found"
**Cause** : Cookies non inclus dans la requête

**Solution** :
```javascript
fetch(url, {
  credentials: 'include', // ✅ IMPORTANT
  // ...
});
```

### Erreur 3 : Token expiré
**Cause** : Le cookie CSRF a expiré (session terminée)

**Solution** : Récupérer un nouveau token
```javascript
async function refreshCsrfToken() {
  const response = await fetch('/api/csrf-token', {
    credentials: 'include'
  });
  const { csrfToken } = await response.json();
  setCsrfToken(csrfToken);
}
```

---

## 📊 Récapitulatif des modifications côté client

### Fichiers à créer
- ✅ `client/src/utils/api.js` - Helper pour requêtes sécurisées

### Fichiers à modifier
- ✅ `client/src/App.jsx` - Récupération token CSRF + passage aux enfants
- ✅ `client/src/components/Login.jsx` - Utiliser `secureFetch`
- ✅ `client/src/components/Register.jsx` - Utiliser `secureFetch`
- ✅ `client/src/components/Game.jsx` - Utiliser `secureFetch` (si routes `/api/game/`)
- ✅ `client/src/components/AccountMenu.jsx` - Utiliser `secureFetch` pour logout/update

### Pattern général
```javascript
// 1. Récupérer CSRF au démarrage (App.jsx)
useEffect(() => {
  fetch('/api/csrf-token', { credentials: 'include' })
    .then(r => r.json())
    .then(data => setCsrfToken(data.csrfToken));
}, []);

// 2. Passer le token aux composants
<Component csrfToken={csrfToken} />

// 3. Utiliser secureFetch dans les composants
import secureFetch from '../utils/api';

secureFetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify(data)
}, csrfToken);
```

---

## 🎯 Checklist d'implémentation

- [ ] Créer `client/src/utils/api.js`
- [ ] Modifier `App.jsx` pour récupérer le token CSRF
- [ ] Modifier `Login.jsx` pour utiliser `secureFetch`
- [ ] Modifier `Register.jsx` pour utiliser `secureFetch`
- [ ] Modifier `AccountMenu.jsx` pour logout/update profile
- [ ] Tester en local : inscription, connexion, logout
- [ ] Vérifier la console : logs "🔐 Token CSRF récupéré"
- [ ] Tester sans token → devrait rejeter avec 403
- [ ] Déployer sur Render
- [ ] Tester en production

---

## 🔗 Ressources

- **Package CSRF** : [csrf-csrf npm](https://www.npmjs.com/package/csrf-csrf)
- **Documentation OWASP** : [CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- **MDN Fetch API** : [Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)

---

**Date** : 10 février 2026  
**Status** : ⚠️ Client DOIT être mis à jour pour fonctionner avec CSRF

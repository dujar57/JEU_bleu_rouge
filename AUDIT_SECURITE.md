# 🛡️ AUDIT DE SÉCURITÉ - JEU BLEU ROUGE

## Date : $(Get-Date -Format "dd/MM/yyyy")

---

## 🔴 **VULNÉRABILITÉS CRITIQUES** (À corriger immédiatement)

### 1. **Authentification Socket.io manquante** ⚠️ PRIORITÉ MAXIMALE

**📍 Localisation** : `server.js` ligne 810  
**Risque** : N'importe qui peut se connecter aux WebSockets et manipuler les parties  
**Impact** : Triche, manipulation de données, crash serveur

**Problème actuel :**
```javascript
io.on('connection', (socket) => {
  // ❌ Aucune vérification d'identité !
  socket.on('create_game', async (data) => { ... })
})
```

**✅ Solution recommandée :**

```javascript
const jwt = require('jsonwebtoken');

// Middleware d'authentification Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    // Autoriser les connexions anonymes MAIS limiter les actions
    socket.isAuthenticated = false;
    // Enregistrer l'IP pour rate limiting
    socket.ipAddress = socket.handshake.address;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.isAuthenticated = true;
    next();
  } catch (error) {
    return next(new Error('Token invalide'));
  }
});

// Dans chaque événement sensible
socket.on('create_game', async (data) => {
  // Vérifier l'authentification pour actions critiques
  if (!socket.isAuthenticated) {
    return socket.emit('error', { 
      message: 'Authentification requise pour créer une partie' 
    });
  }
  
  // Rate limiting par IP pour utilisateurs non authentifiés
  const rateCheck = checkRateLimit(socket.ipAddress, 'create_game', 2, 60000);
  if (!rateCheck.allowed) {
    return socket.emit('error', { message: rateCheck.error });
  }
  
  // ... reste du code
});
```

---

### 2. **JWT_SECRET exposé dans .env** ⚠️ CRITIQUE

**📍 Localisation** : `.env` ligne 9  
**Risque** : Si ce fichier est sur GitHub public, tous les tokens sont compromis  
**Impact** : Accès non autorisé à tous les comptes

**Actions immédiates :**

1. **Vérifier .gitignore :**
```bash
# Vérifier si .env est bien ignoré
git check-ignore .env
# Si rien ne s'affiche, AJOUTER dans .gitignore :
echo ".env" >> .gitignore
git rm --cached .env  # Retirer du git si déjà committé
```

2. **Générer NOUVELLE clé sur Render :**
```bash
# Aller sur Render Dashboard > Environment Variables
# Supprimer l'ancienne JWT_SECRET
# Générer une nouvelle :
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

3. **Invalider tous les tokens existants :**
```javascript
// Option 1 : Changer JWT_SECRET invalide automatiquement tous les tokens
// Option 2 : Ajouter un timestamp de révocation globale
const TOKEN_VALID_AFTER = '2024-01-15T10:00:00Z'; // Date de changement

// Dans le middleware auth
const decoded = jwt.verify(token, jwtSecret);
const tokenIssuedAt = new Date(decoded.iat * 1000);
if (tokenIssuedAt < new Date(TOKEN_VALID_AFTER)) {
  return res.status(401).json({ error: 'Token expiré, reconnectez-vous' });
}
```

---

### 3. **Pas de protection CSRF** ⚠️ MOYEN-ÉLEVÉ

**📍 Localisation** : Tous les endpoints POST/PUT  
**Risque** : Attaques Cross-Site Request Forgery  
**Impact** : Actions non autorisées au nom de l'utilisateur

**✅ Solution avec csurf :**

```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

// ATTENTION : csurf doit être APRÈS cookieParser
app.use(cookieParser());

// Exclure les routes API REST (protégées par JWT)
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Appliquer CSRF uniquement sur les routes sensibles
app.post('/api/auth/login', csrfProtection, authLimiter, ...);
app.post('/api/auth/register', csrfProtection, authLimiter, ...);

// Générer un token CSRF pour le client
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Côté client (App.jsx)
const [csrfToken, setCsrfToken] = useState('');

useEffect(() => {
  fetch('/api/csrf-token')
    .then(r => r.json())
    .then(data => setCsrfToken(data.csrfToken));
}, []);

// Dans les requêtes fetch
fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'CSRF-Token': csrfToken  // ✅ Ajouter le token
  },
  body: JSON.stringify({ email, password })
})
```

---

## 🟠 **VULNÉRABILITÉS MOYENNES**

### 4. **Fuites d'informations dans les erreurs 500**

**📍 Localisation** : `routes/auth.js`, `routes/game.js`  
**Risque** : Exposition de stack traces, détails DB  
**Impact** : Aide les attaquants à comprendre l'architecture

**Problème actuel :**
```javascript
// ❌ MAUVAIS
catch (error) {
  res.status(500).json({ error: 'Erreur: ' + error.message });
}
```

**✅ Solution :**

```javascript
// ✅ BON - Gestion d'erreur sécurisée
catch (error) {
  console.error('❌ Erreur login:', error); // Log côté serveur SEULEMENT
  
  // Message générique pour le client
  res.status(500).json({ 
    error: 'Une erreur est survenue. Veuillez réessayer.' 
  });
  
  // En développement, on peut être plus verbeux
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}
```

### 5. **Token Blacklist en mémoire**

**📍 Localisation** : `server.js` ligne 108, `routes/auth.js` ligne 19  
**Risque** : Tokens blacklistés perdus au redémarrage  
**Impact** : Tokens révoqués redeviennent valides

**✅ Solution avec Redis (recommandé en production) :**

```bash
npm install redis
```

```javascript
const redis = require('redis');
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect().catch(console.error);

// Ajouter un token à la blacklist
async function blacklistToken(token, expiresInSeconds) {
  await redisClient.setEx(`blacklist:${token}`, expiresInSeconds, '1');
}

// Vérifier si un token est blacklisté
async function isTokenBlacklisted(token) {
  const result = await redisClient.get(`blacklist:${token}`);
  return result !== null;
}

// Dans le middleware auth
const isBlacklisted = await isTokenBlacklisted(token);
if (isBlacklisted) {
  return res.status(401).json({ error: 'Token révoqué' });
}
```

**Alternative sans Redis (moins robuste) :**
```javascript
// Sauvegarder la blacklist dans MongoDB
const TokenBlacklist = mongoose.model('TokenBlacklist', {
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
});

// Ajouter à la blacklist
await TokenBlacklist.create({ 
  token, 
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
});
```

### 6. **CORS trop permissif en développement**

**📍 Localisation** : `server.js` ligne 92  
**Risque** : Accepte les requêtes sans origine (curl, Postman)  
**Impact** : Contournement des protections CORS

**Problème :**
```javascript
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) { // ❌ !origin autorise tout
      callback(null, true);
    }
  }
}));
```

**✅ Solution :**
```javascript
app.use(cors({
  origin: (origin, callback) => {
    // En production, TOUJOURS exiger une origine
    if (process.env.NODE_ENV === 'production' && !origin) {
      return callback(new Error('Origine requise'));
    }
    
    // En développement, autoriser localhost
    const devOrigins = ['http://localhost:5173', 'http://localhost:3000'];
    const allOrigins = process.env.NODE_ENV === 'production' 
      ? allowedOrigins 
      : [...allowedOrigins, ...devOrigins];
    
    if (!origin || allOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true
}));
```

---

## 🟡 **AMÉLIORATIONS RECOMMANDÉES**

### 7. **Validation des variables d'environnement au démarrage**

**✅ Solution :**

```javascript
// Créer utils/validateEnv.js
function validateEnv() {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET',
    'APP_URL'
  ];
  
  const optional = {
    'EMAIL_USER': 'Les emails ne seront pas envoyés',
    'EMAIL_PASSWORD': 'Les emails ne seront pas envoyés',
    'REDIS_URL': 'Token blacklist sera en mémoire (non persistant)'
  };
  
  console.log('🔍 Vérification des variables d\'environnement...\n');
  
  // Variables obligatoires
  let hasError = false;
  required.forEach(key => {
    if (!process.env[key]) {
      console.error(`❌ ERREUR : ${key} est requis !`);
      hasError = true;
    } else {
      console.log(`✅ ${key} configuré`);
    }
  });
  
  // Variables optionnelles
  Object.entries(optional).forEach(([key, warning]) => {
    if (!process.env[key]) {
      console.warn(`⚠️  ${key} non configuré : ${warning}`);
    } else {
      console.log(`✅ ${key} configuré`);
    }
  });
  
  // Vérifications de sécurité
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET trop court ! Minimum 32 caractères recommandé');
    hasError = true;
  }
  
  if (process.env.JWT_SECRET === 'votre_secret_jwt_super_securise_changez_moi') {
    console.error('❌ JWT_SECRET utilise la valeur par défaut ! CHANGEZ-LA !');
    hasError = true;
  }
  
  console.log('');
  
  if (hasError) {
    console.error('💥 Démarrage impossible : erreurs de configuration\n');
    process.exit(1);
  }
}

module.exports = { validateEnv };

// Dans server.js (AVANT tout le reste)
require('dotenv').config();
const { validateEnv } = require('./utils/validateEnv');
validateEnv();
```

### 8. **Rate limiting sur les événements Socket.io**

**Problème** : Un utilisateur peut spammer les événements  
**✅ Solution déjà en place mais à améliorer :**

```javascript
// Créer utils/socketRateLimit.js
const socketRateLimits = new Map();

function checkSocketRateLimit(socketId, eventName, max, windowMs) {
  const key = `${socketId}:${eventName}`;
  const now = Date.now();
  
  if (!socketRateLimits.has(key)) {
    socketRateLimits.set(key, []);
  }
  
  const requests = socketRateLimits.get(key);
  
  // Nettoyer les anciennes requêtes
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= max) {
    return {
      allowed: false,
      error: `Trop de requêtes pour ${eventName}. Attendez un peu.`
    };
  }
  
  recentRequests.push(now);
  socketRateLimits.set(key, recentRequests);
  
  return { allowed: true };
}

// Nettoyer périodiquement la map
setInterval(() => {
  const now = Date.now();
  for (const [key, requests] of socketRateLimits.entries()) {
    const recentRequests = requests.filter(time => now - time < 3600000); // 1h
    if (recentRequests.length === 0) {
      socketRateLimits.delete(key);
    } else {
      socketRateLimits.set(key, recentRequests);
    }
  }
}, 300000); // Toutes les 5 min

module.exports = { checkSocketRateLimit };
```

### 9. **Timeout sur les opérations MongoDB**

**✅ Solution :**

```javascript
// Dans la connexion MongoDB
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000, // 5 secondes timeout connexion
  socketTimeoutMS: 45000, // 45 secondes timeout requête
})
.then(() => {
  console.log('✅ Connecté à MongoDB');
})
.catch(err => {
  console.error('❌ Erreur MongoDB:', err.message);
  process.exit(1);
});

// Pour les requêtes individuelles avec timeout
const user = await User.findOne({ email })
  .maxTimeMS(5000) // Max 5 secondes
  .exec();
```

### 10. **Sanitisation HTML/XSS sur les inputs Socket.io**

**✅ Solution :**

```bash
npm install dompurify jsdom
```

```javascript
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Dans socketValidation.js
const sanitizeHTML = (str) => {
  if (typeof str !== 'string') return '';
  
  // Nettoyer les balises HTML/JavaScript
  return DOMPurify.sanitize(str, {
    ALLOWED_TAGS: [], // Aucune balise HTML autorisée
    ALLOWED_ATTR: []
  }).trim();
};

// Modifier sanitizeString
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  return sanitizeHTML(str)
    .substring(0, 200); // Limite la longueur
};
```

---

## 📊 **RÉSUMÉ DES PRIORITÉS**

| Priorité | Vulnérabilité | Impact | Effort | Deadline |
|----------|---------------|--------|--------|----------|
| 🔴 **CRITIQUE** | Authentification Socket.io | Très élevé | Moyen | **Immédiat** |
| 🔴 **CRITIQUE** | JWT_SECRET exposé | Très élevé | Faible | **Immédiat** |
| 🟠 **ÉLEVÉ** | Protection CSRF | Élevé | Moyen | 1 semaine |
| 🟠 **MOYEN** | Fuites d'erreurs | Moyen | Faible | 1 semaine |
| 🟠 **MOYEN** | Token Blacklist Redis | Moyen | Élevé | 2 semaines |
| 🟡 **FAIBLE** | Validation env | Faible | Faible | 1 mois |
| 🟡 **FAIBLE** | CORS restrictif | Faible | Faible | 1 mois |

---

## ✅ **CE QUI EST DÉJÀ BIEN FAIT**

1. ✅ **Helmet.js** configuré avec CSP, HSTS, frameguard
2. ✅ **Rate limiting** global et par authentification
3. ✅ **bcrypt** pour hachage des mots de passe (12 rounds)
4. ✅ **express-mongo-sanitize** contre les injections NoSQL
5. ✅ **Validation des inputs** avec express-validator
6. ✅ **HTTPS forcé** en production
7. ✅ **Anti-bot** middleware avec détection User-Agent
8. ✅ **Timeout JWT** de 7 jours (raisonnable)
9. ✅ **Cookies HTTP-Only** (credentials: true dans CORS)
10. ✅ **Limite de taille** des requêtes (10kb)

---

## 🚀 **PLAN D'ACTION IMMÉDIAT**

### Étape 1 : Sécuriser JWT (15 min)
```bash
# 1. Vérifier .gitignore
git check-ignore .env

# 2. Si .env est tracké, le retirer
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "🔒 Retirer .env du tracking Git"

# 3. Générer nouvelle clé sur Render
# Dashboard > Environment > JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Étape 2 : Ajouter auth Socket.io (1h)
- Copier le code du middleware Socket.io ci-dessus
- Tester avec un utilisateur connecté
- Tester avec un utilisateur non connecté

### Étape 3 : Corriger les erreurs 500 (30 min)
- Rechercher tous les `catch` dans routes/
- Remplacer par messages génériques
- Garder les logs détaillés côté serveur

### Étape 4 : Tester (30 min)
- Tester auth
- Tester création de partie
- Vérifier les logs

---

## 📞 **AIDE ET SUPPORT**

Si tu as des questions sur l'implémentation :
1. Commence par les correctifs CRITIQUES
2. Teste chaque changement séparément
3. Garde des backups avant de modifier

**Besoin d'aide ?** Demande-moi pour n'importe quelle partie du code ! 🚀

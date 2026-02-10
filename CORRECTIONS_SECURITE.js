// ============================================
// 🛡️ CORRECTIONS SÉCURITÉ CRITIQUES
// ============================================
// Ce fichier contient le code prêt à l'emploi
// pour corriger les vulnérabilités CRITIQUES
// ============================================

// ============================================
// 1. MIDDLEWARE D'AUTHENTIFICATION SOCKET.IO
// ============================================
// À AJOUTER dans server.js APRÈS la création de io

const jwt = require('jsonwebtoken');

// Middleware Socket.io - Place AVANT io.on('connection')
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    // ✅ Autoriser les connexions anonymes mais avec flag
    socket.isAuthenticated = false;
    socket.ipAddress = socket.handshake.address;
    console.log(`⚠️ Connexion Socket.io non authentifiée depuis ${socket.ipAddress}`);
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.isAuthenticated = true;
    console.log(`✅ Socket.io authentifié: User ${decoded.userId}`);
    next();
  } catch (error) {
    console.log(`❌ Token Socket.io invalide: ${error.message}`);
    return next(new Error('Token invalide'));
  }
});

// ============================================
// 2. VÉRIFICATION AUTH DANS CHAQUE EVENT
// ============================================
// À AJOUTER au DÉBUT de chaque socket.on()

// Exemple avec create_game
socket.on('create_game', async (data) => {
  console.log('📥 Reçu demande de création de partie:', data);
  
  // ✅ NOUVEAU : Vérifier l'authentification
  if (!socket.isAuthenticated) {
    console.log(`❌ Tentative de création sans auth depuis ${socket.ipAddress}`);
    return socket.emit('error', { 
      message: '🔒 Vous devez être connecté pour créer une partie' 
    });
  }
  
  // ✅ Rate limiting renforcé pour utilisateurs authentifiés
  const rateCheck = checkRateLimit(
    socket.userId || socket.ipAddress, 
    'create_game', 
    socket.isAuthenticated ? 5 : 2,  // Plus permissif pour users auth
    60000
  );
  if (!rateCheck.allowed) {
    socket.emit('error', { message: rateCheck.error });
    return;
  }
  
  // ... reste du code existant
});

// ============================================
// 3. MODIFICATION CLIENT (App.jsx)
// ============================================
// À AJOUTER dans la fonction connectSocket de App.jsx

const connectSocket = (code) => {
  // ✅ NOUVEAU : Envoyer le token à Socket.io
  const token = localStorage.getItem('token');
  
  const newSocket = io('https://jeu-bleu-rouge.onrender.com', {
    auth: {
      token: token  // ✅ Ajouter ceci
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });
  
  // ... reste du code existant
};

// ============================================
// 4. GESTION SÉCURISÉE DES ERREURS 500
// ============================================
// À REMPLACER dans TOUS les catch() de routes/auth.js et routes/game.js

// ❌ ANCIEN CODE À REMPLACER
/*
catch (error) {
  console.error('Erreur:', error);
  res.status(500).json({ error: 'Erreur: ' + error.message });
}
*/

// ✅ NOUVEAU CODE
catch (error) {
  console.error('❌ Erreur serveur:', {
    endpoint: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // Message générique pour le client
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Une erreur est survenue. Veuillez réessayer.' 
      : error.message  // En dev, on peut être plus verbeux
  });
}

// ============================================
// 5. VALIDATION DES VARIABLES D'ENVIRONNEMENT
// ============================================
// Créer le fichier utils/validateEnv.js

const validateEnv = () => {
  console.log('🔍 Vérification des variables d\'environnement...\n');
  
  const required = ['MONGODB_URI', 'JWT_SECRET', 'APP_URL'];
  const optional = {
    'EMAIL_USER': 'Les emails ne seront pas envoyés',
    'EMAIL_PASSWORD': 'Les emails ne seront pas envoyés',
    'REDIS_URL': 'Token blacklist sera en mémoire (non persistant)'
  };
  
  let hasError = false;
  
  // Variables obligatoires
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
  
  // Vérifications de sécurité JWT_SECRET
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      console.error('❌ JWT_SECRET trop court ! Minimum 32 caractères');
      hasError = true;
    }
    
    if (process.env.JWT_SECRET === 'votre_secret_jwt_super_securise_changez_moi') {
      console.error('❌ JWT_SECRET utilise la valeur par défaut !');
      hasError = true;
    }
    
    if (process.env.JWT_SECRET.match(/^[0-9a-f]{64,}$/i)) {
      console.log('✅ JWT_SECRET format hexadécimal valide');
    }
  }
  
  console.log('');
  
  if (hasError) {
    console.error('💥 Démarrage impossible : erreurs de configuration\n');
    process.exit(1);
  }
  
  console.log('✅ Configuration valide\n');
};

module.exports = { validateEnv };

// ============================================
// 6. CORS PLUS RESTRICTIF
// ============================================
// À REMPLACER dans server.js ligne ~92

app.use(cors({
  origin: (origin, callback) => {
    // ✅ En production, TOUJOURS exiger une origine
    if (process.env.NODE_ENV === 'production' && !origin) {
      console.warn('⚠️ Requête sans origine rejetée (production)');
      return callback(new Error('Origine requise'));
    }
    
    // Origines autorisées en développement
    const devOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];
    
    const allOrigins = process.env.NODE_ENV === 'production' 
      ? allowedOrigins 
      : [...allowedOrigins, ...devOrigins];
    
    if (!origin || allOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Origine rejetée: ${origin}`);
      callback(new Error(`Origine non autorisée: ${origin}`));
    }
  },
  credentials: true,
  maxAge: 86400  // Cache preflight 24h
}));

// ============================================
// 7. AMÉLIORATION RATE LIMITING SOCKET.IO
// ============================================
// À AJOUTER dans utils/socketValidation.js

const socketRateLimits = new Map();

const checkSocketRateLimit = (identifier, eventName, max, windowMs) => {
  const key = `${identifier}:${eventName}`;
  const now = Date.now();
  
  if (!socketRateLimits.has(key)) {
    socketRateLimits.set(key, []);
  }
  
  const requests = socketRateLimits.get(key);
  
  // Nettoyer les anciennes requêtes
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= max) {
    console.warn(`⚠️ Rate limit dépassé: ${identifier} sur ${eventName} (${recentRequests.length}/${max})`);
    return {
      allowed: false,
      error: `⏱️ Trop de requêtes pour ${eventName}. Patientez ${Math.ceil(windowMs / 1000)}s.`,
      retryAfter: Math.min(...recentRequests) + windowMs - now
    };
  }
  
  recentRequests.push(now);
  socketRateLimits.set(key, recentRequests);
  
  return { allowed: true };
};

// Nettoyer périodiquement la Map
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, requests] of socketRateLimits.entries()) {
    const recentRequests = requests.filter(time => now - time < 3600000); // 1h
    if (recentRequests.length === 0) {
      socketRateLimits.delete(key);
      cleaned++;
    } else {
      socketRateLimits.set(key, recentRequests);
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Nettoyage rate limits: ${cleaned} entrées supprimées`);
  }
}, 300000); // Toutes les 5 minutes

module.exports = { checkSocketRateLimit };

// ============================================
// 8. SANITISATION HTML/XSS RENFORCÉE
// ============================================
// À INSTALLER : npm install dompurify jsdom
// À AJOUTER dans utils/socketValidation.js

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const sanitizeHTML = (str) => {
  if (typeof str !== 'string') return '';
  
  return DOMPurify.sanitize(str, {
    ALLOWED_TAGS: [],    // Aucune balise HTML
    ALLOWED_ATTR: [],    // Aucun attribut
    KEEP_CONTENT: true   // Garder le texte
  });
};

// ✅ MODIFIER sanitizeString existant
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  // Nettoyer HTML/JavaScript
  let cleaned = sanitizeHTML(str);
  
  // Supprimer les patterns dangereux
  cleaned = cleaned
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<script/gi, '')
    .replace(/<iframe/gi, '');
  
  // Limiter la longueur
  return cleaned.trim().substring(0, 200);
};

// ============================================
// 9. TIMEOUT MONGODB
// ============================================
// À MODIFIER dans server.js (connexion MongoDB)

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000,  // ✅ Timeout connexion : 5s
  socketTimeoutMS: 45000,          // ✅ Timeout requête : 45s
  maxPoolSize: 10,                 // ✅ Pool de connexions
  minPoolSize: 2
})
.then(() => {
  console.log('✅ Connecté à MongoDB avec timeouts configurés');
  mongoConnected = true;
  restoreActiveGames();
  
  setInterval(() => {
    cleanupOldGames();
  }, 6 * 60 * 60 * 1000);
  
  cleanupOldGames();
})
.catch(err => {
  console.error('❌ Erreur de connexion MongoDB:', err.message);
  console.log('⚠️ L\'application fonctionnera sans authentification');
});

// ✅ AJOUTER timeouts sur les requêtes individuelles
// Exemple dans routes/auth.js
const user = await User.findOne({ email })
  .maxTimeMS(5000)  // ✅ Max 5 secondes
  .exec();

// ============================================
// 10. LOGGING SÉCURISÉ
// ============================================
// À AJOUTER en haut de server.js

const logSecurityEvent = (level, event, details) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    event,
    details,
    env: process.env.NODE_ENV
  };
  
  const symbols = {
    'info': 'ℹ️',
    'warning': '⚠️',
    'error': '❌',
    'critical': '🚨'
  };
  
  console.log(`${symbols[level] || '📝'} [${level.toUpperCase()}] ${event}`, details);
  
  // TODO: En production, envoyer à un service de logging
  // comme Sentry, LogRocket, ou Papertrail
  if (process.env.NODE_ENV === 'production' && level === 'critical') {
    // Exemple : Sentry
    // Sentry.captureException(new Error(event), { extra: details });
  }
};

// Utilisation
logSecurityEvent('warning', 'Tentative connexion Socket.io sans auth', {
  ip: socket.ipAddress,
  timestamp: Date.now()
});

// ============================================
// INSTRUCTIONS D'INSTALLATION
// ============================================

/*
ÉTAPE 1 : Installer les dépendances manquantes
-------------------------------------------------
npm install dompurify jsdom

ÉTAPE 2 : Modifier server.js
-------------------------------------------------
1. Ajouter require('dotenv').config() EN PREMIER
2. Ajouter const { validateEnv } = require('./utils/validateEnv');
3. Appeler validateEnv() juste après
4. Ajouter le middleware Socket.io AVANT io.on('connection')
5. Modifier la connexion MongoDB avec les timeouts
6. Modifier CORS avec la version restrictive

ÉTAPE 3 : Créer/Modifier les fichiers utils
-------------------------------------------------
1. Créer utils/validateEnv.js avec le code ci-dessus
2. Modifier utils/socketValidation.js :
   - Ajouter sanitizeHTML
   - Modifier sanitizeString
   - Ajouter checkSocketRateLimit amélioré

ÉTAPE 4 : Modifier tous les socket.on()
-------------------------------------------------
Dans server.js, ajouter la vérification auth au début de CHAQUE :
- socket.on('create_game')
- socket.on('join_game')
- socket.on('start_game')
- socket.on('cast_vote')
- socket.on('chat_message')

ÉTAPE 5 : Modifier le client (client/src/App.jsx)
-------------------------------------------------
Dans la fonction connectSocket, ajouter :
auth: { token: localStorage.getItem('token') }

ÉTAPE 6 : Corriger toutes les erreurs 500
-------------------------------------------------
Rechercher TOUS les catch() dans :
- routes/auth.js
- routes/game.js
Et remplacer par la gestion sécurisée

ÉTAPE 7 : Tester
-------------------------------------------------
1. Démarrer le serveur : npm start
2. Vérifier les logs de validation d'environnement
3. Se connecter avec un compte
4. Créer une partie (doit fonctionner)
5. Se déconnecter
6. Essayer de créer une partie (doit être refusé)
7. Vérifier les logs de sécurité

ÉTAPE 8 : Déployer sur Render
-------------------------------------------------
1. Git add + commit + push
2. Vérifier que .env n'est PAS dans le commit
3. Générer nouveau JWT_SECRET :
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
4. Ajouter sur Render Dashboard > Environment Variables
5. Redéployer
6. Tester en production

ÉTAPE 9 : Monitoring (optionnel mais recommandé)
-------------------------------------------------
1. Créer compte Sentry.io (gratuit)
2. npm install @sentry/node
3. Ajouter dans server.js :
   const Sentry = require('@sentry/node');
   Sentry.init({ dsn: process.env.SENTRY_DSN });
4. Les erreurs critiques seront automatiquement envoyées

*/

// ============================================
// CHECKLIST DE VÉRIFICATION
// ============================================

/*
✅ JWT_SECRET changé et > 64 caractères
✅ .env retiré du Git
✅ Middleware Socket.io en place
✅ Vérification auth dans tous les socket.on()
✅ Token envoyé depuis le client
✅ Erreurs 500 génériques
✅ CORS restrictif
✅ Validation environnement au démarrage
✅ Timeouts MongoDB
✅ Sanitization HTML renforcée
✅ Rate limiting Socket.io amélioré
✅ Tests en local OK
✅ Déploiement sur Render
✅ Tests en production OK
*/

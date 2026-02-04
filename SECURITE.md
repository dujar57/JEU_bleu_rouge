# 🔒 Documentation Sécurité - Jeu Bleu vs Rouge

## État de la sécurité (mis à jour le 4 février 2026)

---

## ✅ MESURES DE SÉCURITÉ IMPLÉMENTÉES

### 1. **Authentification & Autorisation**
- ✅ **JWT tokens** avec expiration (7 jours)
- ✅ **Bcrypt** pour hasher les mots de passe (10 rounds de salt)
- ✅ **Middleware auth** pour protéger les routes privées
- ✅ **Validation stricte** des mots de passe (min 6 caractères, 1 maj, 1 min, 1 chiffre)
- ✅ **JWT_SECRET** obligatoire en production (vérification au démarrage)

### 2. **Protection contre les attaques**
- ✅ **Rate Limiting** :
  - Global : 100 requêtes/15min par IP
  - Auth : 5 tentatives/15min (connexion/inscription)
- ✅ **Helmet.js** - Headers HTTP sécurisés
- ✅ **CORS** restreint aux domaines autorisés :
  - `https://jeu-bleu-rouge.onrender.com`
  - `http://localhost:5173` (dev)
  - `http://localhost:3000` (dev)
- ✅ **MongoDB Sanitization** - Protection injection NoSQL
- ✅ **Limite de taille** - Requêtes limitées à 10KB
- ✅ **Express-validator** - Validation/sanitization des entrées

### 3. **Base de données MongoDB**
- ✅ **Mongoose schemas** avec validation stricte
- ✅ **Index unique** sur email et username
- ✅ **Mots de passe jamais retournés** dans les réponses API
- ✅ **URI MongoDB** obligatoire (pas de fallback local)
- ✅ **Connexion sécurisée** avec options recommandées

### 4. **Socket.io**
- ✅ **CORS configuré** avec origines spécifiques
- ✅ **Ping/Pong** configuré (timeout: 60s, interval: 25s)
- ✅ **Validation des données** côté serveur

---

## ⚠️ CONFIGURATION REQUISE EN PRODUCTION

### Variables d'environnement **OBLIGATOIRES** :

```bash
# JWT - Générer avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=votre_cle_secrete_de_64_caracteres_minimum_en_hexadecimal

# MongoDB Atlas (recommandé)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jeu_bleu_rouge?retryWrites=true&w=majority

# Port (défini automatiquement par Render)
PORT=3000

# URL de l'application
APP_URL=https://jeu-bleu-rouge.onrender.com

# Email (optionnel - pour vérification email)
EMAIL_SERVICE=gmail
EMAIL_USER=votre_email@gmail.com
EMAIL_PASSWORD=mot_de_passe_application_gmail
```

### Comment générer un JWT_SECRET sécurisé :

```bash
# Dans un terminal Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🛡️ BONNES PRATIQUES MISES EN PLACE

### Authentification
- ✅ Pas de JWT_SECRET par défaut (erreur au démarrage)
- ✅ Tokens avec expiration courte (7 jours)
- ✅ Validation stricte des inputs (email, username, password)
- ✅ Messages d'erreur génériques (pas de fuite d'info)

### Base de données
- ✅ Pas d'injection NoSQL possible (sanitization)
- ✅ Connexion avec retry et timeout
- ✅ Indexes pour performance et unicité
- ✅ Pas de données sensibles exposées

### Réseau
- ✅ CORS restreint aux origines autorisées
- ✅ Rate limiting agressif sur auth
- ✅ Headers HTTP sécurisés (Helmet)
- ✅ Taille des requêtes limitée

---

## 📋 CHECKLIST DE DÉPLOIEMENT

Avant de déployer en production :

- [ ] ✅ JWT_SECRET défini (64+ caractères aléatoires)
- [ ] ✅ MONGODB_URI configuré (MongoDB Atlas recommandé)
- [ ] ✅ Variables d'environnement sur Render configurées
- [ ] ✅ APP_URL correspond au domaine de production
- [ ] ✅ .env **JAMAIS** commité (vérifier .gitignore)
- [ ] ✅ Logs ne contiennent pas de données sensibles
- [ ] ✅ Rate limiting activé
- [ ] ✅ CORS configuré avec les bonnes origines

---

## 🚨 CE QUI RESTE À AMÉLIORER (Optionnel)

### Sécurité avancée (si nécessaire)
- [ ] Implémenter refresh tokens (JWT courte durée + refresh long)
- [ ] Ajouter 2FA (authentification à deux facteurs)
- [ ] Logger les tentatives de connexion suspectes
- [ ] Blacklist de tokens révoqués
- [ ] HTTPS strict (HSTS)

### Monitoring
- [ ] Alertes sur tentatives de brute force
- [ ] Dashboard de monitoring (Sentry, LogRocket)
- [ ] Logs centralisés
- [ ] Métriques de sécurité

---

## 📞 EN CAS DE FAILLE DE SÉCURITÉ

### Procédure d'urgence :

1. **Rotation immédiate du JWT_SECRET** (déconnecte tous les users)
2. **Vérifier les logs** pour identifier l'attaque
3. **Révoquer les tokens compromis**
4. **Patcher la faille** et redéployer
5. **Notifier les utilisateurs** si nécessaire
6. **Audit complet** de sécurité

### Commandes utiles :

```bash
# Rotation du JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copier la nouvelle clé dans Render > Environment Variables

# Vérifier les connexions MongoDB
# Se connecter à MongoDB Atlas > Network Access > IP Whitelist

# Tester les endpoints de sécurité
curl -X POST https://jeu-bleu-rouge.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123"}'
```

---

## 📚 Dépendances de sécurité

```json
{
  "bcryptjs": "^3.0.3",          // Hash des mots de passe
  "helmet": "^7.x",               // Headers HTTP sécurisés
  "express-rate-limit": "^7.x",  // Rate limiting
  "express-validator": "^7.x",   // Validation des inputs
  "express-mongo-sanitize": "^2.x", // Protection NoSQL injection
  "jsonwebtoken": "^9.0.3",      // JWT tokens
  "cors": "^2.8.5"                // CORS configuré
}
```

---

## ✅ Tests de sécurité recommandés

### Manuels :
- Tester le rate limiting (5+ tentatives de login)
- Vérifier CORS (requête depuis domaine non autorisé)
- Tenter injection NoSQL dans les formulaires
- Vérifier que les mots de passe ne sont jamais exposés

### Outils :
- OWASP ZAP (scan de vulnérabilités)
- Postman (tests API)
- npm audit (vulnérabilités dépendances)

```bash
# Vérifier les vulnérabilités npm
npm audit

# Mettre à jour les packages vulnérables
npm audit fix
```

---

**Dernière mise à jour:** 4 février 2026  
**Niveau de sécurité:** 🟢 **PRODUCTION-READY**  
**Prochaine revue:** Mars 2026

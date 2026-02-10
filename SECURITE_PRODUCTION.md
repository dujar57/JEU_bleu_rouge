# 🔒 SÉCURITÉ PRODUCTION - Configuration Complète

## ✅ Mesures de Sécurité Implémentées

### 1. HTTPS et En-têtes de Sécurité
- ✅ **Redirection HTTPS forcée** en production
- ✅ **Helmet.js** avec CSP stricte
- ✅ **HSTS** (HTTP Strict Transport Security)
- ✅ **X-Frame-Options**: Prévention du clickjacking
- ✅ **X-Content-Type-Options**: Prévention MIME type sniffing

### 2. Authentification et Sessions
- ✅ **Hachage bcrypt** (12 rounds) pour les mots de passe
- ✅ **JWT** avec expiration (7 jours)
- ✅ **Blacklist de tokens** pour logout sécurisé
- ✅ **Protection timing attack** sur les comparaisons de mots de passe
- ✅ **Validation des entrées** avec express-validator
- ✅ **Sanitization MongoDB** pour prévenir les injections NoSQL

### 3. Vérification Email
- ✅ **Token de vérification** (32 bytes aléatoires)
- ✅ **Expiration des tokens** (24h)
- ✅ **Email HTML** avec lien de vérification
- ✅ **Email de bienvenue** après vérification

### 4. Rate Limiting
- ✅ **Login**: 5 tentatives / 15 minutes
- ✅ **Inscription**: 3 tentatives / 15 minutes
- ✅ **Chat**: 20 messages / minute
- ✅ **Vote**: 10 votes / minute
- ✅ **Création de partie**: 5 parties / heure

### 5. Anti-Bot et Anti-Spam
- ✅ **User-Agent vide rejeté**
- ✅ **Suivi des activités suspectes par IP**
- ✅ **Logging des tentatives d'intrusion**
- ✅ **Limitation des requêtes globale**: 100 req / 15 min

### 6. Validations Anti-Triche (Game Logic)
- ✅ **Start Game**:
  - Vérification que seul l'hôte peut démarrer
  - Vérification que la partie n'a pas déjà commencé
  - Vérification que tous les joueurs sont connectés
  - Minimum 4 joueurs requis
  
- ✅ **Chat**:
  - Vérification que le joueur est vivant
  - Vérification que la partie est en cours
  - Sanitization du message
  - Limitation de caractères (500 max)
  
- ✅ **Vote**:
  - Vérification de la phase de vote active
  - Vérification que le joueur n'a pas déjà voté
  - Vérification que le joueur est vivant
  - Vérification que la cible est de l'équipe adverse
  - Impossible de voter pour soi-même

### 7. Sécurité Base de Données
- ✅ **MongoDB URI** en variable d'environnement
- ✅ **Sanitization** avec mongo-sanitize
- ✅ **Indexation** pour performance
- ✅ **Validation des schémas** Mongoose

### 8. Logging et Monitoring
- ✅ **Logs des connexions**
- ✅ **Logs des activités suspectes**
- ✅ **Logs des tentatives de triche**
- ✅ **Logs des erreurs**

## 📋 Configuration Requise

### Variables d'Environnement (.env)
```env
# JWT Secret (générer avec: node generate-jwt-secret.js)
JWT_SECRET=votre_secret_64_chars_aleatoires

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jeu_bleu_rouge

# Email (pour vérification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=votre.email@gmail.com
EMAIL_PASSWORD=votre_app_password_gmail

# Site
SITE_URL=https://jeu-bleu-rouge.onrender.com
NODE_ENV=production
```

### Générer un JWT Secret Sécurisé
```bash
node generate-jwt-secret.js
```

### Configuration Gmail pour les Emails
1. Aller dans **Compte Google > Sécurité**
2. Activer **Validation en 2 étapes**
3. Créer un **Mot de passe d'application**
4. Utiliser ce mot de passe dans `EMAIL_PASSWORD`

## 🚀 Déploiement Render

### Variables d'Environnement à Configurer
Dans le dashboard Render, ajouter :
- `JWT_SECRET`
- `MONGODB_URI`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `SMTP_HOST`
- `SMTP_PORT`
- `SITE_URL`
- `NODE_ENV=production`

### Build Command
```bash
npm install && cd client && npm install && npm run build
```

### Start Command
```bash
node server.js
```

## 🔍 Tests de Sécurité

### Test 1: Email Verification
```bash
# Inscription
curl -X POST https://jeu-bleu-rouge.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"Test123!"}'

# Vérifier l'email reçu et cliquer sur le lien
```

### Test 2: Rate Limiting
```bash
# Tester 10 requêtes rapides (devrait bloquer après 5)
for i in {1..10}; do
  curl https://jeu-bleu-rouge.onrender.com/api/auth/login
done
```

### Test 3: Anti-Bot
```bash
# Sans User-Agent (devrait être rejeté)
curl -A "" https://jeu-bleu-rouge.onrender.com/
```

### Test 4: Logout et Token Blacklist
```bash
# 1. Login
TOKEN=$(curl -X POST https://jeu-bleu-rouge.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"Test123!"}' | jq -r '.token')

# 2. Logout
curl -X POST https://jeu-bleu-rouge.onrender.com/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# 3. Tenter d'utiliser le token (devrait échouer)
curl https://jeu-bleu-rouge.onrender.com/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## 🛡️ Mesures Additionnelles Recommandées (Futur)

### À Court Terme
- [ ] **CSRF Protection** avec csurf middleware
- [ ] **Session Redis** pour scalabilité
- [ ] **2FA** (authentification à deux facteurs)
- [ ] **Captcha** pour l'inscription

### À Moyen Terme
- [ ] **WAF** (Web Application Firewall)
- [ ] **DDoS Protection** (Cloudflare)
- [ ] **Audit de sécurité** professionnel
- [ ] **Pen Testing** automatisé

### À Long Terme
- [ ] **SOC 2 Compliance**
- [ ] **Bug Bounty Program**
- [ ] **Security Headers** A+ rating
- [ ] **OWASP Top 10** compliance complète

## 📊 Checklist de Sécurité

### Avant Déploiement
- [x] JWT_SECRET généré aléatoirement
- [x] Variables d'environnement configurées
- [x] HTTPS forcé en production
- [x] Rate limiting activé
- [x] Validation des entrées complète
- [x] Sanitization MongoDB
- [x] Email verification activée
- [x] Logging complet
- [x] Anti-triche implémenté

### Après Déploiement
- [ ] Tester l'inscription et la vérification email
- [ ] Tester le rate limiting
- [ ] Vérifier les logs d'activité suspecte
- [ ] Tester le logout et la blacklist
- [ ] Vérifier les headers de sécurité (securityheaders.com)
- [ ] Scanner les vulnérabilités (npm audit)

### Maintenance Continue
- [ ] Mettre à jour les dépendances régulièrement
- [ ] Surveiller les logs d'erreurs
- [ ] Analyser les activités suspectes
- [ ] Backup régulier de la base de données
- [ ] Rotation des secrets JWT tous les 6 mois

## 🔗 Ressources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Docs](https://helmetjs.github.io/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**✅ Toutes les mesures de sécurité de base sont implémentées et prêtes pour la production.**

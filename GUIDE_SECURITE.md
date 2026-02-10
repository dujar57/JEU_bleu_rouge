# 🚀 Guide Rapide - Configuration Email et Sécurité

## ⚡ Configuration Email (Gmail)

### Étape 1: Créer un Mot de Passe d'Application Gmail
1. Aller sur https://myaccount.google.com/security
2. Activer **Validation en 2 étapes** (si pas déjà fait)
3. Chercher **Mots de passe des applications**
4. Créer un nouveau mot de passe pour "Mail"
5. Copier le mot de passe généré (16 caractères)

### Étape 2: Configurer les Variables d'Environnement sur Render
1. Aller sur https://dashboard.render.com
2. Sélectionner votre service **jeu-bleu-rouge**
3. Aller dans **Environment**
4. Ajouter ces variables:

```
EMAIL_USER=votre.email@gmail.com
EMAIL_PASSWORD=le_mot_de_passe_app_16_chars
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SITE_URL=https://jeu-bleu-rouge.onrender.com
```

5. Cliquer sur **Save Changes**
6. Render redémarrera automatiquement

### Étape 3: Tester l'Envoi d'Email
```bash
curl -X POST https://jeu-bleu-rouge.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "votre.email@gmail.com",
    "password": "Test123!Secure"
  }'
```

Vous devriez recevoir un email avec un lien de vérification.

## 🧪 Tests de Sécurité Automatiques

### Lancer tous les tests
```bash
node test-security.js
```

### Tests Individuels

#### Test 1: Headers de Sécurité
```bash
curl -I https://jeu-bleu-rouge.onrender.com | grep -E "strict-transport|x-frame|content-security"
```

#### Test 2: Rate Limiting
```bash
# Envoyer 10 requêtes rapides (devrait bloquer après 5)
for i in {1..10}; do
  echo "Requête $i"
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST https://jeu-bleu-rouge.onrender.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
  sleep 0.5
done
```

#### Test 3: Validation des Entrées
```bash
# Username trop court (devrait retourner 400)
curl -X POST https://jeu-bleu-rouge.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"ab","email":"test@example.com","password":"Test123!"}'
```

#### Test 4: Token Blacklist (Logout Sécurisé)
```bash
# 1. Login
TOKEN=$(curl -s -X POST https://jeu-bleu-rouge.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"youruser","password":"yourpass"}' | jq -r '.token')

echo "Token: $TOKEN"

# 2. Vérifier que le token fonctionne
curl -s https://jeu-bleu-rouge.onrender.com/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 3. Logout
curl -s -X POST https://jeu-bleu-rouge.onrender.com/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# 4. Essayer d'utiliser le token (devrait échouer)
curl -s https://jeu-bleu-rouge.onrender.com/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## 🎮 Tests Anti-Triche dans le Jeu

### Test 1: Démarrage par Non-Hôte
1. Créer une partie avec un compte
2. Rejoindre avec un autre compte
3. Essayer de démarrer depuis le 2ème compte
4. ✅ Devrait afficher "Seul l'hôte peut démarrer"

### Test 2: Vote Multiple
1. Lancer une partie
2. Pendant la phase de vote, voter pour un joueur
3. Essayer de voter à nouveau
4. ✅ Devrait afficher "Vous avez déjà voté"

### Test 3: Vote pour son Équipe
1. Pendant la phase de vote
2. Essayer de voter pour un joueur de votre équipe
3. ✅ Devrait afficher "Vous ne pouvez pas voter pour votre propre équipe"

### Test 4: Message en Dehors du Jeu
1. Rejoindre une partie en attente (lobby)
2. Essayer d'envoyer un message
3. ✅ Devrait afficher "Les messages ne sont disponibles qu'en partie"

## 📊 Monitoring de Sécurité

### Vérifier les Logs sur Render
1. Aller sur votre dashboard Render
2. Cliquer sur **Logs**
3. Chercher:
   - `⚠️` - Tentatives d'intrusion
   - `🚨` - Activités suspectes
   - `❌` - Erreurs

### Logs Importants à Surveiller
```
⚠️ Tentative de démarrage non autorisée
⚠️ Tentative de vote pour son équipe
⚠️ Tentative de double vote
🚨 Activité suspecte détectée
❌ Rate limit dépassé
```

## 🔐 Vérification Complète de Sécurité

### Checklist Avant Production
- [ ] JWT_SECRET généré aléatoirement (64 chars)
- [ ] MONGODB_URI configuré avec un mot de passe fort
- [ ] EMAIL_USER et EMAIL_PASSWORD configurés
- [ ] SITE_URL = https://jeu-bleu-rouge.onrender.com
- [ ] NODE_ENV = production
- [ ] Tests de sécurité passent (node test-security.js)
- [ ] Test d'email de vérification fonctionne
- [ ] Rate limiting testé et fonctionnel
- [ ] Logout invalide les tokens
- [ ] Headers de sécurité vérifiés avec curl -I

### Scan de Vulnérabilités
```bash
# Audit des dépendances npm
npm audit

# Fix automatique des vulnérabilités
npm audit fix

# Check outdated packages
npm outdated
```

### Tester la Sécurité des Headers
Visiter: https://securityheaders.com/?q=https://jeu-bleu-rouge.onrender.com

Objectif: Au moins **Grade B** (idéalement A)

## 🚨 Que Faire en Cas de Problème

### Email ne s'envoie pas
1. Vérifier `EMAIL_USER` et `EMAIL_PASSWORD` dans Render
2. Vérifier les logs: chercher "Erreur envoi email"
3. Tester avec Gmail d'abord (plus simple)
4. Vérifier que la 2FA Gmail est activée

### Rate Limiting trop strict
Ajuster dans [server.js](server.js) :
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Augmenter à 30 minutes?
  max: 10, // Augmenter à 10 tentatives?
});
```

### Token Blacklist ne fonctionne pas
1. Vérifier que `tokenBlacklist` est bien importé dans auth.js
2. En production, remplacer par Redis pour la persistance
3. Vérifier les logs de logout

### Anti-Triche bloque les joueurs légitimes
1. Vérifier les logs: chercher "Tentative"
2. Ajuster les validations dans server.js
3. Ajouter plus de logging pour débugger

## 📞 Support

Pour des questions sur la sécurité:
- Lire [SECURITE_PRODUCTION.md](SECURITE_PRODUCTION.md)
- Vérifier les logs Render
- Tester avec test-security.js

---

✅ **Une fois tous les tests passés, votre application est prête pour la production!**

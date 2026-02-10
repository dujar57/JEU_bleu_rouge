# 📧 Configuration Email sur Render - Guide Complet

## 🎯 Objectif
Activer l'envoi d'emails de vérification pour les nouvelles inscriptions sur votre application déployée sur Render.

## 📋 Prérequis
- Compte Gmail (ou autre SMTP)
- Application déployée sur Render
- Accès au dashboard Render

---

## 🔧 MÉTHODE 1: Gmail (Recommandé)

### Étape 1: Configurer Gmail

#### 1.1 Activer la Validation en 2 Étapes
1. Aller sur https://myaccount.google.com/security
2. Chercher **"Validation en deux étapes"**
3. Cliquer sur **"Activer"**
4. Suivre les instructions (SMS ou application)

#### 1.2 Créer un Mot de Passe d'Application
1. Toujours sur https://myaccount.google.com/security
2. Chercher **"Mots de passe des applications"** 
   - ⚠️ Ce menu n'apparaît qu'après avoir activé la 2FA
3. Cliquer dessus
4. Sélectionner:
   - **Application**: Autre (nom personnalisé)
   - **Nom**: "Jeu Bleu Rouge"
5. Cliquer sur **"Générer"**
6. **Copier le mot de passe de 16 caractères** (ex: `abcd efgh ijkl mnop`)
7. ⚠️ **Ne fermez pas encore cette fenêtre!**

### Étape 2: Configurer Render

#### 2.1 Accéder aux Variables d'Environnement
1. Aller sur https://dashboard.render.com
2. Sélectionner votre service **jeu-bleu-rouge**
3. Dans le menu de gauche, cliquer sur **"Environment"**

#### 2.2 Ajouter les Variables
Cliquer sur **"Add Environment Variable"** pour chaque variable:

| Clé | Valeur | Exemple |
|-----|--------|---------|
| `EMAIL_USER` | Votre email Gmail | `votre.email@gmail.com` |
| `EMAIL_PASSWORD` | Le mot de passe d'application (16 chars) | `abcdefghijklmnop` |
| `SMTP_HOST` | `smtp.gmail.com` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` | `587` |
| `SITE_URL` | URL de votre app | `https://jeu-bleu-rouge.onrender.com` |

#### 2.3 Sauvegarder et Redémarrer
1. Cliquer sur **"Save Changes"**
2. Render va automatiquement redéployer votre application (2-3 minutes)
3. Attendre que le statut passe à **"Live"**

### Étape 3: Tester

#### 3.1 Test via cURL
```bash
curl -X POST https://jeu-bleu-rouge.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "votre.email@gmail.com",
    "password": "Test123!Secure"
  }'
```

**Réponse attendue:**
```json
{
  "message": "Inscription réussie! Vérifiez votre email pour confirmer votre compte.",
  "verification_required": true
}
```

#### 3.2 Vérifier votre Email
1. Ouvrir Gmail
2. Chercher un email de **jeu-bleu-rouge** ou **votre.email@gmail.com**
3. Devrait contenir:
   ```
   Bienvenue testuser123 !
   
   Merci de vous être inscrit. Veuillez confirmer votre email en cliquant sur le lien ci-dessous:
   
   [Cliquer ici pour vérifier]
   ```
4. Cliquer sur le lien
5. Devrait afficher: "✅ Email vérifié avec succès!"

#### 3.3 Vérifier les Logs Render
1. Dans Render Dashboard, aller sur **"Logs"**
2. Chercher:
   ```
   📧 Email de vérification envoyé à testuser123
   ```
3. Après avoir cliqué sur le lien:
   ```
   ✅ Email vérifié pour testuser123
   🎉 Email de bienvenue envoyé à testuser123
   ```

---

## 🔧 MÉTHODE 2: Outlook/Hotmail

### Configuration Outlook
```env
EMAIL_USER=votre.email@outlook.com
EMAIL_PASSWORD=votre_mot_de_passe
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

⚠️ Outlook peut bloquer les "connexions moins sécurisées". Activer dans les paramètres de sécurité.

---

## 🔧 MÉTHODE 3: SendGrid (Pour Production Scale)

### Avantages
- ✅ Pas de limite Gmail (100 emails/jour)
- ✅ Deliverability supérieure
- ✅ Analytics intégrés
- ✅ 100 emails gratuits/jour

### Configuration
1. Créer un compte sur https://sendgrid.com (gratuit)
2. Créer une API Key
3. Configurer dans Render:

```env
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxx
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
```

---

## 🚨 Résolution de Problèmes

### Problème 1: Email Non Reçu

#### Vérifier les Logs
1. Dashboard Render → **Logs**
2. Chercher: `Erreur envoi email`

#### Causes Possibles
- ❌ Mot de passe d'application incorrect
- ❌ 2FA Gmail non activé
- ❌ Email dans spam/courrier indésirable
- ❌ Variables d'environnement mal configurées

#### Solutions
```bash
# 1. Vérifier les variables depuis Render logs
echo "Checking email config..."

# 2. Tester manuellement sur le serveur
# Dans Render Shell (Dashboard → Shell):
node -e "console.log(process.env.EMAIL_USER, process.env.SMTP_HOST)"

# 3. Si undefined → Variables mal configurées
```

### Problème 2: "Invalid Credentials"

**Erreur dans les logs:**
```
❌ Erreur envoi email verification: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solution:**
1. Le mot de passe d'application Gmail est incorrect
2. Régénérer un nouveau mot de passe d'application
3. Mettre à jour `EMAIL_PASSWORD` dans Render
4. Redéployer

### Problème 3: Connection Timeout

**Erreur:**
```
Error: Connection timeout
```

**Solutions:**
1. Vérifier `SMTP_PORT=587` (pas 465 ou 25)
2. Vérifier `SMTP_HOST=smtp.gmail.com`
3. Render peut bloquer certains ports → Contacter support

### Problème 4: Email dans Spam

**Si l'email arrive dans spam:**
1. C'est normal pour les tests
2. Pour améliorer:
   - Utiliser SendGrid en production
   - Configurer SPF/DKIM/DMARC records
   - Avoir un domaine personnalisé

---

## ✅ Checklist de Validation

### Avant de Tester
- [ ] Gmail 2FA activé
- [ ] Mot de passe d'application créé (16 chars)
- [ ] 5 variables ajoutées dans Render
- [ ] Application redéployée (status "Live")

### Test 1: Inscription
- [ ] Requête cURL réussie (200)
- [ ] Message "Vérifiez votre email"
- [ ] Email reçu dans Gmail (peut être spam)
- [ ] Lien de vérification fonctionnel

### Test 2: Vérification
- [ ] Cliquer sur le lien dans l'email
- [ ] Page affiche "Email vérifié"
- [ ] Email de bienvenue reçu
- [ ] Connexion possible

### Test 3: Logs
- [ ] Log: "📧 Email de vérification envoyé"
- [ ] Log: "✅ Email vérifié"
- [ ] Log: "🎉 Email de bienvenue envoyé"
- [ ] Pas d'erreur dans les logs

---

## 📊 Limites Gmail

### Quotas Gratuits
- **100 emails / jour**
- **500 destinataires / jour**
- Réinitialisation tous les jours à minuit PST

### Pour Dépasser les Limites
1. **Google Workspace** (payant): 2000 emails/jour
2. **SendGrid**: 100 emails/jour gratuit, puis payant
3. **AWS SES**: 62,000 emails/mois gratuit (première année)
4. **Mailgun**: 5,000 emails/mois gratuit

---

## 🎯 Test Rapide (Copier-Coller)

```bash
# Remplacer YOUR_EMAIL par votre email
curl -X POST https://jeu-bleu-rouge.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"test$(date +%s)\",
    \"email\": \"YOUR_EMAIL@gmail.com\",
    \"password\": \"Test123!Secure\"
  }"

# Devrait retourner:
# {"message":"Inscription réussie! Vérifiez votre email..."}
```

---

## 📞 Support

Si rien ne fonctionne:
1. Vérifier les logs Render en temps réel
2. Tester avec un service SMTP online: https://ethereal.email
3. Vérifier les variables: `env | grep EMAIL`

---

✅ **Une fois l'email configuré, votre système de vérification est opérationnel!**

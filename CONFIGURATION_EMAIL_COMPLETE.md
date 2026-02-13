# 📧 Configuration Complète des Emails de Vérification

## 🎯 Vue d'ensemble

Ce guide vous explique comment activer l'envoi d'emails de vérification pour votre jeu.

---

## ✅ Étape 1 : Préparer un compte Gmail

### Option A : Utiliser Gmail (Recommandé)

#### 1. Activer la validation en 2 étapes
1. Allez sur **https://myaccount.google.com/security**
2. Dans "Connexion à Google", cliquez sur **"Validation en deux étapes"**
3. Cliquez sur **"Activer"** et suivez les instructions
   - Vous pouvez utiliser un SMS ou l'application Google Authenticator
   - C'est obligatoire pour créer un mot de passe d'application

#### 2. Créer un mot de passe d'application
1. Restez sur https://myaccount.google.com/security
2. Cherchez **"Mots de passe des applications"**
   - Si vous ne le voyez pas, vérifiez que la validation en 2 étapes est bien activée
3. Cliquez sur **"Mots de passe des applications"**
4. Sélectionnez :
   - **Application** : Autre (nom personnalisé)
   - **Nom** : Tapez `Jeu Bleu Rouge` ou `Mon Application`
5. Cliquez sur **"Générer"**
6. **⚠️ IMPORTANT** : Un mot de passe de 16 caractères s'affiche (ex: `abcd efgh ijkl mnop`)
   - **Copier ce mot de passe SANS LES ESPACES** : `abcdefghijklmnop`
   - Vous ne pourrez plus le voir ensuite
   - Conservez-le dans un endroit sûr

### Option B : Utiliser un autre service email (SendGrid, Mailgun, etc.)

Si vous préférez un service professionnel :
- **SendGrid** : https://sendgrid.com (12 000 emails gratuits/mois)
- **Mailgun** : https://www.mailgun.com (5 000 emails gratuits/mois)
- **Brevo (ex-Sendinblue)** : https://www.brevo.com (300 emails/jour gratuits)

---

## 🔧 Étape 2 : Configurer les Variables d'Environnement sur Render

### 1. Accéder à votre dashboard Render
1. Allez sur **https://dashboard.render.com**
2. Connectez-vous à votre compte
3. Cliquez sur votre service : **jeu-bleu-rouge**

### 2. Ajouter les variables d'environnement
1. Dans le menu de gauche, cliquez sur **"Environment"**
2. Cliquez sur **"Add Environment Variable"**
3. Ajoutez les variables suivantes **UNE PAR UNE** :

#### Pour Gmail :

| Variable | Valeur | Exemple |
|----------|--------|---------|
| `EMAIL_SERVICE` | `gmail` | `gmail` |
| `EMAIL_USER` | Votre email Gmail complet | `votre.email@gmail.com` |
| `EMAIL_PASSWORD` | Le mot de passe d'application (16 caractères SANS espaces) | `abcdefghijklmnop` |
| `SMTP_HOST` | `smtp.gmail.com` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` | `587` |
| `APP_URL` | L'URL de votre application | `https://jeu-bleu-rouge.onrender.com` |

#### Pour SendGrid (optionnel) :

| Variable | Valeur |
|----------|--------|
| `EMAIL_SERVICE` | `sendgrid` |
| `EMAIL_USER` | `apikey` |
| `EMAIL_PASSWORD` | Votre clé API SendGrid |
| `SMTP_HOST` | `smtp.sendgrid.net` |
| `SMTP_PORT` | `587` |

### 3. Sauvegarder
1. Cliquez sur **"Save Changes"** en bas de page
2. Render va automatiquement redéployer votre application (⏱️ 2-3 minutes)
3. Attendez que le statut passe à **"Live"** (vert)

---

## 💻 Étape 3 : Activer le Code dans l'Application

Les lignes de code sont déjà présentes mais commentées. Voici comment les activer :

### Fichier : `routes/auth.js`

**Ligne 7** - Décommenter l'import :
```javascript
// AVANT (ligne commentée) :
// const { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } = require('../utils/emailService');

// APRÈS (décommentée) :
const { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } = require('../utils/emailService');
```

**Lignes 105-108** - Décommenter la génération du token :
```javascript
// AVANT :
// const verificationToken = generateVerificationToken();
// user.emailVerificationToken = verificationToken;
// user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 heures

// APRÈS :
const verificationToken = generateVerificationToken();
user.emailVerificationToken = verificationToken;
user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 heures
```

**Ligne 112** - Décommenter l'envoi d'email :
```javascript
// AVANT :
// const emailSent = await sendVerificationEmail(user, verificationToken);

// APRÈS :
const emailSent = await sendVerificationEmail(user, verificationToken);
```

---

## 🚀 Étape 4 : Mettre à Jour sur Render

### Option A : Push via GitHub (Recommandé)

Si votre projet est sur GitHub :
```bash
git add .
git commit -m "Activation des emails de vérification"
git push origin main
```
Render détectera le changement et redéploiera automatiquement.

### Option B : Redéploiement manuel

1. Sur Render, allez sur votre service **jeu-bleu-rouge**
2. Cliquez sur **"Manual Deploy"** en haut à droite
3. Sélectionnez **"Deploy latest commit"**
4. Attendez la fin du déploiement (Status = "Live")

---

## 🧪 Étape 5 : Tester l'Envoi d'Emails

### Test 1 : Inscription

1. Allez sur votre site : **https://jeu-bleu-rouge.onrender.com**
2. Cliquez sur **"INSCRIPTION"** ou **"REGISTER"**
3. Remplissez le formulaire avec **VOTRE VRAI EMAIL**
   ```
   Pseudo : TestUser123
   Email : votre.email@gmail.com
   Password : Test1234
   ```
4. Cliquez sur **"S'inscrire"**

**✅ Résultat attendu :**
```
✅ Inscription réussie !

📧 Un email de confirmation a été envoyé à votre.email@gmail.com

Veuillez vérifier votre boîte de réception et cliquer 
sur le lien de validation avant de vous connecter.
```

### Test 2 : Vérifier la Réception

1. Ouvrez votre boîte Gmail
2. Cherchez un email de **"Jeu Bleu Rouge"**
3. **Si vous ne le voyez pas** :
   - Vérifiez le dossier **SPAM** / **Courrier indésirable**
   - Vérifiez le dossier **Promotions** (Gmail)
   - Attendez 1-2 minutes (parfois légèrement en retard)

4. **L'email devrait contenir** :
   - Sujet : 🎮 Confirmez votre adresse email - Jeu Bleu Rouge
   - Un bouton bleu : **"✅ Confirmer mon email"**
   - Un lien cliquable

### Test 3 : Validation du Compte

1. Cliquez sur le bouton **"✅ Confirmer mon email"** dans l'email
2. Une nouvelle page s'ouvre :
   ```
   ✅ Email vérifié avec succès !
   
   Vous pouvez maintenant vous connecter à votre compte.
   
   [Retour à l'accueil]
   ```

3. **Vous devriez recevoir un 2ème email** :
   - Sujet : 🎉 Votre compte est activé !
   - Message de bienvenue

### Test 4 : Connexion

#### Cas 1 : Email NON vérifié
1. Essayez de vous connecter **AVANT** de cliquer sur le lien de l'email
2. Message attendu :
   ```
   ⚠️ Email non vérifié
   
   📧 Votre email n'est pas encore vérifié.
   
   Veuillez consulter votre boîte mail et cliquer 
   sur le lien de confirmation.
   ```

#### Cas 2 : Email vérifié
1. Connectez-vous **APRÈS** avoir cliqué sur le lien
2. Message attendu :
   ```
   ✅ Connexion réussie !
   
   [Vous êtes redirigé vers le jeu]
   ```

---

## 🔍 Dépannage

### Problème 1 : "Erreur lors de l'envoi de l'email"

**Causes possibles :**
- ❌ Variables d'environnement mal configurées
- ❌ Mot de passe d'application incorrect
- ❌ Validation 2 étapes non activée sur Gmail

**Solutions :**
1. Vérifiez sur Render → Environment que toutes les variables sont présentes
2. Recréez un nouveau mot de passe d'application Gmail
3. Vérifiez que `EMAIL_PASSWORD` ne contient PAS d'espaces

### Problème 2 : Email reçu dans les SPAM

**Solution :**
1. Marquez l'email comme "Non spam"
2. Ajoutez l'adresse à vos contacts
3. À l'avenir, Gmail le mettra dans la boîte principale

### Problème 3 : "Could not read nodemailer"

**Cause :** Le module nodemailer n'est pas installé

**Solution :**
```bash
cd JeuBleuRouge
npm install nodemailer
git add .
git commit -m "Install nodemailer"
git push
```

### Problème 4 : Pas d'email reçu du tout

**Vérifications :**
1. **Console Render** :
   - Allez sur Render → Logs
   - Cherchez : `✅ Email de vérification envoyé`
   - Si vous voyez ❌ → Il y a un problème de config

2. **Variables d'environnement** :
   - Vérifiez chaque variable sur Render → Environment
   - Pas d'espace avant/après les valeurs
   - EMAIL_USER doit être un email complet : `user@gmail.com`

3. **Mot de passe d'application** :
   - Doit être exactement 16 caractères
   - Pas d'espaces
   - Que des lettres minuscules

---

## 📋 Checklist Complète

- [ ] Compte Gmail avec validation 2 étapes activée
- [ ] Mot de passe d'application généré (16 caractères)
- [ ] Variables d'environnement ajoutées sur Render
- [ ] Code décommenté dans `routes/auth.js`
- [ ] Application redéployée sur Render
- [ ] Test d'inscription effectué
- [ ] Email reçu et lien de validation cliqué
- [ ] Connexion réussie après vérification

---

## 🎉 Félicitations !

Une fois tous les tests réussis, votre système d'email est **100% opérationnel** !

Les utilisateurs devront obligatoirement vérifier leur email avant de pouvoir se connecter.

---

## 📞 Besoin d'Aide ?

Si vous rencontrez des problèmes :
1. Vérifiez les logs Render (Render Dashboard → Logs)
2. Consultez la section Dépannage ci-dessus
3. Vérifiez que toutes les étapes ont été suivies dans l'ordre

Bonne chance ! 🚀

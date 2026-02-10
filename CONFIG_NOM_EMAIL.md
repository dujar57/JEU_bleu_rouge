# 📧 Configuration Email - Nom d'Affichage

## Problème Résolu

Le nom **"Jeu Bleu Rouge 🎮"** s'affichera maintenant correctement dans les emails au lieu de votre nom personnel.

---

## ✅ Modifications Apportées

Le code a été modifié pour forcer le nom d'affichage :

```javascript
from: {
  name: 'Jeu Bleu Rouge 🎮',
  address: process.env.EMAIL_USER
}
```

Au lieu de :
```javascript
from: `"Jeu Bleu Rouge" <${process.env.EMAIL_USER}>`
```

---

## 🔧 Configuration Gmail (si le nom s'affiche quand même)

Si Gmail affiche encore votre nom personnel, suivez ces étapes :

### Option 1 : Créer une Adresse Alias Gmail

1. **Aller dans les Paramètres Gmail**
   - Ouvrir Gmail
   - Cliquer sur ⚙️ (en haut à droite)
   - Cliquer sur **"Voir tous les paramètres"**

2. **Onglet "Comptes et importation"**
   - Chercher la section **"Envoyer des e-mails en tant que :"**
   - Cliquer sur **"Ajouter une autre adresse e-mail"**

3. **Ajouter l'alias**
   - Nom : `Jeu Bleu Rouge`
   - Adresse e-mail : Votre email du jeu (ex: `jeubleuerouge@gmail.com`)
   - Décocher "Traiter comme un alias"
   - Cliquer sur "Étape suivante"

4. **Vérifier l'alias**
   - Gmail va envoyer un code de vérification
   - Entrer le code
   - Définir cet alias comme **expéditeur par défaut**

### Option 2 : Modifier le Nom du Compte Gmail

⚠️ **Attention** : Cela changera votre nom partout dans Gmail !

1. **Aller sur votre compte Google**
   - https://myaccount.google.com/profile

2. **Modifier le nom**
   - Cliquer sur "Nom"
   - Changer pour "Jeu Bleu Rouge"
   - Sauvegarder

### Option 3 : Utiliser une Adresse Email Dédiée (Recommandé)

Créez une nouvelle adresse Gmail **spécifique pour le jeu** :

1. **Créer un compte Gmail**
   - Aller sur https://accounts.google.com/signup
   - Nom : `Jeu Bleu Rouge`
   - Adresse : `jeubleuerouge@gmail.com` (ou similaire)

2. **Configurer les variables d'environnement**
   ```env
   EMAIL_USER=jeubleuerouge@gmail.com
   EMAIL_PASSWORD=<mot_de_passe_app_16_chars>
   ```

3. **Avantages**
   - ✅ Nom d'affichage correct dès le début
   - ✅ Séparation claire (perso vs jeu)
   - ✅ Meilleur pour les statistiques d'envoi
   - ✅ Plus professionnel

---

## 🧪 Tester l'Envoi

Une fois configuré, testez l'envoi :

```bash
curl -X POST https://jeu-bleu-rouge.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "email": "votre.email@test.com",
    "password": "Test123!"
  }'
```

Vérifiez dans votre boîte mail :
- ✅ **Expéditeur** doit afficher : `Jeu Bleu Rouge 🎮 <jeubleuerouge@gmail.com>`
- ❌ **Ne doit PAS afficher** : `Cyprien Dujardin <...>`

---

## 🚀 Déploiement

Si vous utilisez une nouvelle adresse email :

1. **Créer le mot de passe d'application**
   - https://myaccount.google.com/security
   - Validation en 2 étapes → Mots de passe des applications
   - Créer pour "Mail"

2. **Mettre à jour Render**
   - Dashboard Render → Environment
   - Modifier `EMAIL_USER` et `EMAIL_PASSWORD`
   - Sauvegarder (redémarrage automatique)

3. **Tester**
   ```bash
   node test-security.js
   ```

---

## 💡 Bonnes Pratiques

### Pour un Projet Personnel
- Créer une adresse Gmail dédiée : `jeubleuerouge@gmail.com`
- Nom du compte : "Jeu Bleu Rouge"
- Signature : Automatique avec infos du jeu

### Pour un Projet Professionnel
- Utiliser **SendGrid** (100 emails/jour gratuit)
- Ou **Mailgun** (5000 emails/mois gratuit)
- Domaine personnalisé : `no-reply@jeubleuerouge.com`

---

## 📊 Résultat Attendu

### Email Reçu (Boîte de Réception)
```
De: Jeu Bleu Rouge 🎮 <jeubleuerouge@gmail.com>
À: joueur@example.com
Sujet: 🎮 Confirmez votre adresse email - Jeu Bleu Rouge

Bonjour joueur123 ! 👋
Merci de vous être inscrit sur Jeu Bleu Rouge...
```

### Aperçu Mobile
```
Jeu Bleu Rouge 🎮
🎮 Confirmez votre adresse email
Il y a 2 minutes
```

---

## ❓ FAQ

**Q: Le nom s'affiche toujours mal ?**
R: Videz le cache de votre client email (Gmail, Outlook) et attendez 5 minutes.

**Q: Combien d'emails puis-je envoyer avec Gmail ?**
R: 100 emails par jour maximum avec un compte gratuit.

**Q: Les emails vont dans spam ?**
R: Normal pour les tests. En production, utilisez SendGrid + domaine personnalisé.

**Q: Puis-je utiliser une autre adresse que Gmail ?**
R: Oui, modifiez `SMTP_HOST` et `SMTP_PORT` dans les variables d'environnement.

---

✅ **Maintenant, les emails seront envoyés avec le bon nom d'affichage !**

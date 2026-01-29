# 📧 Configuration de l'envoi d'emails

## Configuration pour Gmail

1. **Créer un mot de passe d'application Gmail :**
   - Allez sur https://myaccount.google.com/security
   - Activez la validation en 2 étapes si ce n'est pas déjà fait
   - Recherchez "Mots de passe des applications"
   - Sélectionnez "Autre" et donnez un nom (ex: "Jeu Bleu Rouge")
   - Copiez le mot de passe généré (16 caractères)

2. **Configurer les variables d'environnement :**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=votre.email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   APP_URL=https://jeu-bleu-rouge.onrender.com
   ```

## Configuration sur Render

Dans Render, ajoutez ces variables d'environnement :
- `EMAIL_SERVICE` = `gmail`
- `EMAIL_USER` = `votre.email@gmail.com`
- `EMAIL_PASSWORD` = `votre_mot_de_passe_application_gmail`
- `APP_URL` = `https://votre-app.onrender.com`

## Autres fournisseurs d'email

### SendGrid (gratuit jusqu'à 100 emails/jour)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=votre_api_key_sendgrid
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
EMAIL_USER=postmaster@votre-domaine.mailgun.org
EMAIL_PASSWORD=votre_mot_de_passe_mailgun
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
EMAIL_USER=votre.email@outlook.com
EMAIL_PASSWORD=votre_mot_de_passe
```

## Test en local

Pour tester sans configurer d'email (mode développement), les emails ne seront pas envoyés mais les comptes fonctionneront quand même.

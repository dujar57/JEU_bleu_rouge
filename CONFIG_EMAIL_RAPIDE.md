# 📧 Configuration Email - GUIDE RAPIDE

## 🚀 Configuration en 5 minutes

### Étape 1 : Gmail - Créer un mot de passe d'application

1. **Activer la validation en 2 étapes** :
   - https://myaccount.google.com/security
   - Cliquez sur "Validation en deux étapes" → Activer

2. **Créer un mot de passe d'application** :
   - Restez sur https://myaccount.google.com/security
   - Cherchez "Mots de passe des applications"
   - Nom : `Jeu Bleu Rouge`
   - **Copiez le mot de passe 16 caractères SANS espaces**
   - Exemple : `abcd efgh ijkl mnop` → `abcdefghijklmnop`

### Étape 2 : Render - Ajouter les variables

Sur https://dashboard.render.com → votre service → **Environment** :

| Variable | Valeur |
|----------|--------|
| `EMAIL_SERVICE` | `gmail` |
| `EMAIL_USER` | `votre.email@gmail.com` |
| `EMAIL_PASSWORD` | Le mot de passe 16 caractères |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `APP_URL` | `https://jeu-bleu-rouge.onrender.com` |

Puis **Save Changes** → Render redéploie automatiquement (2-3 min)

### Étape 3 : Déployer sur Render

Le code est déjà activé ! Il suffit de push :

```bash
git add .
git commit -m "Activation emails de vérification"
git push origin main
```

### Étape 4 : Tester

1. Inscription avec votre vrai email
2. Vérifiez votre boîte mail (ou SPAM)
3. Cliquez sur le lien dans l'email
4. Connectez-vous !

---

## ✅ Ce qui a été modifié

- ✅ Service email activé dans [routes/auth.js](routes/auth.js)
- ✅ Envoi automatique d'email lors de l'inscription
- ✅ Vérification obligatoire avant connexion
- ✅ Email de bienvenue après validation
- ✅ Possibilité de renvoyer l'email

---

## 🔍 Vérifier que ça marche

### Dans les logs Render :

Après une inscription, vous devriez voir :
```
📧 Email de vérification envoyé à user@email.com
✅ Email de vérification envoyé à user@email.com
```

### Si problème :

1. **Vérifiez les variables** sur Render → Environment
2. **Recréez le mot de passe** d'application Gmail
3. **Vérifiez les logs** Render pour voir l'erreur exacte

---

## 📖 Guide Complet

Pour plus de détails : [CONFIGURATION_EMAIL_COMPLETE.md](CONFIGURATION_EMAIL_COMPLETE.md)

---

Prêt à déployer ! 🚀

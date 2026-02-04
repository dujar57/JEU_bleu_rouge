# ⚡ Guide de configuration rapide - Sécurité

## 🚀 Pour déployer en production

### 1. Générer un JWT_SECRET

```bash
node generate-jwt-secret.js
```

### 2. Configurer Render.com

Allez sur [Render Dashboard](https://dashboard.render.com) → Votre service → **Environment**

Ajoutez ces variables :

| Variable | Valeur | Obligatoire |
|----------|--------|-------------|
| `JWT_SECRET` | *Généré par le script* | ✅ OUI |
| `MONGODB_URI` | `mongodb+srv://...` | ✅ OUI |
| `APP_URL` | `https://jeu-bleu-rouge.onrender.com` | ✅ OUI |
| `EMAIL_USER` | Votre email Gmail | ❌ Non |
| `EMAIL_PASSWORD` | App Password Gmail | ❌ Non |

### 3. MongoDB Atlas

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un cluster gratuit
3. Database Access → Add user (username + password fort)
4. Network Access → Add IP → `0.0.0.0/0` (ou IP Render)
5. Clusters → Connect → Connect your application → Copiez l'URI

```
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/jeu_bleu_rouge
```

### 4. Email (optionnel)

Pour Gmail :
1. Activez la 2FA sur votre compte
2. Générez un "App Password" : [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Utilisez ce mot de passe dans `EMAIL_PASSWORD`

---

## 🔒 Sécurité activée

✅ **Rate Limiting** - 5 tentatives de connexion/15min  
✅ **CORS** - Uniquement domaines autorisés  
✅ **Helmet** - Headers HTTP sécurisés  
✅ **Validation** - Tous les inputs validés  
✅ **JWT** - Tokens avec expiration  
✅ **Bcrypt** - Mots de passe hashés  
✅ **NoSQL Injection** - Protection active

---

## ⚠️ Ne JAMAIS commiter

- `.env` - Contient les secrets
- `node_modules/` - Déjà ignoré

Vérifiez votre `.gitignore` contient :
```
.env
.env.local
.env.*.local
node_modules/
```

---

## 📚 Documentation complète

Voir [SECURITE.md](SECURITE.md) pour tous les détails.

---

## 🆘 Problèmes courants

### "JWT_SECRET non configuré"
→ Vous devez définir `JWT_SECRET` dans les variables d'environnement Render

### "Trop de tentatives de connexion"
→ Rate limiting activé. Attendez 15 minutes.

### "Non autorisé par CORS"
→ Vérifiez que votre domaine est dans `allowedOrigins` dans server.js

### "Erreur de connexion MongoDB"
→ Vérifiez que `MONGODB_URI` est correctement configuré et que l'IP est autorisée

---

**🎯 Checklist avant déploiement :**

- [ ] JWT_SECRET généré et configuré sur Render
- [ ] MONGODB_URI configuré sur Render
- [ ] MongoDB Network Access autorise Render
- [ ] APP_URL correspond au domaine de prod
- [ ] Fichier .env local jamais commité
- [ ] `npm audit` ne montre pas de vulnérabilités critiques

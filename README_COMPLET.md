# 🎮 Jeu Bleu vs Rouge

Un jeu multijoueur en temps réel d'infiltration et de stratégie.

## 🌐 Application en Production

**URL unique** : https://jeu-bleu-rouge.onrender.com

L'application complète (client + serveur) est hébergée sur cette URL.

## 🚀 Déploiement Rapide

```powershell
.\deploy-to-render.ps1 "Votre message de commit"
```

Ce script :
1. ✅ Construit le client React
2. ✅ Ajoute les fichiers à Git
3. ✅ Crée un commit
4. ✅ Push vers GitHub
5. ✅ Render déploie automatiquement

## 📦 Installation Locale

### Prérequis
- Node.js 18+
- npm
- MongoDB Atlas (compte gratuit)

### Configuration

1. **Cloner le projet**
```bash
git clone <votre-repo>
cd JeuBleuRouge
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**

Créez un fichier `.env` :
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=votre_secret_tres_long_et_securise
NODE_ENV=development
EMAIL_USER=votre@email.com
EMAIL_PASSWORD=votre_mot_de_passe
```

4. **Générer un JWT_SECRET sécurisé**
```bash
node generate-jwt-secret.js
```

### Développement Local

```bash
# Terminal 1 : Serveur Node.js
npm run dev

# Terminal 2 : Client React
cd client
npm run dev
```

- Serveur : http://localhost:3000
- Client : http://localhost:5173

### Production Locale

```bash
# Construire le client
npm run build

# Lancer le serveur (sert le client construit)
npm start
```

Puis ouvrir : http://localhost:3000

## 🏗️ Structure du Projet

```
JeuBleuRouge/
├── client/                 # Application React (Vite)
│   ├── src/
│   │   ├── components/     # Composants React
│   │   │   ├── Home.jsx
│   │   │   ├── Lobby.jsx
│   │   │   ├── Game.jsx
│   │   │   └── GameEnded.jsx
│   │   ├── App.jsx
│   │   └── index.css       # Styles vintage
│   ├── dist/               # Build production (généré)
│   └── package.json
├── routes/                 # Routes Express
│   ├── auth.js            # Authentification
│   └── game.js            # Gestion des parties
├── models/                 # Modèles MongoDB
│   ├── User.js
│   └── Game.js
├── utils/                  # Utilitaires
│   ├── socketValidation.js
│   ├── emailService.js
│   └── gameCleanup.js
├── server.js              # Serveur principal
├── package.json
└── .env                   # Variables (ne pas commit)
```

## 🔐 Sécurité

L'application implémente :

- ✅ **Helmet.js** : Protection HTTP headers
- ✅ **Rate Limiting** : 100 req/15min (global), 5 req/15min (auth)
- ✅ **CORS sécurisé** : Origines autorisées uniquement
- ✅ **Input Validation** : express-validator + validation personnalisée
- ✅ **XSS Protection** : Nettoyage automatique des entrées
- ✅ **NoSQL Injection** : express-mongo-sanitize
- ✅ **JWT** : Authentification avec expiration 7 jours
- ✅ **bcrypt** : Hash des mots de passe (10 rounds)

Voir [SECURITE.md](SECURITE.md) pour plus de détails.

## 🎨 Technologies

### Frontend
- **React 18** : Interface utilisateur
- **Vite** : Build tool rapide
- **Socket.io Client** : Communication temps réel
- **CSS personnalisé** : Style vintage (Special Elite, Courier Prime)

### Backend
- **Node.js + Express** : Serveur API
- **Socket.io** : WebSockets temps réel
- **MongoDB + Mongoose** : Base de données
- **JWT** : Authentification
- **bcrypt** : Cryptage des mots de passe

## 🎯 Fonctionnalités

### Authentification
- ✅ Inscription avec validation email
- ✅ Connexion sécurisée
- ✅ Gestion du profil
- ✅ Historique des parties

### Jeu
- ✅ Création de partie avec code unique
- ✅ Lobby avec liste des joueurs
- ✅ Attribution automatique des rôles (Bleu/Rouge/Traître)
- ✅ Timer personnalisable
- ✅ Système de votes
- ✅ Chat en temps réel
- ✅ Fin de partie avec statistiques

## 📝 Commandes Utiles

```bash
# Développement
npm run dev              # Serveur avec nodemon
cd client && npm run dev # Client React

# Production
npm run build            # Construire le client
npm start                # Démarrer le serveur

# Déploiement
.\deploy-to-render.ps1 "Message"  # Déployer sur Render

# Utilitaires
node generate-jwt-secret.js      # Générer JWT secret
.\generate-cert.ps1               # Certificat SSL local
```

## 🐛 Dépannage

### Client ne se charge pas
```bash
npm run build
# Vérifier que client/dist/ existe
```

### Port 3000 déjà utilisé
```powershell
$p = Get-NetTCPConnection -LocalPort 3000 | Select -Expand OwningProcess
Stop-Process -Id $p -Force
```

### Erreur MongoDB
- Vérifier `MONGODB_URI` dans `.env`
- Whitelist IP sur MongoDB Atlas (0.0.0.0/0)
- Vérifier les credentials

### Socket.io ne connecte pas
- Vérifier l'URL dans `client/src/App.jsx`
- Vérifier CORS dans `server.js`
- Ouvrir la console navigateur (F12)

## 📚 Documentation

- [DEPLOIEMENT_RENDER.md](DEPLOIEMENT_RENDER.md) : Guide complet de déploiement
- [SECURITE.md](SECURITE.md) : Détails sur la sécurité
- [TRAITRES_EXPLICATION.md](TRAITRES_EXPLICATION.md) : Mécaniques de jeu

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add: Amazing feature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

ISC

## 🌟 Support

Pour toute question ou problème :
1. Vérifier la documentation dans `/docs`
2. Consulter les logs Render
3. Ouvrir une issue sur GitHub

---

**Fait avec ❤️ et Node.js**

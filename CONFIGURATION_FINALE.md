# ✅ Configuration Complète - Jeu Bleu Rouge

## 🎯 Configuration Actuelle

### URL de Production
**Une seule URL pour tout** : `https://jeu-bleu-rouge.onrender.com`

- ✅ Client React servi depuis cette URL
- ✅ API serveur accessible sur cette URL
- ✅ Socket.io connecté à cette URL
- ✅ Aucun domaine séparé nécessaire

### Architecture

```
┌─────────────────────────────────────────┐
│  https://jeu-bleu-rouge.onrender.com   │
├─────────────────────────────────────────┤
│                                         │
│  📱 Client React (client/dist/)        │
│      ↕️ Socket.io                       │
│  🖥️  Serveur Node.js (server.js)       │
│      ↕️                                 │
│  💾 MongoDB Atlas                       │
│                                         │
└─────────────────────────────────────────┘
```

## 📁 Fichiers Modifiés

### 1. client/src/App.jsx
```javascript
// Avant (développement)
const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000'
  : 'https://jeu-bleu-rouge.onrender.com';

// Après (production uniquement)
const SOCKET_URL = 'https://jeu-bleu-rouge.onrender.com';
```

### 2. server.js
```javascript
// Servir le client React depuis client/dist/
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Route principale redirige vers React
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});
```

### 3. package.json
```json
{
  "scripts": {
    "build": "cd client && npm install && npm run build",
    "deploy": "npm run build && git add -A && git commit -m 'Build' && git push"
  }
}
```

### 4. render.yaml
```yaml
buildCommand: npm install && npm run build
startCommand: npm start
```

## 🚀 Processus de Déploiement

### Méthode 1 : Script Automatique
```powershell
.\deploy-to-render.ps1 "Mon message de commit"
```

### Méthode 2 : Manuel
```bash
# 1. Construire
npm run build

# 2. Vérifier
ls client/dist/

# 3. Commit
git add -A
git commit -m "Deploy: Build client"
git push

# 4. Render déploie automatiquement
```

## 🔍 Vérifications

### ✅ Build Client
```bash
npm run build
# Doit créer: client/dist/index.html
# Doit créer: client/dist/assets/
```

### ✅ Test Local
```bash
npm start
# Ouvrir: http://localhost:3000
# Doit afficher l'app React
```

### ✅ Socket.io
Ouvrir la console du navigateur (F12) :
```
🔌 Connexion Socket.io vers: https://jeu-bleu-rouge.onrender.com
✅ Socket connecté avec ID: xxxxx
```

## 📊 Résultat Attendu

### Sur Render
1. Build : ~2-3 minutes
2. Logs : "🟢 Serveur lancé sur le port 3000"
3. Status : "Live" (vert)

### Sur l'Application
1. Accès : https://jeu-bleu-rouge.onrender.com
2. Interface : Application React avec style vintage
3. Console : Socket.io connecté
4. Fonctionnel : Création/Rejoindre partie

## 🐛 Problèmes Courants

### Client ne se charge pas
**Cause** : Build non fait avant deploy
**Solution** :
```bash
npm run build
git add client/dist/
git commit -m "Add build"
git push
```

### Socket.io erreur CORS
**Cause** : URL non autorisée dans server.js
**Solution** : Vérifier `allowedOrigins` inclut Render

### 404 sur routes React
**Cause** : Serveur ne redirige pas vers index.html
**Solution** : Déjà corrigé dans server.js

## 📝 Checklist Finale

- [x] Client construit dans `client/dist/`
- [x] Server.js sert les fichiers statiques
- [x] Socket URL pointe vers Render
- [x] CORS autorise l'origine Render
- [x] render.yaml avec commande build
- [x] Script deploy-to-render.ps1 créé
- [x] README mis à jour
- [x] .gitignore exclut .env
- [x] Variables d'environnement sur Render

## 🎉 C'est Prêt !

L'application est configurée pour fonctionner entièrement sur :
**https://jeu-bleu-rouge.onrender.com**

Aucune configuration supplémentaire nécessaire.

---

**Date de configuration** : 5 février 2026
**Version** : 1.0.0

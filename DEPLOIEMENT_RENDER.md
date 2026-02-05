# 🚀 Guide de Déploiement sur Render

## Architecture de l'Application

L'application est configurée pour fonctionner entièrement sur **https://jeu-bleu-rouge.onrender.com**

- Le serveur Node.js sert à la fois l'API et le client React
- Le client React est construit et servi en tant que fichiers statiques
- Socket.io fonctionne sur la même URL (pas de domaine séparé)

## Déploiement Automatique

### 1. Construction du Client

```bash
npm run build
```

Cette commande :
- Installe les dépendances du client
- Construit le client React dans `client/dist/`
- Prépare les fichiers pour la production

### 2. Commit et Push

```bash
git add -A
git commit -m "Update: Build client for production"
git push
```

Render détectera automatiquement le push et redéploiera l'application.

### 3. Vérification du Déploiement

1. Allez sur https://dashboard.render.com
2. Sélectionnez votre service "jeu-bleu-rouge"
3. Vérifiez les logs de déploiement
4. Attendez que le statut passe à "Live"
5. Testez sur https://jeu-bleu-rouge.onrender.com

## Configuration Render

Le fichier `render.yaml` contient :

```yaml
services:
  - type: web
    name: jeu-bleu-rouge
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
```

## Variables d'Environnement Requises

Dans le dashboard Render, configurez :

- `MONGODB_URI` : Connexion MongoDB Atlas
- `JWT_SECRET` : Clé secrète pour JWT (générer avec `node generate-jwt-secret.js`)
- `NODE_ENV` : `production`
- `EMAIL_USER` : Email pour l'envoi de notifications (optionnel)
- `EMAIL_PASSWORD` : Mot de passe email (optionnel)

## Résolution de Problèmes

### Le client ne se charge pas

1. Vérifiez que `client/dist/` existe localement
2. Exécutez `npm run build` avant de commit
3. Vérifiez les logs Render pour les erreurs de build

### Socket.io ne se connecte pas

1. Vérifiez que `SOCKET_URL` dans `client/src/App.jsx` pointe vers `https://jeu-bleu-rouge.onrender.com`
2. Vérifiez les CORS dans `server.js` (allowedOrigins)
3. Testez la connexion dans la console du navigateur

### Erreurs MongoDB

1. Vérifiez que `MONGODB_URI` est défini dans Render
2. Vérifiez que votre IP est whitelistée sur MongoDB Atlas (0.0.0.0/0 pour tous)
3. Vérifiez les credentials MongoDB

## Structure des Fichiers

```
JeuBleuRouge/
├── client/                 # Application React
│   ├── src/               # Code source React
│   ├── dist/              # Build de production (généré)
│   └── package.json
├── server.js              # Serveur Node.js/Express/Socket.io
├── package.json           # Dépendances serveur
├── render.yaml            # Configuration Render
└── .env                   # Variables locales (ne pas commit)
```

## Commandes Utiles

```bash
# Développement local
npm run dev                # Serveur Node.js avec nodemon
cd client && npm run dev   # Client React avec Vite

# Production locale
npm run build              # Construire le client
npm start                  # Démarrer le serveur (sert le client construit)

# Déploiement
npm run deploy             # Build + commit + push (automatique)
```

## URL de Production

**Application complète** : https://jeu-bleu-rouge.onrender.com

Le client React et l'API Node.js sont tous les deux accessibles sur cette URL unique.

## Notes Importantes

- Le premier démarrage peut prendre 50 secondes (cold start Render gratuit)
- Les instances gratuites s'endorment après 15 min d'inactivité
- Les WebSockets (Socket.io) fonctionnent correctement sur Render
- Pas besoin de domaine séparé pour le client

## Support

En cas de problème, vérifiez :
1. Les logs Render (Dashboard → Service → Logs)
2. La console du navigateur (F12)
3. La configuration des variables d'environnement

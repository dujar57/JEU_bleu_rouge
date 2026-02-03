# 🔤 Configuration UTF-8 Complète

## ✅ Modifications effectuées

### 📄 Fichiers HTML (déjà configurés)
Tous les fichiers HTML ont les balises suivantes :
```html
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
```

**Fichiers concernés :**
- ✅ `client/index.html`
- ✅ `public/index.html`
- ✅ `public/login.html`
- ✅ `public/register.html`
- ✅ `public/verify-email.html`
- ✅ `public/loading.html`
- ✅ `public/app.html`

### 🎨 Fichiers CSS
Tous les fichiers CSS ont la directive `@charset "UTF-8";` :
- ✅ `public/style.css`
- ✅ `public/space-effects.css`
- ✅ `client/src/index.css`

### 📜 Fichiers JavaScript/JSX
Tous les fichiers JS/JSX ont maintenant les commentaires UTF-8 :
```javascript
// -*- coding: utf-8 -*-
// @charset "UTF-8"
```

**Fichiers concernés :**
- ✅ `server.js`
- ✅ `public/app.js`
- ✅ `public/auth-ui.js`
- ✅ `public/space-effects.js`
- ✅ `client/src/main.jsx`
- ✅ `client/src/App.jsx`
- ✅ `client/src/components/Home.jsx`
- ✅ `client/src/components/Game.jsx`
- ✅ `client/src/components/Lobby.jsx`
- ✅ `client/src/components/GameEnded.jsx`

### ⚙️ Configuration serveur
Le fichier `server.js` contient déjà un middleware qui force l'UTF-8 pour toutes les réponses :
```javascript
app.use((req, res, next) => {
  const origSetHeader = res.setHeader.bind(res);
  res.setHeader = function(name, value) {
    if (typeof name === 'string' && name.toLowerCase() === 'content-type') {
      if (typeof value === 'string' && !/charset=/i.test(value)) {
        const needsCharset = /^(text\/|application\/json|application\/javascript|application\/xml)/i.test(value);
        if (needsCharset) {
          value = value + '; charset=utf-8';
        }
      }
    }
    return origSetHeader(name, value);
  };
  next();
});
```

### 🔧 Configuration Vite
Le fichier `client/vite.config.js` envoie maintenant des headers UTF-8 :
```javascript
server: {
  port: 5173,
  headers: {
    'Content-Type': 'text/html; charset=UTF-8'
  }
}
```

### 📦 Scripts NPM
Nouveaux scripts dans `package.json` :
```json
"dev:utf8": "chcp 65001 && nodemon server.js",
"start:utf8": "chcp 65001 && node server.js"
```

### 🛠️ Nouveaux fichiers de configuration

#### 1. `.gitattributes`
Force l'UTF-8 dans Git pour tous les fichiers texte.

#### 2. `.vscode/settings.json`
Force l'UTF-8 dans VS Code pour tous les types de fichiers.

#### 3. `set-utf8.ps1`
Script PowerShell pour forcer l'UTF-8 dans le terminal.

## 🚀 Utilisation

### Pour démarrer le serveur avec UTF-8 garanti :
```powershell
# Configurer le terminal (une fois)
.\set-utf8.ps1

# Puis démarrer
npm run dev:utf8
# ou
npm run start:utf8
```

### Pour le client (Vite) :
```powershell
cd client
npm run dev
```
Le client utilise déjà UTF-8 par défaut via la configuration Vite.

## 📋 Checklist UTF-8

- ✅ Balises meta UTF-8 dans tous les HTML
- ✅ @charset dans tous les CSS
- ✅ Commentaires UTF-8 dans tous les JS/JSX
- ✅ Middleware serveur pour headers HTTP
- ✅ Configuration Vite pour le client
- ✅ Scripts NPM avec chcp 65001
- ✅ .gitattributes pour Git
- ✅ .vscode/settings.json pour VS Code
- ✅ Script PowerShell set-utf8.ps1

## 🎯 Résultat

Tous les fichiers liés au visuel sont maintenant configurés pour utiliser UTF-8 :
- **Encodage déclaré** dans les fichiers sources
- **Headers HTTP** configurés
- **Environnement de développement** configuré
- **Système de contrôle de version** configuré

Les caractères spéciaux (émojis, accents, symboles) devraient maintenant s'afficher correctement partout ! 🎉

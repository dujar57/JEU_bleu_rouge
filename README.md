# Jeu Bleu vs Rouge - Production

## 🌐 Site en ligne

**URL de production :** https://jeu-bleu-rouge.onrender.com

## Installation locale (développement uniquement)

### 1. Serveur (Backend)
```bash
cd JeuBleuRouge
npm install
npm run dev
```

### 2. Client (Frontend)
Ouvre un **nouveau terminal** :
```bash
cd client
npm install
npm run dev
```

## Ce qui fonctionne actuellement

✅ **Phase 1 - Serveur**
- Serveur Socket.io opérationnel
- Structure de données en mémoire
- Gestion des connexions

✅ **Phase 2 - Lobby**
- Création de partie (génération code 4 lettres)
- Rejoindre une partie existante
- Liste des joueurs en temps réel
- Lancement de partie (minimum 4 joueurs)

✅ **Phase 3 (Bonus)** 
- Attribution automatique des rôles (Bleu/Rouge)
- Répartition : Représentant, Tueur, Lambda
- Envoi secret du rôle à chaque joueur

✅ **Encodage UTF-8**
- Support complet des caractères spéciaux
- Accents et émojis fonctionnels

## Prochaines étapes

🔜 **Phase 4** - Gestion du temps et votes
🔜 **Phase 5** - Mécaniques spéciales (Tueur & Chaos)
🔜 **Phase 6** - Base de données MongoDB

## Structure du projet

```
JeuBleuRouge/
├── server.js          # Serveur Socket.io
├── package.json
└── client/
    ├── src/
    │   ├── App.jsx            # Logique principale
    │   ├── components/
    │   │   ├── Home.jsx       # Écran d'accueil
    │   │   ├── Lobby.jsx      # Salle d'attente
    │   │   └── Game.jsx       # Partie en cours
    │   └── index.css
    └── package.json
```

## Comment tester

1. Ouvre https://jeu-bleu-rouge.onrender.com dans **plusieurs onglets** (ou navigateurs)
2. Premier joueur : "Créer une partie"
3. Autres joueurs : "Rejoindre" avec le code affiché
4. Quand 4+ joueurs : clic sur "Lancer la partie"
5. Chaque joueur voit son rôle secret !

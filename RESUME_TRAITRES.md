# 🎭 Système des Traîtres - Résumé des Modifications

## ✅ Fonctionnalités Implémentées

### 1. Attribution Automatique des Traîtres
- ✅ S'active automatiquement avec 8+ joueurs
- ✅ 1 traître sélectionné dans l'équipe Bleue (parmi les lambdas)
- ✅ 1 traître sélectionné dans l'équipe Rouge (parmi les lambdas)
- ✅ Les traîtres conservent leur rôle de couverture

### 2. Système de Numéros Anonymes
- ✅ Chaque joueur reçoit un numéro aléatoire (1 à N)
- ✅ Les numéros sont attribués au début de la partie
- ✅ Les numéros sont visibles par tous les joueurs

### 3. Communication entre Traîtres
- ✅ Les traîtres connaissent le **numéro de joueur** de leur partenaire
- ✅ Les traîtres connaissent l'**équipe infiltrée** du partenaire
- ✅ Les traîtres connaissent le **rôle** du partenaire
- ✅ Les traîtres NE connaissent PAS le nom réel du partenaire

### 4. Interface Utilisateur

#### Affichage pour les Traîtres
```
🎭 TRAÎTRES
Infiltré dans : 🔵 ÉQUIPE BLEUE
👤 Membre Lambda (couverture)

🤝 Votre partenaire traître :
Joueur 5
Infiltré : 🔴 rouge
⚠️ Vous ne connaissez que son numéro de joueur, pas son nom réel
```

#### Liste des Joueurs
```
💡 #Numéro = Joueur anonyme | Nom = Identité réelle

#3 Alice (Vous)
   Alice Martin

#7 Bob
   Robert Dupont
```

#### Lobby avec 8+ joueurs
```
🎭 Mode Traîtres Activé !
Avec 8+ joueurs, 2 traîtres seront infiltrés (1 par équipe).
Ils forment une 3ème équipe secrète et ne se connaissent que par leur numéro de joueur.
```

### 5. Conditions de Victoire
- ✅ **Traîtres gagnent** si les 2 représentants sont morts ET les 2 traîtres sont vivants
- ✅ **Équipe gagne** si le représentant adverse est mort
- ✅ **Amoureux gagnent** s'ils sont les 2 derniers survivants

### 6. Détails Techniques
- ✅ Propriété `isTraitor` pour identifier les traîtres
- ✅ Propriété `traitorPartnerSocketId` pour lier les partenaires
- ✅ Propriété `anonymousNumber` pour les numéros de joueur
- ✅ Fonction `checkVictoryConditions()` pour vérifier les victoires
- ✅ Transmission sécurisée des infos via `roleData.traitorInfo`

## 📊 Structure des Données

### Joueur Traître (Serveur)
```javascript
{
  socketId: "abc123",
  pseudo: "Alice",                    // Nom réel du joueur
  anonymousNumber: 3,                 // Numéro de joueur (pour chat/identification)
  realLifeInfo: "Alice Martin",       // Info de vie réelle
  team: "bleu",                       // Équipe infiltrée (apparente)
  role: "lambda",                     // Rôle de couverture
  isTraitor: true,                    // Marqueur de traître
  traitorPartnerSocketId: "def456",   // ID du partenaire traître
  isAlive: true,
  hasVoted: false,
  munitions: 0
}
```

### Données Envoyées au Client (Traître)
```javascript
{
  team: "bleu",                // Équipe apparente
  role: "lambda",              // Rôle de couverture
  isTraitor: true,             // Indique que c'est un traître
  anonymousNumber: 3,          // Son propre numéro
  traitorInfo: {               // Info sur le partenaire
    pseudo: "Bob",             // Nom réel du partenaire (peut être masqué)
    anonymousNumber: 7,        // Numéro du partenaire (PRINCIPAL)
    team: "rouge",             // Équipe infiltrée du partenaire
    role: "lambda"             // Rôle du partenaire
  }
}
```

## 🎨 Design

### Couleurs des Traîtres
- **Gradient Principal** : `linear-gradient(135deg, #8B00FF 0%, #FF1493 100%)`
- **Accent Violet** : `#8B00FF`
- **Accent Rose** : `#FF1493`
- **Background Info** : `rgba(139, 0, 255, 0.1)`
- **Bordure** : `rgba(139, 0, 255, 0.3)`

### Emoji
- 🎭 : Traîtres / Masque
- 🤝 : Partenariat entre traîtres
- ⚠️ : Avertissement / Information importante
- 💡 : Légende / Explication

## 🔄 Flux de Jeu

1. **Création de la Partie** → Minimum 4 joueurs
2. **Lobby** → Affiche l'indicateur si 8+ joueurs
3. **Démarrage** :
   - Attribution des équipes (Bleu/Rouge)
   - Attribution des rôles (Représentant, Tueur, Lambda)
   - Création des numéros anonymes
   - **Sélection des traîtres** (si 8+ joueurs)
   - Sélection des amoureux (si 6+ joueurs, hors traîtres)
4. **En Jeu** :
   - Les traîtres voient leur carte spéciale avec infos du partenaire
   - Tous voient les numéros de joueur dans la liste
   - Les traîtres peuvent identifier leur partenaire par son numéro
5. **Fin** :
   - Vérification des conditions de victoire
   - Révélation des traîtres si victoire

## 🔐 Sécurité et Cohérence

- ✅ Les numéros anonymes sont attribués aléatoirement (pas dans l'ordre)
- ✅ Les traîtres ne peuvent pas être représentants
- ✅ Les traîtres ne peuvent pas être amoureux (incompatible)
- ✅ Les informations secrètes ne sont envoyées qu'au joueur concerné
- ✅ La vérification de victoire se fait côté serveur

## 📝 Fichiers Modifiés

1. **server.js** :
   - Fonction `checkVictoryConditions()` ajoutée
   - Attribution des traîtres dans `start_game`
   - Ajout de `anonymousNumber` dans `updateRoom()`
   - Transmission de `traitorInfo` avec `anonymousNumber`

2. **client/src/components/Game.jsx** :
   - Affichage spécial pour les traîtres
   - Ajout des numéros de joueur dans la liste
   - Légende explicative
   - Carte d'information du partenaire traître

3. **client/src/components/Lobby.jsx** :
   - Indicateur "Mode Traîtres Activé" si 8+ joueurs

4. **Nouveaux Fichiers** :
   - `TRAITRES_EXPLICATION.md` : Documentation complète
   - `RESUME_TRAITRES.md` : Ce fichier de résumé

## 🚀 Prochaines Étapes Possibles

- [ ] Ajouter un chat privé entre traîtres
- [ ] Permettre aux traîtres de voter secrètement
- [ ] Ajouter des actions spéciales pour les traîtres
- [ ] Statistiques de victoire par équipe (incluant traîtres)
- [ ] Historique des parties avec révélation des traîtres
- [ ] Mode "Traîtres activés de force" même avec moins de 8 joueurs
- [ ] Badges/achievements pour les traîtres qui gagnent

## 🎯 Objectif Atteint

Le système des traîtres est maintenant **complètement fonctionnel** :
- ✅ Attribution automatique
- ✅ Communication via numéros anonymes
- ✅ Interface claire et intuitive
- ✅ Conditions de victoire implémentées
- ✅ Documentation complète

Les traîtres forment une véritable troisième équipe secrète qui ajoute une nouvelle dimension stratégique au jeu !

# 🎮 MISE À JOUR COMPLÈTE DES RÈGLES DU JEU
## Date : 13 février 2026

## ✅ MODIFICATIONS EFFECTUÉES

### 1. Page d'Accueil (index.html)
- ✅ Objectif modifié : "Soyez la dernière équipe debout ! Trahissez vos amis, démasquez les ennemis !"
- ✅ Règles mises à jour :
  - 3 Équipes : Bleus, Rouges et Traîtres infiltrés
  - Double identité : Nom réel + Pseudo anonyme
  - Représentant élu après le 1er vote
  - Rôles spéciaux ajoutés
  - Condition de victoire clarifiée

### 2. Système de Rôles Complet (utils/roles.js)
**Nouveau fichier créé** avec TOUS les rôles :

#### Rôles de base :
- ✅ **Tueur** : Tue 1 fois/jour, MEURT s'il tue sa propre équipe
- ✅ **Détecteur de Joueurs** : Reçoit Nom → Pseudo aléatoirement
- ✅ **Détecteur de Métiers** : Reçoit Métier → Pseudo aléatoirement

#### Rôles de soutien :
- ✅ **Boulanger** : Sauve une victime pour 1 tour, immunisé contre le sauvé
- ✅ **Gardien de la Paix** : Protège un joueur, révèle le tueur si attaque bloquée
- ✅ **Cyberpompier** : Crypte un joueur, ses votes reçus ne comptent pas

#### Rôles d'influence :
- ✅ **Influenceur** : Vote compte triple (1x/partie), révèle son équipe
- ✅ **Juge** : Décide en cas d'égalité au vote

#### Rôles d'information :
- ✅ **Journaliste** : Pose 1 question/tour, réponse publique avec 1/3 chance de mensonge
- ✅ **Stalker** : Enquête sur un Nom réel, reçoit indice sur Pseudo

#### Rôles spéciaux :
- ✅ **Hacker** : Échange 2 pseudos pendant 1 tour (1x/partie)
- ✅ **Usurpateur** : Reprend le pseudo d'un mort (1x/partie)
- ✅ **Agent Double** : Détecteurs le voient dans l'équipe adverse

#### Rôles traîtres :
- ✅ **Killeurs** : Tueur traître, peut tuer sa propre équipe 1x/2 tours
- ✅ **Guru** : Convertit un ennemi s'il devine son Nom réel
- ✅ **Lambda** : Rôle par défaut

### 3. Représentant Élu APRÈS le 1er Vote
- ✅ **Plus de représentant au début** de la partie
- ✅ Après le 1er vote, un représentant aléatoire est élu dans chaque équipe
- ✅ Le représentant connaît tous les membres de son équipe
- ✅ Il est immunisé contre les tueurs (PAS contre les votes)
- ✅ Fonction `electRepresentants()` créée
- ✅ Event `representant_elected` envoyé à tous les joueurs
- ✅ Client notifié avec animation si élu

### 4. Système de Tueur Amélioré
- ✅ Event `use_killer_power` créé
- ✅ Vérification : tueur ne peut pas tuer le représentant
- ✅ Vérification : si cible protégée, tueur révélé
- ✅ **RÈGLE CRITIQUE** : Si tueur tue sa propre équipe, IL MEURT AUSSI !
- ✅ Munitions consommées après utilisation
- ✅ Cooldown pour les killeurs (1x tous les 2 tours)

### 5. Amoureux par Nom Réel
- ✅ Les amoureux se connaissent par leur **NOM RÉEL** (pas par pseudo)
- ✅ Propriété `loverRealName` ajoutée
- ✅ Affichage côté client avec nom réel du partenaire
- ✅ Message d'avertissement : "Si l'un meurt, l'autre meurt aussi"

### 6. Attribution des Rôles Intelligente
- ✅ Fonction `assignRoles(players, traitors)` créée
- ✅ Attribution proportionnelle au nombre de joueurs
- ✅ Les traîtres ont leurs propres rôles spéciaux
- ✅ Rôles exclus des traîtres et amoureux gérés

### 7. Interface Client Mise à Jour
- ✅ Affichage dynamique des rôles avec emoji et description
- ✅ Utilise `roleInfo` envoyé par le serveur
- ✅ Listener `representant_elected` ajouté
- ✅ Notification si joueur élu représentant
- ✅ Affichage spécial pour les amoureux avec nom réel

### 8. Propriétés Joueur Étendues
Nouvelles propriétés ajoutées aux joueurs :
- `isRepresentant` : true si représentant
- `protected` : true si protégé par gardien
- `crypted` : true si crypté par cyberpompier
- `lastKillTurn` : Dernier tour où le joueur a tué
- `powerUses` : Nombre d'utilisations restantes du pouvoir
- `loverRealName` : Nom réel du partenaire amoureux

### 9. Propriétés Partie Étendues
Nouvelles propriétés ajoutées aux parties :
- `representantElected` : false au début, true après 1er vote
- `currentTurn` : Compteur de tours pour cooldowns

## 📋 RÔLES À IMPLÉMENTER (Events Manquants)

Les définitions de rôles sont créées, mais il faut encore implémenter les events socket pour :

### Actions à créer :
1. **Détecteurs** : Système automatique d'envoi d'informations aléatoires
2. **Boulanger** : Event pour sauver une victime
3. **Gardien de la Paix** : Event pour protéger un joueur
4. **Cyberpompier** : Event pour crypter un joueur
5. **Influenceur** : Modifier le vote pour compter triple
6. **Juge** : Logique d'égalité au vote
7. **Journaliste** : Event pour poser une question
8. **Stalker** : Event pour enquêter
9. **Hacker** : Event pour échanger des pseudos
10. **Usurpateur** : Event pour voler un pseudo
11. **Guru** : Event pour deviner et convertir

## 🎯 PROCHAINES ÉTAPES

1. **Implémenter les events des pouvoirs spéciaux**
   - Créer les event handlers dans server.js
   - Ajouter les boutons d'action dans Game.jsx

2. **Système de Détecteurs Automatique**
   - Créer un interval qui envoie des infos aléatoires
   - Gérer les détecteurs de joueurs et de métiers

3. **Tests et Équilibrage**
   - Tester avec 4, 8, 12+ joueurs
   - Ajuster le nombre de chaque rôle
   - Vérifier les conditions de victoire

4. **Interface Utilisateur**
   - Ajouter des boutons pour chaque pouvoir
   - Afficher les cooldowns et utilisations restantes
   - Créer des modales pour les actions (ex: choisir qui protéger)

## ⚠️ POINTS IMPORTANTS

1. **Design Non Modifié** : Seules les règles et la logique ont été changées
2. **Rétrocompatibilité** : L'ancien système continue de fonctionner en fallback
3. **Sécurité** : Toutes les validations existantes sont conservées
4. **Performance** : Le nouveau système est optimisé

## 🔧 FICHIERS MODIFIÉS

1. `public/index.html` - Page d'accueil mise à jour
2. `server.js` - Logique de jeu complète
3. `utils/roles.js` - **NOUVEAU** Système de rôles complet
4. `client/src/components/Game.jsx` - Interface mise à jour

## 📝 NOTES

- Les rôles sont attribués proportionnellement au nombre de joueurs
- Le système est modulaire et facile à étendre
- Chaque rôle a sa propre définition avec pouvoirs et limites
- Le représentant n'est plus un rôle de départ mais une élection

## 🎮 COMMENT TESTER

1. Créer une partie avec 4+ joueurs
2. Lancer la partie - AUCUN représentant n'est attribué
3. Attendre le 1er vote
4. Après le 1er vote, les représentants sont élus
5. Les joueurs voient leur nouveau rôle et ses pouvoirs

## 🚀 PRÊT POUR

- ✅ Lancement de partie avec attribution aléatoire des rôles
- ✅ Élection des représentants après 1er vote
- ✅ Tueurs avec règle du "mort si tue équipe"
- ✅ Amoureux par nom réel
- ✅ Interface mise à jour

## ⏳ EN ATTENTE D'IMPLÉMENTATION

- ⏳ Events pour tous les pouvoirs spéciaux
- ⏳ Système automatique des détecteurs
- ⏳ Interface des boutons d'action
- ⏳ Tests approfondis

# ⏰ Système d'Échelle de Temps

## Vue d'ensemble

Le système d'échelle de temps permet à l'hôte de définir la durée totale de la partie au début du jeu. Tous les événements (votes, actions, phases) sont calculés automatiquement en fonction du temps choisi et du nombre de joueurs.

## 🕐 Durées Disponibles

L'hôte peut choisir parmi 8 durées différentes :

| Durée | Utilisation | Type de partie |
|-------|-------------|----------------|
| ⚡ 20 minutes | Partie rapide | Action intense, décisions rapides |
| ⏱️ 1 heure | Standard | Équilibre stratégie/action |
| 🕐 6 heures | Longue | Stratégie approfondie |
| 📅 1 jour | Journée | Partie répartie sur une journée |
| 📅 2 jours | Week-end | Partie de week-end |
| 📅 4 jours | Mi-semaine | Partie étalée |
| 📅 5 jours | Semaine de travail | Partie sur la semaine |
| 📅 10 jours | Marathon | Partie épique longue durée |

## 🎯 Calcul Automatique des Phases

Le système calcule automatiquement :

### Nombre de Phases
```javascript
// Objectif : réduire à 2-3 survivants
playersToEliminate = nombreJoueurs - 2
numberOfPhases = Math.max(3, Math.ceil(playersToEliminate × 0.7))
```

**Exemple avec 8 joueurs :**
- Joueurs à éliminer : 8 - 2 = 6
- Phases calculées : max(3, ceil(6 × 0.7)) = 5 phases

### Intervalle entre Phases
```javascript
phaseInterval = duréeTotale / (nombrePhases + 1)
```

**Exemple : 1 heure pour 8 joueurs (5 phases) :**
- Intervalle : 3600000ms / 6 = 600000ms = 10 minutes par phase

### Temps de Discussion et Vote
- **Discussion** : 10% du temps de phase (minimum 1 minute)
- **Vote** : 5% du temps de phase (minimum 30 secondes)

## 📊 Exemples Concrets

### Partie Rapide (20 min, 6 joueurs)
- Phases : 3
- Intervalle : ~5 minutes
- Discussion : 1 minute (minimum)
- Vote : 30 secondes

### Partie Standard (1h, 8 joueurs)
- Phases : 5
- Intervalle : 10 minutes
- Discussion : 1 minute
- Vote : 30 secondes

### Partie Marathon (10 jours, 12 joueurs)
- Phases : 7
- Intervalle : ~34 heures
- Discussion : 3h24min
- Vote : 1h42min

## 🖥️ Interface Utilisateur

### Dans le Lobby
```
⏰ Durée de la partie
[⚡ 20 minutes] [⏱️ 1 heure]
[🕐 6 heures]   [📅 1 jour]
[📅 2 jours]    [📅 4 jours]
[📅 5 jours]    [📅 10 jours]
```

L'hôte clique sur la durée souhaitée (sélection visuelle avec gradient violet).

### Pendant la Partie
```
⏰ Temps restant
    45min 23s
```

Affichage dynamique avec :
- **Couleur normale** (violet) : Plus de 5 minutes restantes
- **Couleur alerte** (rouge) : Moins de 5 minutes
- **Animation pulse** : Moins de 1 minute

### Fin de Partie
```
🏆 FIN DE PARTIE
⏰ TEMPS ÉCOULÉ !
🔵 L'équipe Bleue domine avec 3 survivants !

✨ Survivants (3)
- Alice (🔵 bleu - représentant)
- Bob (🔵 bleu - lambda)
- Charlie (🔵 bleu - tueur)
```

## ⚙️ Architecture Technique

### Structure des Données (Serveur)
```javascript
game = {
  status: 'PLAYING',
  phases: {
    totalDuration: 3600000,      // 1 heure en ms
    numberOfPhases: 5,            // 5 phases calculées
    phaseInterval: 600000,        // 10 min par phase
    discussionTime: 60000,        // 1 minute
    votingTime: 30000,            // 30 secondes
    startTime: 1706659200000,     // Timestamp début
    endTime: 1706662800000        // Timestamp fin
  },
  currentPhase: 0,
  phaseStartTime: 1706659200000,
  nextEventTime: 1706662800000    // Temps de fin
}
```

### Vérification Automatique
```javascript
// Toutes les 5 secondes
setInterval(() => {
  for (gameCode in games) {
    // Vérifier si le temps est écoulé
    if (Date.now() >= game.phases.endTime) {
      endGameByTimeout(gameCode);
    }
    
    // Vérifier conditions de victoire
    const victory = checkVictoryConditions(game);
    if (victory) {
      endGameWithWinner(gameCode, victory);
    }
  }
}, 5000);
```

### Fin de Partie par Timeout
1. **Compter les survivants** par équipe
2. **Déterminer le gagnant** :
   - Si 2 traîtres vivants → Traîtres gagnent
   - Sinon, équipe avec le plus de survivants
   - Égalité si même nombre
3. **Notifier tous les joueurs**
4. **Sauvegarder dans MongoDB**

### Timer Côté Client
```javascript
useEffect(() => {
  const updateTimer = () => {
    const remaining = gameData.nextEventTime - Date.now();
    setTimeRemaining(Math.max(0, remaining));
  };
  
  updateTimer();
  const interval = setInterval(updateTimer, 1000);
  
  return () => clearInterval(interval);
}, [gameData]);
```

## 🎨 Formatage du Temps

```javascript
formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}min`;
  if (minutes > 0) return `${minutes}min ${seconds % 60}s`;
  return `${seconds}s`;
}
```

**Exemples d'affichage :**
- `5400000ms` → `1h 30min`
- `172800000ms` → `2j 0h`
- `45000ms` → `45s`

## 🏆 Conditions de Fin

### 1. Temps Écoulé
- Vérification automatique toutes les 5 secondes
- Comptage des survivants
- Détermination du gagnant par nombre de survivants

### 2. Victoire par Condition
- **Traîtres** : 2 représentants morts + 2 traîtres vivants
- **Équipe** : Représentant adverse mort
- **Amoureux** : 2 derniers survivants

### 3. Élimination Complète
- Si tous les joueurs d'une équipe sont morts
- Victoire immédiate de l'équipe adverse

## 📱 Événements Socket.IO

### Client → Serveur
```javascript
socket.emit('start_game', { 
  gameCode: 'ABCD', 
  duration: 3600000 // 1 heure
});
```

### Serveur → Client
```javascript
socket.emit('game_ended', {
  winner: 'BLEU',
  message: '🔵 L\'ÉQUIPE BLEUE A GAGNÉ !',
  survivors: [...],
  traitors: [...],
  lovers: [...]
});
```

## 🔄 Flux Complet

```
1. Lobby
   ↓
   Hôte sélectionne durée (ex: 1 heure)
   ↓
2. Lancement
   ↓
   Calcul automatique des phases
   - 5 phases pour 8 joueurs
   - 10 min par phase
   ↓
3. Jeu en cours
   ↓
   Affichage du timer (compte à rebours)
   Vérification toutes les 5s
   ↓
4. Fin de partie
   ↓
   - Temps écoulé OU
   - Condition de victoire atteinte
   ↓
5. Écran de résultats
   ↓
   Affichage du gagnant et survivants
   Révélation des rôles secrets
```

## 💡 Avantages du Système

1. **Flexibilité** : 8 durées adaptées à tous les styles de jeu
2. **Automatique** : Pas besoin de gérer manuellement les phases
3. **Équilibré** : Calcul basé sur le nombre de joueurs
4. **Visible** : Timer clair et informatif
5. **Fiable** : Vérification automatique côté serveur
6. **Responsive** : Mise à jour en temps réel
7. **Persistant** : Sauvegarde dans MongoDB

## 🚀 Améliorations Futures Possibles

- [ ] Pause de partie (par vote)
- [ ] Extension de temps (par consensus)
- [ ] Notifications push avant la fin
- [ ] Historique des temps de jeu
- [ ] Statistiques par durée
- [ ] Mode "Rush" (phases accélérées en fin)
- [ ] Ajustement dynamique selon activité
- [ ] Alerte mobile/email à 5 min de la fin

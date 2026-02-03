# 🎭 Système des Traîtres

## Concept

Les **Traîtres** sont une troisième équipe secrète qui infiltre les équipes Rouge et Bleue. Ils forment une alliance cachée et cherchent à gagner ensemble.

## Fonctionnement

### Attribution des Traîtres
- **Condition** : Activé seulement si la partie compte **au moins 8 joueurs**
- **Sélection** : 1 joueur lambda de l'équipe Bleue + 1 joueur lambda de l'équipe Rouge
- Les représentants et tueurs ne peuvent pas être traîtres
- Les traîtres conservent leur rôle de couverture dans leur équipe infiltrée

### Connaissance entre Traîtres

Les traîtres se connaissent uniquement par :
- ✅ **Numéro de joueur anonyme** (ex: "Joueur 3")
- ✅ **Équipe infiltrée** (Bleu ou Rouge)
- ✅ **Rôle de couverture** (Lambda, Tueur, etc.)

Les traîtres NE connaissent PAS :
- ❌ Le **nom réel** de leur partenaire (realLifeInfo)
- ❌ L'identité physique dans la vraie vie

### Distinction Pseudo vs Nom

**Pseudo** (`pseudo`) :
- Numéro automatique assigné : "Joueur 1", "Joueur 2", etc.
- Utilisé dans le chat anonyme
- Visible uniquement par numéro pour les traîtres
- Correspond à `anonymousNumber` dans le code

**Nom réel** (`realLifeInfo`) :
- Le vrai nom ou prénom du joueur
- Affiché dans la liste des joueurs
- Connu de tous les joueurs de la partie

## Conditions de Victoire

### 🎭 Victoire des Traîtres
Les traîtres gagnent si :
1. Les **deux représentants** (Bleu ET Rouge) sont **morts**
2. Les **deux traîtres** sont encore **vivants**

### 🔵🔴 Victoire des Équipes
- Une équipe gagne si le représentant adverse est mort et tous les membres de l'équipe adverse sont éliminés

### 💕 Victoire des Amoureux
- Les amoureux gagnent s'ils sont les 2 derniers survivants

## Hiérarchie des Victoires

1. **Amoureux** (si 2 derniers survivants)
2. **Traîtres** (si conditions remplies)
3. **Équipe Rouge ou Bleue** (représentant adverse mort)

## Stratégie

### Pour les Traîtres
- Rester discrets et ne pas révéler leur alliance
- Saboter subtilement leur équipe apparente
- Protéger leur partenaire traître sans être évidents
- Viser l'élimination des deux représentants
- Communiquer via le chat en utilisant les numéros de joueur

### Pour les Équipes
- Identifier les comportements suspects
- Protéger son représentant
- Observer qui vote contre son propre camp

## Affichage dans le Jeu

### Pour un Traître
```
🎭 TRAÎTRES
Infiltré dans : 🔵 ÉQUIPE BLEUE
👤 Membre Lambda (couverture)

🤝 Votre partenaire traître :
Joueur 5
Infiltré : 🔴 rouge
⚠️ Vous ne connaissez que son numéro de joueur, pas son nom réel
```

### Pour un joueur Normal
```
🔵 ÉQUIPE BLEUE
👤 Membre Lambda
```

## Implémentation Technique

### Propriétés du Joueur
```javascript
{
  socketId: "abc123",
  pseudo: "Alice",              // Nom réel
  anonymousNumber: 3,           // Numéro de joueur (1-N)
  realLifeInfo: "Alice Martin", // Info réelle
  team: "bleu",                 // Équipe apparente
  role: "lambda",               // Rôle de couverture
  isTraitor: true,              // Est un traître
  traitorPartnerSocketId: "def456", // Socket du partenaire
  isAlive: true
}
```

### Données envoyées au Traître
```javascript
roleData = {
  team: "bleu",
  role: "lambda",
  isTraitor: true,
  traitorInfo: {
    anonymousNumber: 7,    // Numéro du partenaire
    team: "rouge",         // Équipe infiltrée du partenaire
    role: "lambda"         // Rôle du partenaire
  }
}
```

## Notes de Développement

- Les numéros anonymes sont assignés aléatoirement au début de la partie
- Le système fonctionne en parallèle avec les amoureux (un joueur ne peut pas être les deux)
- Les traîtres peuvent être tueurs, mais jamais représentants
- L'affichage utilise un gradient violet/rose pour distinguer visuellement les traîtres

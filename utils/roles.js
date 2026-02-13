// -*- coding: utf-8 -*-
// @charset "UTF-8"

/**
 * DÉFINITION DES RÔLES DU JEU
 * Chaque rôle a des propriétés et des pouvoirs spécifiques
 */

const ROLES = {
  // Rôles de base (assignés en priorité)
  tueur: {
    name: 'Tueur',
    emoji: '🔪',
    description: 'Peut tuer 1 fois par jour. ATTENTION: Si vous tuez quelqu\'un de votre équipe, vous mourrez aussi !',
    team: 'both', // Peut être dans les deux équipes
    priority: 1,
    count: 1, // 1 par équipe
    powers: {
      kill: true,
      killsPerDay: 1,
      dieIfKillsTeammate: true
    }
  },
  
  // Détecteurs
  detecteur_joueurs: {
    name: 'Détecteur de Joueurs',
    emoji: '🔍',
    description: 'Reçoit aléatoirement des informations reliant un Nom réel à un Pseudo',
    team: 'both',
    priority: 2,
    count: (playerCount) => playerCount >= 10 ? 2 : 1, // 1 ou 2 selon nombre de joueurs
    powers: {
      detectPlayerInfo: true,
      frequency: 'random' // Reçoit des infos aléatoirement
    }
  },
  
  detecteur_metiers: {
    name: 'Détecteur de Métiers',
    emoji: '🕵️',
    description: 'Reçoit des notifications donnant le métier (rôle) associé à un Pseudo',
    team: 'both',
    priority: 2,
    count: (playerCount) => playerCount >= 12 ? 2 : 1,
    powers: {
      detectRole: true,
      frequency: 'random'
    }
  },
  
  // Rôles de soutien
  boulanger: {
    name: 'Boulanger',
    emoji: '🍞',
    description: 'Peut sauver une victime d\'élimination pour 1 tour supplémentaire. Le sauvé peut tuer quelqu\'un ! Vous êtes immunisé.',
    team: 'both',
    priority: 3,
    count: (playerCount) => playerCount >= 8 ? 1 : 0,
    powers: {
      revive: true,
      reviveDuration: 'one_turn',
      immuneFromRevived: true
    }
  },
  
  gardien_paix: {
    name: 'Gardien de la Paix',
    emoji: '🛡️',
    description: 'Protège un joueur par tour. Si un Tueur vise ce joueur, l\'attaque est bloquée et le Tueur est révélé',
    team: 'both',
    priority: 3,
    count: (playerCount) => playerCount >= 10 ? 1 : 0,
    powers: {
      protect: true,
      revealAttacker: true
    }
  },
  
  cyberpompier: {
    name: 'Cyberpompier',
    emoji: '👨‍🚒',
    description: 'Peut "crypter" un joueur par tour. Les votes contre lui ne comptent pas',
    team: 'both',
    priority: 3,
    count: (playerCount) => playerCount >= 12 ? 1 : 0,
    powers: {
      protect: true,
      protectType: 'votes'
    }
  },
  
  // Rôles d'influence
  influenceur: {
    name: 'Influenceur',
    emoji: '📢',
    description: 'Votre vote compte TRIPLE ! Mais votre équipe est révélée dès que vous utilisez ce pouvoir',
    team: 'both',
    priority: 4,
    count: (playerCount) => playerCount >= 8 ? 1 : 0,
    powers: {
      tripleVote: true,
      revealsTeam: true,
      usesPerGame: 1
    }
  },
  
  juge: {
    name: 'Juge',
    emoji: '⚖️',
    description: 'En cas d\'égalité lors d\'un vote, c\'est votre vote qui décide',
    team: 'both',
    priority: 4,
    count: (playerCount) => playerCount >= 10 ? 1 : 0,
    powers: {
      tieBreaker: true
    }
  },
  
  // Rôles d'information
  journaliste: {
    name: 'Journaliste',
    emoji: '📰',
    description: 'Pose une question par tour (ex: "Joueur 88 est un Traître ?"). Réponse publique, mais 1/3 de chance d\'être fausse',
    team: 'both',
    priority: 5,
    count: (playerCount) => playerCount >= 10 ? 1 : 0,
    powers: {
      askQuestion: true,
      questionsPerTurn: 1,
      lieChance: 0.33
    }
  },
  
  stalker: {
    name: 'Stalker',
    emoji: '🎯',
    description: 'Enquête sur un Nom réel pour obtenir un indice sur son Pseudo (ex: "nombre pair", "commence par 5...")',
    team: 'both',
    priority: 5,
    count: (playerCount) => playerCount >= 10 ? 1 : 0,
    powers: {
      investigate: true,
      investigationsPerTurn: 1
    }
  },
  
  // Rôles spéciaux
  hacker: {
    name: 'Hacker',
    emoji: '💻',
    description: 'UNE FOIS par partie : échange les pseudos de deux joueurs pendant un tour',
    team: 'both',
    priority: 6,
    count: (playerCount) => playerCount >= 12 ? 1 : 0,
    powers: {
      swapPseudos: true,
      usesPerGame: 1,
      duration: 'one_turn'
    }
  },
  
  usurpateur: {
    name: 'Usurpateur (Deepak)',
    emoji: '🎭',
    description: 'UNE FOIS : reprend le Pseudo d\'un joueur éliminé',
    team: 'both',
    priority: 6,
    count: (playerCount) => playerCount >= 10 ? 1 : 0,
    powers: {
      stealPseudo: true,
      usesPerGame: 1,
      targetType: 'dead'
    }
  },
  
  agent_double: {
    name: 'Agent Double (Caméléon)',
    emoji: '🦎',
    description: 'Rôle passif : Les Détecteurs vous voient toujours dans l\'équipe adverse',
    team: 'both',
    priority: 6,
    count: (playerCount) => playerCount >= 12 ? 1 : 0,
    powers: {
      disguise: true,
      passive: true
    }
  },
  
  // Rôles traîtres spéciaux
  killeurs: {
    name: 'Killeurs (Tueur Traître)',
    emoji: '⚔️',
    description: 'Tueur traître : peut tuer sa propre équipe (aléatoirement) 1 fois tous les 2 tours',
    team: 'traitor',
    priority: 7,
    count: (playerCount, traitors) => traitors >= 2 ? Math.min(2, traitors) : 0,
    requiresTraitors: true,
    powers: {
      kill: true,
      killsEvery: 2, // tours
      canKillOwnTeam: true,
      mustBeRandom: true
    }
  },
  
  guru: {
    name: 'Guru',
    emoji: '🧙',
    description: 'Traître : Si vous devinez l\'identité Réelle (Nom) d\'un adversaire, vous le convertissez en Traître !',
    team: 'traitor',
    priority: 7,
    count: (playerCount, traitors) => traitors >= 2 ? 1 : 0,
    requiresTraitors: true,
    powers: {
      convert: true,
      guessesPerGame: 3,
      targetType: 'enemy'
    }
  },
  
  // Rôle par défaut
  lambda: {
    name: 'Lambda',
    emoji: '👤',
    description: 'Membre normal de l\'équipe. Votez et discutez pour aider votre camp !',
    team: 'both',
    priority: 999, // Attribué en dernier
    powers: {}
  }
};

/**
 * Attribue les rôles aux joueurs en début de partie
 * NE CRÉE PAS DE REPRÉSENTANT (il sera élu après le 1er vote)
 */
function assignRoles(players, traitors = []) {
  const bleus = players.filter(p => p.team === 'bleu');
  const rouges = players.filter(p => p.team === 'rouge');
  const playerCount = players.length;
  
  // Listes des rôles disponibles
  const availableRolesBlue = [];
  const availableRolesRed = [];
  
  // Créer les pools de rôles pour chaque équipe
  Object.keys(ROLES).forEach(roleKey => {
    const roleDef = ROLES[roleKey];
    
    // Skip le lambda pour l'instant (attribué à la fin)
    if (roleKey === 'lambda') return;
    
    // Skip les rôles traîtres si pas assez de traîtres
    if (roleDef.requiresTraitors && traitors.length < 2) return;
    
    // Calculer le nombre de ce rôle
    let count = typeof roleDef.count === 'function' 
      ? roleDef.count(playerCount, traitors.length) 
      : roleDef.count;
    
    // Ajouter aux pools appropriés
    if (roleDef.team === 'both') {
      for (let i = 0; i < count; i++) {
        availableRolesBlue.push(roleKey);
        availableRolesRed.push(roleKey);
      }
    } else if (roleDef.team === 'traitor') {
      // Les rôles traîtres seront gérés séparément
    }
  });
  
  // Mélanger les rôles disponibles
  availableRolesBlue.sort(() => Math.random() - 0.5);
  availableRolesRed.sort(() => Math.random() - 0.5);
  
  // Attribuer aux bleus (NON TRAÎTRES)
  let roleIndex = 0;
  bleus.forEach(player => {
    if (!player.isTraitor) {
      if (roleIndex < availableRolesBlue.length) {
        player.role = availableRolesBlue[roleIndex];
        roleIndex++;
      } else {
        player.role = 'lambda';
      }
    }
  });
  
  // Attribuer aux rouges (NON TRAÎTRES)
  roleIndex = 0;
  rouges.forEach(player => {
    if (!player.isTraitor) {
      if (roleIndex < availableRolesRed.length) {
        player.role = availableRolesRed[roleIndex];
        roleIndex++;
      } else {
        player.role = 'lambda';
      }
    }
  });
  
  // Attribuer les rôles traîtres spéciaux
  if (traitors.length >= 2) {
    const traitorRoles = ['killeurs', 'guru'];
    traitorRoles.forEach((roleKey, idx) => {
      if (idx < traitors.length && ROLES[roleKey]) {
        traitors[idx].role = roleKey;
      } else if (idx < traitors.length) {
        traitors[idx].role = 'lambda';
      }
    });
    
    // Les autres traîtres sont lambda
    for (let i = traitorRoles.length; i < traitors.length; i++) {
      traitors[i].role = 'lambda';
    }
  }
  
  return players;
}

/**
 * Obtient les informations d'un rôle
 */
function getRoleInfo(roleKey) {
  return ROLES[roleKey] || ROLES.lambda;
}

/**
 * Vérifie si un joueur peut utiliser un pouvoir
 */
function canUsePower(player, powerName) {
  const roleInfo = getRoleInfo(player.role);
  return roleInfo.powers && roleInfo.powers[powerName];
}

module.exports = {
  ROLES,
  assignRoles,
  getRoleInfo,
  canUsePower
};

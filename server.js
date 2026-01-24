const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
app.use(cors());

// Servir les fichiers statiques depuis le dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Serveur HTTP (HTTPS géré automatiquement par la plateforme de déploiement)
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permet toutes les origines
    methods: ["GET", "POST"]
  }
});

// ==========================
// STRUCTURE DES DONNÉES
// ==========================
const games = {};

// ==========================
// FONCTIONS UTILITAIRES
// ==========================

// Génère un code de partie à 4 lettres
function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Vérifie que le code n'existe pas déjà
  if (games[code]) {
    return generateGameCode();
  }
  return code;
}

// Envoie la mise à jour de la salle à tous les joueurs
function updateRoom(gameCode) {
  const game = games[gameCode];
  if (!game) return;

  // On envoie les infos publiques (sans les rôles secrets)
  const publicGameData = {
    status: game.status,
    timer: game.timer,
    players: game.players.map(p => ({
      socketId: p.socketId,
      pseudo: p.pseudo,
      realLifeInfo: p.realLifeInfo,
      team: game.status === 'LOBBY' ? null : p.team, // Cache l'équipe en lobby
      isAlive: p.isAlive,
      hasVoted: p.hasVoted
    }))
  };

  // Envoie à tous les joueurs de cette partie
  game.players.forEach(player => {
    io.to(player.socketId).emit('update_room', publicGameData);
  });
}

// ==========================
// GESTION DES CONNEXIONS
// ==========================

io.on('connection', (socket) => {
  console.log(`✅ Nouveau joueur connecté : ${socket.id}`);

  // ==========================
  // EVENT: CRÉER UNE PARTIE
  // ==========================
  socket.on('create_game', (data) => {
    const { pseudo, realLifeInfo } = data;
    const gameCode = generateGameCode();

    games[gameCode] = {
      status: 'LOBBY',
      timer: 0,
      nextEventTime: null,
      players: [
        {
          socketId: socket.id,
          pseudo: pseudo,
          realLifeInfo: realLifeInfo,
          team: null,
          role: null,
          isAlive: true,
          hasVoted: false,
          munitions: 0
        }
      ]
    };

    socket.join(gameCode);
    console.log(`🎮 Partie créée : ${gameCode} par ${pseudo}`);

    socket.emit('game_created', { gameCode });
    updateRoom(gameCode);
  });

  // ==========================
  // EVENT: REJOINDRE UNE PARTIE
  // ==========================
  socket.on('join_game', (data) => {
    const { gameCode, pseudo, realLifeInfo } = data;

    const game = games[gameCode];

    if (!game) {
      socket.emit('error', { message: 'Cette partie n\'existe pas.' });
      return;
    }

    if (game.status !== 'LOBBY') {
      socket.emit('error', { message: 'La partie a déjà commencé.' });
      return;
    }

    // Vérifie si le pseudo existe déjà
    const pseudoExists = game.players.some(p => p.pseudo === pseudo);
    if (pseudoExists) {
      socket.emit('error', { message: 'Ce pseudo est déjà pris.' });
      return;
    }

    // Ajoute le joueur
    game.players.push({
      socketId: socket.id,
      pseudo: pseudo,
      realLifeInfo: realLifeInfo,
      team: null,
      role: null,
      isAlive: true,
      hasVoted: false,
      munitions: 0
    });

    socket.join(gameCode);
    console.log(`👥 ${pseudo} a rejoint la partie ${gameCode}`);

    socket.emit('game_joined', { gameCode });
    updateRoom(gameCode);
  });

  // ==========================
  // EVENT: LANCER LA PARTIE
  // ==========================
  socket.on('start_game', (data) => {
    const { gameCode } = data;
    const game = games[gameCode];

    if (!game) {
      socket.emit('error', { message: 'Partie introuvable.' });
      return;
    }

    if (game.players.length < 4) {
      socket.emit('error', { message: 'Il faut au moins 4 joueurs pour commencer.' });
      return;
    }

    // ÉTAPE 1 : Mélanger les joueurs
    const shuffled = [...game.players].sort(() => Math.random() - 0.5);

    // ÉTAPE 2 : Diviser en 2 équipes
    const half = Math.floor(shuffled.length / 2);
    const bleus = shuffled.slice(0, half);
    const rouges = shuffled.slice(half);

    // ÉTAPE 3 : Attribution des rôles
    // Bleus
    bleus[0].role = 'representant';
    bleus[1].role = 'tueur';
    bleus[1].munitions = 1; // Le tueur a 1 munition
    for (let i = 2; i < bleus.length; i++) {
      bleus[i].role = 'lambda';
    }

    // Rouges
    rouges[0].role = 'representant';
    rouges[1].role = 'tueur';
    rouges[1].munitions = 1;
    for (let i = 2; i < rouges.length; i++) {
      rouges[i].role = 'lambda';
    }

    // Assigne l'équipe
    bleus.forEach(p => p.team = 'bleu');
    rouges.forEach(p => p.team = 'rouge');

    // Met à jour le tableau des joueurs
    game.players = [...bleus, ...rouges];
    game.status = 'PLAYING';
    game.nextEventTime = Date.now() + 3600000; // 1 heure (en millisecondes)

    console.log(`🚀 La partie ${gameCode} a commencé !`);

    // ÉTAPE 4 : Envoie du rôle SECRET à chaque joueur
    game.players.forEach(player => {
      io.to(player.socketId).emit('your_role', {
        team: player.team,
        role: player.role,
        munitions: player.munitions
      });
    });

    // Met à jour la salle (sans révéler les rôles)
    updateRoom(gameCode);
  });

  // ==========================
  // EVENT: DÉCONNEXION
  // ==========================
  socket.on('disconnect', () => {
    console.log(`❌ Joueur déconnecté : ${socket.id}`);

    // Recherche et retire le joueur des parties
    for (const gameCode in games) {
      const game = games[gameCode];
      const playerIndex = game.players.findIndex(p => p.socketId === socket.id);

      if (playerIndex !== -1) {
        const player = game.players[playerIndex];
        console.log(`👋 ${player.pseudo} a quitté la partie ${gameCode}`);
        game.players.splice(playerIndex, 1);

        // Si la salle est vide, on la supprime
        if (game.players.length === 0) {
          delete games[gameCode];
          console.log(`🗑️ Partie ${gameCode} supprimée (vide)`);
        } else {
          updateRoom(gameCode);
        }
        break;
      }
    }
  });
});

// ==========================
// DÉMARRAGE DU SERVEUR
// ==========================
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🟢 Serveur lancé sur le port ${PORT}`);
});

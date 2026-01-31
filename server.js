require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const mongoose = require('mongoose');
const { router: authRouter } = require('./routes/auth');
const User = require('./models/User');
const Game = require('./models/Game');
const { endGame, cleanupOldGames } = require('./utils/gameCleanup');

const app = express();
app.use(cors());
app.use(express.json());

// Variable globale pour vérifier la connexion MongoDB
let mongoConnected = false;

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jeu_bleu_rouge')
.then(() => {
  console.log('✅ Connecté à MongoDB');
  mongoConnected = true;
  
  // Nettoyage automatique des anciennes parties toutes les 6 heures
  setInterval(() => {
    cleanupOldGames();
  }, 6 * 60 * 60 * 1000); // 6 heures en millisecondes
  
  // Premier nettoyage au démarrage
  cleanupOldGames();
})
.catch(err => {
  console.error('❌ Erreur de connexion MongoDB:', err);
  console.log('⚠️ L\'application fonctionnera sans authentification (parties temporaires uniquement)');
});

// Routes d'authentification
app.use('/api/auth', authRouter);

// Routes de gestion des parties
const gameRouter = require('./routes/game');
app.use('/api/game', gameRouter);

// Servir les fichiers statiques depuis le dossier "public"
app.use(express.static(path.join(__dirname, 'public')));

// Rediriger la racine vers la page de chargement si le serveur vient de démarrer
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

// Fonction pour éliminer un joueur (et son amoureux si applicable)
function killPlayer(game, targetPlayer, reason = 'éliminé') {
  if (!targetPlayer.isAlive) return [];
  
  const deadPlayers = [];
  targetPlayer.isAlive = false;
  deadPlayers.push({
    pseudo: targetPlayer.pseudo,
    team: targetPlayer.team,
    role: targetPlayer.role,
    reason: reason
  });
  
  console.log(`💀 ${targetPlayer.pseudo} (${targetPlayer.team} - ${targetPlayer.role}) a été ${reason}`);
  
  // Si le joueur était amoureux, son partenaire meurt aussi
  if (targetPlayer.isLover && targetPlayer.loverSocketId) {
    const lover = game.players.find(p => p.socketId === targetPlayer.loverSocketId);
    if (lover && lover.isAlive) {
      lover.isAlive = false;
      deadPlayers.push({
        pseudo: lover.pseudo,
        team: lover.team,
        role: lover.role,
        reason: 'mort de chagrin 💔'
      });
      console.log(`💔 ${lover.pseudo} meurt de chagrin (amoureux de ${targetPlayer.pseudo})`);
    }
  }
  
  return deadPlayers;
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
  socket.on('create_game', async (data) => {
    console.log('📥 Reçu demande de création de partie:', data);
    const { pseudo, realLifeInfo, userId } = data;
    
    if (!pseudo) {
      socket.emit('error', { message: 'Le pseudo est requis.' });
      return;
    }
    
    const gameCode = generateGameCode();

    games[gameCode] = {
      status: 'LOBBY',
      timer: 0,
      nextEventTime: null,
      userId: userId || null, // ID de l'utilisateur créateur
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

    // Sauvegarder la partie dans la base de données si l'utilisateur est connecté
    if (userId && mongoConnected) {
      try {
        const gameDoc = new Game({
          gameId: gameCode,
          userId: userId,
          playerName: pseudo,
          status: 'waiting',
          players: [{
            socketId: socket.id,
            name: pseudo,
            team: null,
            joinedAt: new Date()
          }]
        });
        await gameDoc.save();
        console.log(`💾 Partie ${gameCode} sauvegardée pour l'utilisateur ${userId}`);
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la partie:', error);
      }
    }

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
  socket.on('start_game', async (data) => {
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

    // ÉTAPE 4 : Désigner les AMOUREUX (si au moins 6 joueurs)
    if (game.players.length >= 6) {
      // Choisir un joueur de chaque équipe (sauf les représentants)
      const bleusEligibles = bleus.filter(p => p.role !== 'representant');
      const rougesEligibles = rouges.filter(p => p.role !== 'representant');
      
      if (bleusEligibles.length > 0 && rougesEligibles.length > 0) {
        const amoureux1 = bleusEligibles[Math.floor(Math.random() * bleusEligibles.length)];
        const amoureux2 = rougesEligibles[Math.floor(Math.random() * rougesEligibles.length)];
        
        amoureux1.isLover = true;
        amoureux1.loverSocketId = amoureux2.socketId;
        amoureux2.isLover = true;
        amoureux2.loverSocketId = amoureux1.socketId;
        
        console.log(`💕 Amoureux : ${amoureux1.pseudo} (${amoureux1.team}) ❤️ ${amoureux2.pseudo} (${amoureux2.team})`);
      }
    }
    game.status = 'PLAYING';
    game.nextEventTime = Date.now() + 3600000; // 1 heure (en millisecondes)

    // Mettre à jour la partie dans la base de données
    if (game.userId && mongoConnected) {
      try {
        await Game.findOneAndUpdate(
          { gameId: gameCode },
          { 
            status: 'playing',
            players: game.players.map(p => ({
              socketId: p.socketId,
              name: p.pseudo,
              team: p.team,
              joinedAt: p.joinedAt || new Date()
            }))
          }
        );
      } catch (error) {
        console.error('Erreur lors de la mise à jour de la partie:', error);
      }
    }

    console.log(`🚀 La partie ${gameCode} a commencé !`);

    // ÉTAPE 5 : Envoie du rôle SECRET à chaque joueur
    game.players.forEach(player => {
      const roleData = {
        team: player.team,
        role: player.role,
        munitions: player.munitions,
        isLover: player.isLover || false
      };
      
      // Si le joueur est amoureux, envoyer l'info de son partenaire
      if (player.isLover) {
        const lover = game.players.find(p => p.socketId === player.loverSocketId);
        if (lover) {
          roleData.loverInfo = {
            pseudo: lover.pseudo,
            team: lover.team,
            role: lover.role
          };
        }
      }
      
      io.to(player.socketId).emit('your_role', roleData);
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

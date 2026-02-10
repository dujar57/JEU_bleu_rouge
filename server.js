// -*- coding: utf-8 -*-
// @charset "UTF-8"
require('dotenv').config();

// ✅ SÉCURITÉ : Valider les variables d'environnement au démarrage
const { validateEnv } = require('./utils/validateEnv');
validateEnv();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const mongoose = require('mongoose');
const { doubleCsrf } = require('csrf-csrf');
const { sanitizeMiddleware } = require('./utils/sanitizer');
const authRouter = require('./routes/auth');
const User = require('./models/User');
const Game = require('./models/Game');
const { endGame, cleanupOldGames } = require('./utils/gameCleanup');
const {
  validatePseudo,
  validateGameCode,
  validateRealLifeInfo,
  validateChatMessage,
  validateDuration,
  validatePlayerId,
  checkRateLimit
} = require('./utils/socketValidation');

const app = express();

// Trust proxy pour Render
app.set('trust proxy', 1);

// Force HTTPS en production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// Sécurité HTTP headers renforcée
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "wss://jeu-bleu-rouge.onrender.com", "https://jeu-bleu-rouge.onrender.com"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max par IP
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rate limiting auth strict
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentatives de connexion/inscription par 15min
  message: 'Trop de tentatives de connexion, réessayez dans 15 minutes',
  skipSuccessfulRequests: true
});

// CORS sécurisé - RENDER UNIQUEMENT
const allowedOrigins = [
  'https://jeu-bleu-rouge.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    // En production, rejeter les requêtes sans origin (possibles attaques)
    if (!origin && process.env.NODE_ENV === 'production') {
      return callback(new Error('Non autorisé par CORS'));
    }
    // Accepter les origins autorisées ou les requêtes locales (sans origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️ Origine rejetée par CORS:', origin);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true
}));

app.use(cookieParser());
app.use(express.json({ limit: '10kb' })); // Limite la taille des requêtes
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize()); // Protection injection NoSQL

// ✅ SÉCURITÉ : Protection CSRF et sanitization HTML
const {
  generateToken, // Génère un token CSRF
  doubleCsrfProtection, // Middleware de protection
} = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET, // Utilise le même secret que JWT
  cookieName: '__Host-psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// Appliquer la sanitization HTML sur toutes les entrées
app.use(sanitizeMiddleware);

// Route pour obtenir un token CSRF
app.get('/api/csrf-token', (req, res) => {
  const csrfToken = generateToken(req, res);
  res.json({ csrfToken });
});

// Appliquer la protection CSRF sur les routes sensibles
app.use('/api/auth', doubleCsrfProtection);
app.use('/api/game', doubleCsrfProtection);

// Blacklist de tokens pour logout sécurisé
const tokenBlacklist = new Set();

// Middleware anti-bot avec honeypot
app.use((req, res, next) => {
  // Vérifier le header User-Agent
  const userAgent = req.get('User-Agent');
  if (!userAgent || userAgent.length < 10) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  
  // Bloquer les bots connus
  const botPatterns = /bot|crawler|spider|scraper|curl|wget|python-requests/i;
  if (botPatterns.test(userAgent) && !req.path.startsWith('/api/')) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  
  next();
});

// Logging des requêtes suspectes
const suspiciousActivity = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `${ip}_${Date.now()}`;
  
  // Détecter les scans de ports/endpoints
  if (req.path.includes('..') || req.path.includes('~') || 
      req.path.match(/\.(env|git|sql|bak|config)$/i)) {
    console.warn(`⚠️ Activité suspecte détectée de ${ip}: ${req.path}`);
    
    const count = suspiciousActivity.get(ip) || 0;
    suspiciousActivity.set(ip, count + 1);
    
    if (count > 5) {
      console.error(`🚨 IP bloquée pour activité malveillante: ${ip}`);
      return res.status(403).json({ error: 'Accès bloqué' });
    }
  }
  
  next();
});

// Forcer l'encodage UTF-8 pour toutes les réponses
// Ajoute automatiquement charset=utf-8 aux types textuels sans écraser le type
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

// Variable globale pour vérifier la connexion MongoDB
let mongoConnected = false;

// Vérification du JWT_SECRET
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'votre_secret_jwt_super_securise_changez_moi') {
  console.error('⚠️  ALERTE SÉCURITÉ: JWT_SECRET non défini ou valeur par défaut!');
  console.error('   Définissez une clé secrète forte dans les variables d\'environnement');
}

// Connexion à MongoDB
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('❌ MONGODB_URI non défini dans les variables d\'environnement');
  process.exit(1);
}

// Options de connexion MongoDB modernes avec timeouts de sécurité
mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 5000,    // Timeout pour sélection du serveur
  socketTimeoutMS: 45000,            // Timeout pour opérations socket
  maxPoolSize: 10,                   // Limite les connexions simultanées
  minPoolSize: 2                     // Garde des connexions actives
})
.then(() => {
  console.log('✅ Connecté à MongoDB');
  mongoConnected = true;
  
  // Restaurer les parties actives depuis MongoDB
  restoreActiveGames();
  
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

// Routes d'authentification (avec rate limiting)
app.use('/api/auth', authLimiter, authRouter);

// Routes de gestion des parties
const gameRouter = require('./routes/game');
app.use('/api/game', gameRouter);

// Servir les fichiers statiques du client React (build de production)
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Servir les anciens fichiers statiques depuis le dossier "public"
app.use('/old', express.static(path.join(__dirname, 'public')));

// Rediriger la racine vers l'application React
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'client', 'dist', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('⚠️ Application non construite. Exécutez: npm run build');
  }
});

// Serveur HTTP (HTTPS géré automatiquement par la plateforme de déploiement)
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// ============================================
// ✅ SÉCURITÉ : MIDDLEWARE D'AUTHENTIFICATION SOCKET.IO
// ============================================
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    // ✅ Autoriser les connexions anonymes mais avec flag
    socket.isAuthenticated = false;
    socket.ipAddress = socket.handshake.address;
    console.log(`⚠️  Socket.io non authentifié depuis ${socket.ipAddress}`);
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.isAuthenticated = true;
    console.log(`✅ Socket.io authentifié: User ${decoded.userId}`);
    next();
  } catch (error) {
    console.log(`❌ Token Socket.io invalide: ${error.message}`);
    // Autoriser quand même mais marquer comme non authentifié
    socket.isAuthenticated = false;
    socket.ipAddress = socket.handshake.address;
    return next();
  }
});

// ==========================
// STRUCTURE DES DONNÉES
// ==========================
const games = {};

// Fonction pour restaurer les parties actives depuis MongoDB
async function restoreActiveGames() {
  if (!mongoConnected) return;
  
  try {
    // Récupérer toutes les parties en cours
    const activeGames = await Game.find({ 
      status: { $in: ['waiting', 'playing'] }
    });
    
    console.log(`🔄 Restauration de ${activeGames.length} partie(s) active(s)...`);
    
    for (const gameDoc of activeGames) {
      // Reconstruire la structure de jeu en mémoire
      games[gameDoc.gameId] = {
        status: gameDoc.status === 'waiting' ? 'LOBBY' : 'PLAYING',
        timer: 0,
        nextEventTime: null,
        phases: null,
        currentPhase: 0,
        phaseStartTime: null,
        votingPhase: null,
        currentVoteNumber: 0,
        blueVotes: {},
        redVotes: {},
        chatMessages: gameDoc.chatMessages || [],
        userId: gameDoc.userId,
        players: gameDoc.players.map(p => ({
          socketId: null, // Sera mis à jour quand les joueurs se reconnectent
          pseudo: p.name,
          realLifeInfo: p.name,
          team: p.team,
          role: null,
          isAlive: true,
          hasVoted: false,
          munitions: 0,
          anonymousNumber: null
        }))
      };
      
      console.log(`✅ Partie ${gameDoc.gameId} restaurée (${gameDoc.players.length} joueurs)`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la restauration des parties:', error);
  }
}

// Système de vérification automatique des fins de partie et phases de vote
setInterval(() => {
  for (const gameCode in games) {
    const game = games[gameCode];
    
    if (game.status !== 'PLAYING' || !game.phases) continue;
    
    const now = Date.now();
    
    // Vérifier si le temps est écoulé
    if (now >= game.phases.endTime) {
      console.log(`⏰ Temps écoulé pour la partie ${gameCode}`);
      endGameByTimeout(gameCode);
      continue;
    }
    
    // Vérifier les conditions de victoire
    const victory = checkVictoryConditions(game);
    if (victory) {
      console.log(`🏆 ${victory.message} dans la partie ${gameCode}`);
      endGameWithWinner(gameCode, victory);
      continue;
    }
    
    // Vérifier si une phase de vote doit commencer
    const nextVote = game.phases.voteSchedule[game.currentVoteNumber];
    if (nextVote) {
      // Phase de discussion
      if (!game.votingPhase && now >= nextVote.discussionStart && now < nextVote.votingStart) {
        game.votingPhase = 'DISCUSSION';
        console.log(`💬 Partie ${gameCode} - Phase de discussion ${game.currentVoteNumber + 1}/${game.phases.numberOfVotes}`);
        notifyVotingPhase(gameCode, 'DISCUSSION', nextVote);
      }
      
      // Phase de vote
      if (game.votingPhase === 'DISCUSSION' && now >= nextVote.votingStart && now < nextVote.endTime) {
        game.votingPhase = 'VOTING';
        game.blueVotes = {};
        game.redVotes = {};
        // Réinitialiser le statut de vote de tous les joueurs
        game.players.forEach(p => p.hasVoted = false);
        console.log(`🗳️ Partie ${gameCode} - Phase de vote ${game.currentVoteNumber + 1}/${game.phases.numberOfVotes}`);
        notifyVotingPhase(gameCode, 'VOTING', nextVote);
      }
      
      // Fin du vote - Comptage et élimination
      if (game.votingPhase === 'VOTING' && now >= nextVote.endTime) {
        console.log(`📊 Partie ${gameCode} - Comptage des votes ${game.currentVoteNumber + 1}`);
        processVoteResults(gameCode);
        game.votingPhase = null;
        game.currentVoteNumber++;
      }
    }
  }
}, 5000); // Vérification toutes les 5 secondes

// Fonction pour terminer une partie par timeout
async function endGameByTimeout(gameCode) {
  const game = games[gameCode];
  if (!game) return;
  
  const alivePlayers = game.players.filter(p => p.isAlive);
  
  // Déterminer le gagnant en fonction des survivants
  let winner = 'ÉGALITÉ';
  let message = '⏰ TEMPS ÉCOULÉ ! ';
  
  if (alivePlayers.length === 0) {
    message += 'Aucun survivant.';
  } else if (alivePlayers.length === 1) {
    winner = alivePlayers[0].team.toUpperCase();
    message += `${alivePlayers[0].pseudo} est le dernier survivant !`;
  } else {
    // Compter les survivants par équipe
    const blueAlive = alivePlayers.filter(p => p.team === 'bleu' && !p.isTraitor).length;
    const redAlive = alivePlayers.filter(p => p.team === 'rouge' && !p.isTraitor).length;
    const traitorsAlive = alivePlayers.filter(p => p.isTraitor).length;
    
    if (traitorsAlive === 2) {
      winner = 'TRAÎTRES';
      message += '🎭 Les traîtres ont survécu !';
    } else if (blueAlive > redAlive) {
      winner = 'BLEU';
      message += `🔵 L'équipe Bleue domine avec ${blueAlive} survivants !`;
    } else if (redAlive > blueAlive) {
      winner = 'ROUGE';
      message += `🔴 L'équipe Rouge domine avec ${redAlive} survivants !`;
    } else {
      message += `Égalité : ${blueAlive} survivants par équipe.`;
    }
  }
  
  game.status = 'FINISHED';
  game.winner = winner;
  
  // Notifier tous les joueurs
  game.players.forEach(player => {
    io.to(player.socketId).emit('game_ended', {
      winner: winner,
      message: message,
      survivors: alivePlayers.map(p => ({
        pseudo: p.pseudo,
        team: p.team,
        role: p.role,
        isTraitor: p.isTraitor || false
      }))
    });
  });
  
  // Sauvegarder dans la base de données
  if (game.userId && mongoConnected) {
    try {
      await Game.findOneAndUpdate(
        { gameId: gameCode },
        { 
          status: 'finished',
          winner: winner,
          finishedAt: new Date(),
          expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expire dans 24h
        }
      );
    } catch (error) {
      console.error('Erreur lors de la finalisation de la partie:', error);
    }
  }
  
  // Sauvegarder l'historique pour tous les joueurs
  await saveMatchHistory(gameCode);
  
  updateRoom(gameCode);
}

// Fonction pour terminer une partie avec un gagnant
async function endGameWithWinner(gameCode, victory) {
  const game = games[gameCode];
  if (!game) return;
  
  game.status = 'FINISHED';
  game.winner = victory.winner;
  
  const alivePlayers = game.players.filter(p => p.isAlive);
  
  // Notifier tous les joueurs
  game.players.forEach(player => {
    io.to(player.socketId).emit('game_ended', {
      winner: victory.winner,
      message: victory.message,
      survivors: alivePlayers.map(p => ({
        pseudo: p.pseudo,
        team: p.team,
        role: p.role,
        isTraitor: p.isTraitor || false
      })),
      traitors: victory.traitors,
      lovers: victory.lovers
    });
  });
  
  // Sauvegarder dans la base de données
  if (game.userId && mongoConnected) {
    try {
      await Game.findOneAndUpdate(
        { gameId: gameCode },
        { 
          status: 'finished',
          winner: victory.winner,
          finishedAt: new Date(),
          expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      );
    } catch (error) {
      console.error('Erreur lors de la finalisation de la partie:', error);
    }
  }
  
  // Sauvegarder l'historique pour tous les joueurs
  await saveMatchHistory(gameCode);
  
  updateRoom(gameCode);
}

// Fonction pour sauvegarder l'historique de partie pour tous les joueurs
async function saveMatchHistory(gameCode) {
  const game = games[gameCode];
  if (!game || !mongoConnected) return;
  
  const gameStartTime = game.startTime || Date.now();
  const gameEndTime = Date.now();
  const duration = Math.floor((gameEndTime - gameStartTime) / 60000); // en minutes
  const winner = game.winner;
  
  // Sauvegarder l'historique pour chaque joueur
  for (const player of game.players) {
    try {
      // Déterminer si le joueur a gagné
      let playerWon = false;
      if (winner === 'BLEU' && player.team === 'bleu' && !player.isTraitor) {
        playerWon = true;
      } else if (winner === 'ROUGE' && player.team === 'rouge' && !player.isTraitor) {
        playerWon = true;
      } else if (winner === 'TRAITRES' && player.isTraitor) {
        playerWon = true;
      } else if (winner === 'AMOUREUX' && player.isLover) {
        playerWon = true;
      }
      
      // Trouver l'utilisateur par pseudo (approximatif, devrait être amélioré avec userId)
      const user = await User.findOne({ username: player.pseudo });
      if (!user) continue;
      
      // Ajouter l'entrée dans l'historique
      user.matchHistory.push({
        gameId: gameCode,
        team: player.team,
        role: player.role,
        won: playerWon,
        isTraitor: player.isTraitor || false,
        playedAt: new Date(),
        duration: duration,
        playerCount: game.players.length
      });
      
      // Mettre à jour les statistiques globales
      user.gamesPlayed = (user.gamesPlayed || 0) + 1;
      if (playerWon) {
        user.gamesWon = (user.gamesWon || 0) + 1;
      }
      
      // Retirer la partie des parties en cours
      user.currentGames = user.currentGames.filter(g => g.gameId !== gameCode);
      
      user.lastActivityAt = new Date();
      
      // Limiter l'historique à 100 parties max
      if (user.matchHistory.length > 100) {
        user.matchHistory = user.matchHistory.slice(-100);
      }
      
      await user.save();
      console.log(`📊 Historique sauvegardé pour ${player.pseudo}`);
    } catch (error) {
      console.error(`Erreur sauvegarde historique pour ${player.pseudo}:`, error);
    }
  }
}

// Notifie tous les joueurs du changement de phase de vote
function notifyVotingPhase(gameCode, phase, voteInfo) {
  const game = games[gameCode];
  if (!game) return;
  
  game.players.forEach(player => {
    io.to(player.socketId).emit('voting_phase_change', {
      phase: phase,
      voteNumber: game.currentVoteNumber + 1,
      totalVotes: game.phases.numberOfVotes,
      discussionEnd: voteInfo.votingStart,
      votingEnd: voteInfo.endTime,
      message: phase === 'DISCUSSION' 
        ? '💬 Phase de discussion - Préparez vos arguments'
        : '🗳️ Phase de vote - Votez maintenant !'
    });
  });
  
  updateRoom(gameCode);
}

// Traite les résultats du vote et élimine les joueurs
function processVoteResults(gameCode) {
  const game = games[gameCode];
  if (!game) return;
  
  const alivePlayers = game.players.filter(p => p.isAlive);
  const blueAlive = alivePlayers.filter(p => p.team === 'bleu' && p.isAlive);
  const redAlive = alivePlayers.filter(p => p.team === 'rouge' && p.isAlive);
  
  // Compter les votes des BLEUS
  const blueVoteCount = {};
  for (const targetId in game.blueVotes) {
    blueVoteCount[targetId] = game.blueVotes[targetId].length;
  }
  
  // Compter les votes des ROUGES
  const redVoteCount = {};
  for (const targetId in game.redVotes) {
    redVoteCount[targetId] = game.redVotes[targetId].length;
  }
  
  const deadPlayers = [];
  
  // Trouver le joueur le plus voté par les BLEUS
  if (Object.keys(blueVoteCount).length > 0) {
    const maxBlueVotes = Math.max(...Object.values(blueVoteCount));
    const blueTargets = Object.keys(blueVoteCount).filter(id => blueVoteCount[id] === maxBlueVotes);
    
    // En cas d'égalité, choisir aléatoirement
    const blueTargetId = blueTargets[Math.floor(Math.random() * blueTargets.length)];
    const blueTarget = game.players.find(p => p.socketId === blueTargetId);
    
    if (blueTarget && blueTarget.isAlive) {
      const percentage = Math.round((maxBlueVotes / blueAlive.length) * 100);
      const killed = killPlayer(game, blueTarget, `éliminé par vote de l'équipe Bleue (${percentage}%)`);
      deadPlayers.push(...killed);
    }
  }
  
  // Trouver le joueur le plus voté par les ROUGES
  if (Object.keys(redVoteCount).length > 0) {
    const maxRedVotes = Math.max(...Object.values(redVoteCount));
    const redTargets = Object.keys(redVoteCount).filter(id => redVoteCount[id] === maxRedVotes);
    
    // En cas d'égalité, choisir aléatoirement
    const redTargetId = redTargets[Math.floor(Math.random() * redTargets.length)];
    const redTarget = game.players.find(p => p.socketId === redTargetId);
    
    if (redTarget && redTarget.isAlive) {
      const percentage = Math.round((maxRedVotes / redAlive.length) * 100);
      const killed = killPlayer(game, redTarget, `éliminé par vote de l'équipe Rouge (${percentage}%)`);
      deadPlayers.push(...killed);
    }
  }
  
  // Notifier tous les joueurs des éliminations
  if (deadPlayers.length > 0) {
    game.players.forEach(player => {
      io.to(player.socketId).emit('vote_results', {
        eliminated: deadPlayers,
        message: `💀 ${deadPlayers.length} joueur(s) éliminé(s) par vote`
      });
    });
    
    console.log(`💀 Partie ${gameCode} - ${deadPlayers.length} joueur(s) éliminé(s) :`, 
      deadPlayers.map(p => `${p.pseudo} (${p.reason})`).join(', '));
  } else {
    // Aucun vote ou aucune élimination
    game.players.forEach(player => {
      io.to(player.socketId).emit('vote_results', {
        eliminated: [],
        message: '🤷 Aucune élimination - Pas assez de votes'
      });
    });
  }
  
  updateRoom(gameCode);
}

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

// Vérifie les conditions de victoire
function checkVictoryConditions(game) {
  const alivePlayers = game.players.filter(p => p.isAlive);
  
  // Vérifier si les traîtres sont encore en vie
  const aliveTraitors = alivePlayers.filter(p => p.isTraitor);
  const blueAlive = alivePlayers.filter(p => p.team === 'bleu' && !p.isTraitor).length;
  const redAlive = alivePlayers.filter(p => p.team === 'rouge' && !p.isTraitor).length;
  const blueRepAlive = alivePlayers.some(p => p.team === 'bleu' && p.role === 'representant');
  const redRepAlive = alivePlayers.some(p => p.team === 'rouge' && p.role === 'representant');
  
  // CONDITION 1 : Les TRAÎTRES gagnent si les deux représentants sont morts ET les deux traîtres sont vivants
  if (aliveTraitors.length === 2 && !blueRepAlive && !redRepAlive) {
    return { 
      winner: 'TRAÎTRES', 
      message: '🎭 LES TRAÎTRES ONT GAGNÉ ! Ils ont éliminé les deux représentants !',
      traitors: aliveTraitors.map(t => ({ pseudo: t.pseudo, anonymousNumber: t.anonymousNumber }))
    };
  }
  
  // CONDITION 2 : Une équipe gagne si le représentant adverse est mort
  if (!blueRepAlive && blueAlive === 0) {
    return { winner: 'ROUGE', message: '🔴 L\'ÉQUIPE ROUGE A GAGNÉ !' };
  }
  
  if (!redRepAlive && redAlive === 0) {
    return { winner: 'BLEU', message: '🔵 L\'ÉQUIPE BLEUE A GAGNÉ !' };
  }
  
  // CONDITION 3 : Les amoureux gagnent si ce sont les 2 derniers survivants
  const loverAlive = alivePlayers.filter(p => p.isLover);
  if (loverAlive.length === 2 && alivePlayers.length === 2) {
    return { 
      winner: 'AMOUREUX', 
      message: '💕 LES AMOUREUX ONT GAGNÉ !',
      lovers: loverAlive.map(l => ({ pseudo: l.pseudo, team: l.team }))
    };
  }
  
  return null;
}

// Calcule les phases de jeu en fonction de la durée et du nombre de joueurs
function calculateGamePhases(duration, playerCount) {
  // Calcul du nombre de votes basé sur la durée ET le nombre de joueurs
  // Règle : Plus il y a de joueurs, plus il y a de votes pour l'équilibrage
  // Base : 1 vote par tranche de 3 joueurs, minimum 3 votes
  const votesPerThreePlayers = Math.floor(playerCount / 3);
  const baseDurationVotes = Math.max(3, Math.floor((duration / (24 * 60 * 60 * 1000)) * 2));
  
  // On prend le plus grand des deux pour garantir assez de votes
  const numberOfVotes = Math.max(3, Math.max(votesPerThreePlayers, baseDurationVotes));
  
  console.log(`📊 Calcul des votes : ${playerCount} joueurs → ${votesPerThreePlayers} votes base, durée → ${baseDurationVotes} votes → TOTAL: ${numberOfVotes} votes`);
  
  // Durée entre chaque vote
  const voteInterval = Math.floor(duration / (numberOfVotes + 1));
  
  // Temps de discussion avant chaque vote (15% du temps entre votes)
  const discussionTime = Math.floor(voteInterval * 0.15);
  
  // Temps de vote (10% du temps entre votes)
  const votingTime = Math.floor(voteInterval * 0.10);
  
  // Calculer les timestamps de chaque vote
  const voteSchedule = [];
  for (let i = 1; i <= numberOfVotes; i++) {
    voteSchedule.push({
      voteNumber: i,
      startTime: Date.now() + (voteInterval * i),
      discussionStart: Date.now() + (voteInterval * i) - discussionTime - votingTime,
      votingStart: Date.now() + (voteInterval * i) - votingTime,
      endTime: Date.now() + (voteInterval * i)
    });
  }
  
  return {
    totalDuration: duration,
    numberOfVotes: numberOfVotes,
    voteInterval: voteInterval,
    discussionTime: Math.max(120000, discussionTime), // Minimum 2 minutes
    votingTime: Math.max(60000, votingTime), // Minimum 1 minute
    voteSchedule: voteSchedule,
    startTime: Date.now(),
    endTime: Date.now() + duration
  };
}

// Envoie la mise à jour de la salle à tous les joueurs
function updateRoom(gameCode) {
  const game = games[gameCode];
  if (!game) return;

  // On envoie les infos publiques (sans les rôles secrets)
  const publicGameData = {
    status: game.status,
    timer: game.timer,
    nextEventTime: game.nextEventTime,
    votingPhase: game.votingPhase,
    players: game.players.map(p => ({
      socketId: p.socketId,
      pseudo: p.pseudo,
      realLifeInfo: p.realLifeInfo,
      team: game.status === 'LOBBY' ? null : p.team, // Cache l'équipe en lobby
      anonymousNumber: p.anonymousNumber, // Numéro de joueur anonyme
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
    
    // ✅ SÉCURITÉ : Vérifier l'authentification
    if (!socket.isAuthenticated) {
      console.log(`❌ Tentative de création sans auth depuis ${socket.ipAddress}`);
      return socket.emit('error', { 
        message: '🔒 Vous devez être connecté pour créer une partie' 
      });
    }
    
    // Rate limiting
    const rateCheck = checkRateLimit(socket.userId || socket.id, 'create_game', 3, 60000);
    if (!rateCheck.allowed) {
      socket.emit('error', { message: rateCheck.error });
      return;
    }
    
    const { pseudo, realLifeInfo, userId } = data;
    
    // Validation du pseudo
    const pseudoValidation = validatePseudo(pseudo);
    if (!pseudoValidation.valid) {
      socket.emit('error', { message: pseudoValidation.error });
      return;
    }
    
    // Validation des infos
    const infoValidation = validateRealLifeInfo(realLifeInfo);
    if (!infoValidation.valid) {
      socket.emit('error', { message: infoValidation.error });
      return;
    }
    
    const gameCode = generateGameCode();

    games[gameCode] = {
      status: 'LOBBY',
      timer: 0,
      nextEventTime: null,
      phases: null, // Phases de jeu calculées
      currentPhase: 0,
      phaseStartTime: null,
      votingPhase: null, // 'DISCUSSION', 'VOTING', ou null
      currentVoteNumber: 0,
      blueVotes: {}, // { targetPlayerId: [voterId1, voterId2, ...] }
      redVotes: {}, // { targetPlayerId: [voterId1, voterId2, ...] }
      chatMessages: [], // Historique des messages
      userId: userId || null, // ID de l'utilisateur créateur
      players: [
        {
          socketId: socket.id,
          pseudo: pseudoValidation.value, // Utiliser la valeur nettoyée
          realLifeInfo: infoValidation.value, // Utiliser la valeur nettoyée
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
          playerName: pseudoValidation.value, // Utiliser la valeur nettoyée
          status: 'waiting',
          players: [{
            socketId: socket.id,
            name: pseudoValidation.value, // Utiliser la valeur nettoyée
            team: null,
            joinedAt: new Date()
          }],
          chatMessages: [] // Initialiser l'historique des messages
        });
        await gameDoc.save();
        console.log(`💾 Partie ${gameCode} sauvegardée pour l'utilisateur ${userId}`);
        
        // Ajouter la partie aux parties en cours de l'utilisateur
        const user = await User.findById(userId);
        if (user) {
          // Vérifier si la partie n'est pas déjà dans la liste
          const gameExists = user.currentGames.some(g => g.gameId === gameCode);
          if (!gameExists) {
            user.currentGames.push({
              gameId: gameCode,
              joinedAt: new Date(),
              lastActivityAt: new Date()
            });
            user.lastActivityAt = new Date();
            await user.save();
          }
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la partie:', error);
      }
    }

    socket.join(gameCode);
    console.log(`🎮 Partie créée : ${gameCode} par ${pseudoValidation.value}`);

    socket.emit('game_created', { gameCode });
    updateRoom(gameCode);
  });

  // ==========================
  // EVENT: REJOINDRE UNE PARTIE
  // ==========================
  socket.on('join_game', async (data) => {
    // ✅ Rate limiting adapté selon l'authentification
    const identifier = socket.isAuthenticated ? socket.userId : socket.ipAddress;
    const maxAttempts = socket.isAuthenticated ? 5 : 3; // Plus permissif pour users auth
    const rateCheck = checkRateLimit(identifier, 'join_game', maxAttempts, 60000);
    if (!rateCheck.allowed) {
      socket.emit('error', { message: rateCheck.error });
      return;
    }
    
    const { gameCode, pseudo, realLifeInfo } = data;
    
    // Validation du code de partie
    const codeValidation = validateGameCode(gameCode);
    if (!codeValidation.valid) {
      socket.emit('error', { message: codeValidation.error });
      return;
    }
    
    // Validation du pseudo
    const pseudoValidation = validatePseudo(pseudo);
    if (!pseudoValidation.valid) {
      socket.emit('error', { message: pseudoValidation.error });
      return;
    }
    
    // Validation des infos
    const infoValidation = validateRealLifeInfo(realLifeInfo);
    if (!infoValidation.valid) {
      socket.emit('error', { message: infoValidation.error });
      return;
    }

    const game = games[codeValidation.value];

    if (!game) {
      socket.emit('error', { message: 'Cette partie n\'existe pas.' });
      return;
    }

    if (game.status !== 'LOBBY') {
      socket.emit('error', { message: 'La partie a déjà commencé.' });
      return;
    }

    // Vérifie si le pseudo existe déjà (insensible à la casse)
    const pseudoExists = game.players.some(p => p.pseudo.toLowerCase() === pseudoValidation.value.toLowerCase());
    if (pseudoExists) {
      socket.emit('error', { message: 'Ce pseudo est déjà pris dans cette partie.' });
      return;
    }
    
    // Limite le nombre de joueurs
    if (game.players.length >= 50) {
      socket.emit('error', { message: 'Cette partie est complète (max 50 joueurs).' });
      return;
    }

    // Ajoute le joueur
    game.players.push({
      socketId: socket.id,
      pseudo: pseudoValidation.value, // Valeur nettoyée
      realLifeInfo: infoValidation.value, // Valeur nettoyée
      team: null,
      role: null,
      isAlive: true,
      hasVoted: false,
      munitions: 0
    });

    socket.join(codeValidation.value);
    console.log(`👥 ${pseudoValidation.value} a rejoint la partie ${codeValidation.value}`);

    socket.emit('game_joined', { gameCode: codeValidation.value });
    
    // Ajouter la partie aux parties en cours si l'utilisateur est connecté
    if (mongoConnected) {
      try {
        const user = await User.findOne({ username: pseudoValidation.value });
        if (user) {
          // Vérifier si la partie n'est pas déjà dans la liste
          const gameExists = user.currentGames.some(g => g.gameId === codeValidation.value);
          if (!gameExists) {
            user.currentGames.push({
              gameId: codeValidation.value,
              joinedAt: new Date(),
              lastActivityAt: new Date()
            });
            user.lastActivityAt = new Date();
            await user.save();
            console.log(`📝 Partie ajoutée aux parties en cours pour ${pseudoValidation.value}`);
          }
        }
      } catch (error) {
        console.error('Erreur mise à jour currentGames:', error);
      }
    }
    
    // Envoyer l'historique des messages au nouveau joueur
    if (game.chatMessages && game.chatMessages.length > 0) {
      game.chatMessages.forEach(msg => {
        socket.emit('chat_message', {
          playerNumber: msg.playerNumber,
          message: msg.message,
          timestamp: msg.timestamp
        });
      });
      console.log(`📜 ${game.chatMessages.length} messages envoyés à ${pseudoValidation.value}`);
    }
    
    updateRoom(gameCode);
  });

  // ==========================
  // EVENT: LANCER LA PARTIE
  // ==========================
  socket.on('start_game', async (data) => {
    // ✅ SÉCURITÉ : Seul le créateur authentifié peut lancer
    if (!socket.isAuthenticated) {
      console.log(`❌ Tentative de lancement sans auth depuis ${socket.ipAddress}`);
      return socket.emit('error', { 
        message: '🔒 Vous devez être connecté pour lancer une partie' 
      });
    }
    
    // Rate limiting
    const rateCheck = checkRateLimit(socket.userId, 'start_game', 3, 60000);
    if (!rateCheck.allowed) {
      socket.emit('error', { message: rateCheck.error });
      return;
    }
    
    const { gameCode, duration } = data;
    
    // Validation du code
    const codeValidation = validateGameCode(gameCode);
    if (!codeValidation.valid) {
      socket.emit('error', { message: codeValidation.error });
      return;
    }
    
    // Validation de la durée
    const durationValidation = validateDuration(duration);
    if (!durationValidation.valid) {
      socket.emit('error', { message: durationValidation.error });
      return;
    }
    
    const game = games[codeValidation.value];

    if (!game) {
      socket.emit('error', { message: 'Partie introuvable.' });
      return;
    }
    
    // Vérifier que c'est bien l'hôte qui démarre
    if (game.players[0].socketId !== socket.id) {
      console.log(`⚠️ Tentative de démarrage non autorisée par ${socket.id}`);
      socket.emit('error', { message: 'Seul l\'hôte peut démarrer la partie.' });
      return;
    }
    
    // Anti-triche : vérifier que la partie n'a pas déjà commencé
    if (game.status === 'PLAYING') {
      console.log(`⚠️ Tentative de redémarrage d'une partie en cours par ${socket.id}`);
      socket.emit('error', { message: 'La partie a déjà commencé.' });
      return;
    }

    if (game.players.length < 4) {
      socket.emit('error', { message: 'Il faut au moins 4 joueurs pour commencer.' });
      return;
    }
    
    // Anti-triche : vérifier que tous les joueurs sont connectés
    const disconnectedPlayers = game.players.filter(p => !p.socketId);
    if (disconnectedPlayers.length > 0) {
      console.log(`⚠️ Tentative de démarrage avec des joueurs déconnectés`);
      socket.emit('error', { message: 'Tous les joueurs doivent être connectés.' });
      return;
    }

    // Calculer les phases de jeu
    const gamePhases = calculateGamePhases(duration || 3600000, game.players.length);
    game.phases = gamePhases;
    game.currentPhase = 0;
    game.phaseStartTime = Date.now();

    console.log(`⏰ Partie ${gameCode} - Durée: ${duration}ms, Phases: ${gamePhases.numberOfPhases}`);

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

    // ÉTAPE 3.5 : Attribuer des numéros anonymes aléatoires pour le chat
    const shuffledForNumbers = [...game.players].sort(() => Math.random() - 0.5);
    shuffledForNumbers.forEach((player, index) => {
      player.anonymousNumber = index + 1;
    });

    // ÉTAPE 4 : Désigner les TRAÎTRES (si au moins 8 joueurs)
    if (game.players.length >= 8) {
      // Choisir un joueur de chaque équipe (sauf les représentants et tueurs)
      const bleusEligibles = bleus.filter(p => p.role === 'lambda');
      const rougesEligibles = rouges.filter(p => p.role === 'lambda');
      
      if (bleusEligibles.length > 0 && rougesEligibles.length > 0) {
        const traitre1 = bleusEligibles[Math.floor(Math.random() * bleusEligibles.length)];
        const traitre2 = rougesEligibles[Math.floor(Math.random() * rougesEligibles.length)];
        
        traitre1.isTraitor = true;
        traitre1.traitorPartnerSocketId = traitre2.socketId;
        traitre2.isTraitor = true;
        traitre2.traitorPartnerSocketId = traitre1.socketId;
        
        console.log(`🎭 Traîtres : ${traitre1.pseudo} (infiltré ${traitre1.team}) & ${traitre2.pseudo} (infiltré ${traitre2.team})`);
      }
    }

    // ÉTAPE 5 : Désigner les AMOUREUX (si au moins 6 joueurs et pas de traîtres en conflit)
    if (game.players.length >= 6) {
      // Choisir un joueur de chaque équipe (sauf les représentants et les traîtres)
      const bleusEligibles = bleus.filter(p => p.role !== 'representant' && !p.isTraitor);
      const rougesEligibles = rouges.filter(p => p.role !== 'representant' && !p.isTraitor);
      
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
    game.nextEventTime = game.phases.endTime;

    console.log(`🚀 La partie ${gameCode} a commencé ! Fin prévue : ${new Date(game.phases.endTime).toLocaleString('fr-FR')}`);

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

    // ÉTAPE 6 : Envoie du rôle SECRET à chaque joueur
    game.players.forEach(player => {
      const roleData = {
        team: player.team,
        role: player.role,
        munitions: player.munitions,
        isLover: player.isLover || false,
        isTraitor: player.isTraitor || false,
        anonymousNumber: player.anonymousNumber
      };
      
      // Si le joueur est traître, envoyer l'info de son partenaire
      if (player.isTraitor) {
        const partner = game.players.find(p => p.socketId === player.traitorPartnerSocketId);
        if (partner) {
          roleData.traitorInfo = {
            pseudo: partner.pseudo, // Le pseudo (nom réel du joueur)
            anonymousNumber: partner.anonymousNumber, // Le numéro de joueur anonyme
            team: partner.team, // L'équipe infiltrée
            role: partner.role // Le rôle dans l'équipe infiltrée
          };
        }
      }
      
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
  // EVENT: MESSAGE CHAT
  // ==========================
  socket.on('chat_message', async (data) => {
    // Rate limiting strict pour le chat
    const rateCheck = checkRateLimit(socket.id, 'chat_message', 20, 60000);
    if (!rateCheck.allowed) {
      socket.emit('error', { message: 'Trop de messages, ralentissez !' });
      return;
    }
    
    const { gameCode, message } = data;
    
    // Validation du code
    const codeValidation = validateGameCode(gameCode);
    if (!codeValidation.valid) return;
    
    // Validation du message
    const messageValidation = validateChatMessage(message);
    if (!messageValidation.valid) {
      socket.emit('error', { message: messageValidation.error });
      return;
    }
    
    const game = games[codeValidation.value];

    if (!game) return;
    
    // Trouver le joueur qui envoie le message
    const player = game.players.find(p => p.socketId === socket.id);
    if (!player || !player.isAlive) {
      socket.emit('error', { message: 'Vous ne pouvez pas envoyer de messages.' });
      return;
    }
    
    // Anti-triche : vérifier que la partie est en cours
    if (game.status !== 'PLAYING') {
      socket.emit('error', { message: 'Les messages ne sont disponibles qu\'en partie.' });
      return;
    }

    const chatMessage = {
      playerNumber: player.anonymousNumber,
      playerPseudo: player.pseudo,
      message: messageValidation.value, // Message nettoyé
      timestamp: Date.now()
    };

    // Stocker le message dans le jeu
    game.chatMessages.push(chatMessage);

    // Sauvegarder dans MongoDB si possible
    if (game.userId && mongoConnected) {
      try {
        await Game.findOneAndUpdate(
          { gameId: codeValidation.value },
          { 
            $push: { 
              chatMessages: {
                playerNumber: chatMessage.playerNumber,
                playerPseudo: chatMessage.playerPseudo,
                message: chatMessage.message,
                timestamp: new Date(chatMessage.timestamp)
              }
            }
          }
        );
      } catch (error) {
        console.error('Erreur lors de la sauvegarde du message:', error);
      }
    }

    // Envoyer le message à tous les joueurs de la partie avec le numéro anonyme
    game.players.forEach(p => {
      io.to(p.socketId).emit('chat_message', {
        playerNumber: chatMessage.playerNumber,
        message: chatMessage.message,
        timestamp: chatMessage.timestamp
      });
    });

    console.log(`💬 Partie ${gameCode} - Joueur ${player.anonymousNumber}: ${message.substring(0, 50)}`);
  });

  // ==========================
  // EVENT: VOTER
  // ==========================
  socket.on('cast_vote', (data) => {
    // ✅ Rate limiting adapté selon l'authentification
    const identifier = socket.isAuthenticated ? socket.userId : socket.ipAddress;
    const maxVotes = socket.isAuthenticated ? 10 : 5; // Plus permissif pour users auth
    const rateCheck = checkRateLimit(identifier, 'cast_vote', maxVotes, 60000);
    if (!rateCheck.allowed) {
      socket.emit('error', { message: rateCheck.error });
      return;
    }
    
    const { gameCode, targetSocketId } = data;
    
    // Validation du code
    const codeValidation = validateGameCode(gameCode);
    if (!codeValidation.valid) {
      socket.emit('error', { message: codeValidation.error });
      return;
    }
    
    // Validation de l'ID cible
    const targetValidation = validatePlayerId(targetSocketId);
    if (!targetValidation.valid) {
      socket.emit('error', { message: 'Cible invalide.' });
      return;
    }
    
    const game = games[codeValidation.value];

    if (!game || game.votingPhase !== 'VOTING') {
      socket.emit('error', { message: 'Le vote n\'est pas disponible actuellement.' });
      return;
    }

    // Trouver le joueur qui vote
    const voter = game.players.find(p => p.socketId === socket.id);
    if (!voter || !voter.isAlive) {
      socket.emit('error', { message: 'Vous ne pouvez pas voter.' });
      return;
    }

    // Vérifier que la cible existe et est vivante
    const target = game.players.find(p => p.socketId === targetValidation.value);
    if (!target || !target.isAlive) {
      socket.emit('error', { message: 'Ce joueur n\'est pas disponible.' });
      return;
    }
    
    // Empêcher le vote pour soi-même
    if (voter.socketId === target.socketId) {
      socket.emit('error', { message: 'Vous ne pouvez pas voter pour vous-même.' });
      return;
    }
    
    // Anti-triche : vérifier que le joueur n'a pas déjà voté
    if (voter.hasVoted) {
      console.log(`⚠️ Tentative de double vote par ${voter.pseudo} (${voter.socketId})`);
      socket.emit('error', { message: 'Vous avez déjà voté.' });
      return;
    }
    
    // Anti-triche : vérifier que la cible est de l'équipe adverse
    if (voter.team === target.team) {
      console.log(`⚠️ Tentative de vote pour son équipe par ${voter.pseudo}`);
      socket.emit('error', { message: 'Vous ne pouvez pas voter pour votre propre équipe.' });
      return;
    }

    // Enregistrer le vote selon l'équipe du votant
    if (voter.team === 'bleu') {
      // Retirer le vote précédent de ce joueur
      for (const targetId in game.blueVotes) {
        game.blueVotes[targetId] = game.blueVotes[targetId].filter(id => id !== voter.socketId);
        if (game.blueVotes[targetId].length === 0) {
          delete game.blueVotes[targetId];
        }
      }
      
      // Ajouter le nouveau vote
      if (!game.blueVotes[targetSocketId]) {
        game.blueVotes[targetSocketId] = [];
      }
      game.blueVotes[targetSocketId].push(voter.socketId);
      
    } else if (voter.team === 'rouge') {
      // Retirer le vote précédent de ce joueur
      for (const targetId in game.redVotes) {
        game.redVotes[targetId] = game.redVotes[targetId].filter(id => id !== voter.socketId);
        if (game.redVotes[targetId].length === 0) {
          delete game.redVotes[targetId];
        }
      }
      
      // Ajouter le nouveau vote
      if (!game.redVotes[targetSocketId]) {
        game.redVotes[targetSocketId] = [];
      }
      game.redVotes[targetSocketId].push(voter.socketId);
    }

    // Marquer le joueur comme ayant voté
    voter.hasVoted = true;

    // Confirmer le vote au joueur
    socket.emit('vote_confirmed', {
      targetNumber: target.anonymousNumber,
      targetPseudo: target.pseudo
    });

    console.log(`🗳️ Partie ${gameCode} - Joueur ${voter.anonymousNumber} (${voter.team}) vote pour éliminer Joueur ${target.anonymousNumber}`);
    
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

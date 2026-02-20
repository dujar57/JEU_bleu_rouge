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
const { ROLES, assignRoles, getRoleInfo, canUsePower } = require('./utils/roles');

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
  'https://jeu-bleu-rouge.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (same-origin, ex: même domaine)
    if (!origin) {
      return callback(null, true);
    }
    // Accepter les origins autorisées
    if (allowedOrigins.includes(origin)) {
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
// ⚠️ CSRF TEMPORAIREMENT DÉSACTIVÉ - À réactiver après tests
/*
const {
  generateToken, // Génère un token CSRF
  doubleCsrfProtection, // Middleware de protection
} = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET, // Utilise le même secret que JWT
  cookieName: 'csrf-token', // Simplifié pour éviter les problèmes __Host-
  cookieOptions: {
    sameSite: 'lax', // Changé de strict à lax pour plus de compatibilité
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
});
*/

// Appliquer la sanitization HTML sur toutes les entrées
app.use(sanitizeMiddleware);

// ⚠️ CSRF TEMPORAIREMENT DÉSACTIVÉ - À réactiver après tests
// Route pour obtenir un token CSRF
// app.get('/api/csrf-token', (req, res) => {
//   const csrfToken = generateToken(req, res);
//   res.json({ csrfToken });
// });

// app.use('/api/auth', doubleCsrfProtection);
// app.use('/api/game', doubleCsrfProtection);

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
    res.status(500).send('⚠️ Application non construite. Exécutez: npm run build');
  }
});

// Route catch-all pour React Router (doit être APRÈS les routes API)
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client', 'dist', 'index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('⚠️ Application non construite. Exécutez: npm run build');
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

// Système automatique de DÉTECTEURS (envoie des infos aléatoires)
setInterval(() => {
  for (const gameCode in games) {
    const game = games[gameCode];
    
    if (game.status !== 'PLAYING') continue;
    
    const detecteursJoueurs = game.players.filter(p => p.isAlive && p.role === 'detecteur_joueurs');
    const detecteursMetiers = game.players.filter(p => p.isAlive && p.role === 'detecteur_metiers');
    
    // Détecteurs de joueurs : envoie Nom réel → Pseudo
    detecteursJoueurs.forEach(detecteur => {
      // 30% de chance d'envoyer une info
      if (Math.random() < 0.3) {
        const alivePlayers = game.players.filter(p => p.isAlive && p.socketId !== detecteur.socketId);
        if (alivePlayers.length > 0) {
          const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
          
          // AGENT DOUBLE : Apparaît dans l'équipe adverse
          let displayedTeam = target.team;
          if (target.role === 'agent_double') {
            displayedTeam = target.team === 'bleu' ? 'rouge' : 'bleu';
          }
          
          io.to(detecteur.socketId).emit('detective_info', {
            type: 'player',
            realName: target.pseudo, // Nom réel
            anonymousNumber: target.anonymousNumber, // Pseudo dans le jeu
            team: displayedTeam,
            message: `🔍 DÉTECTION : ${target.pseudo} est le Joueur #${target.anonymousNumber} (Équipe ${displayedTeam === 'bleu' ? '🔵 Bleue' : '🔴 Rouge'})`
          });
          
          console.log(`🔍 Détecteur Joueurs (${detecteur.pseudo}) a reçu : ${target.pseudo} = Joueur #${target.anonymousNumber} ${target.role === 'agent_double' ? '(AGENT DOUBLE - fausse équipe)' : ''}`);
        }
      }
    });
    
    // Détecteurs de métiers : envoie Rôle → Pseudo
    detecteursMetiers.forEach(detecteur => {
      // 30% de chance d'envoyer une info
      if (Math.random() < 0.3) {
        const alivePlayers = game.players.filter(p => p.isAlive && p.socketId !== detecteur.socketId);
        if (alivePlayers.length > 0) {
          const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
          const roleInfo = getRoleInfo(target.role);
          
          // AGENT DOUBLE : Apparaît dans l'équipe adverse
          let displayedTeam = target.team;
          if (target.role === 'agent_double') {
            displayedTeam = target.team === 'bleu' ? 'rouge' : 'bleu';
          }
          
          io.to(detecteur.socketId).emit('detective_info', {
            type: 'role',
            anonymousNumber: target.anonymousNumber,
            role: roleInfo.name,
            roleEmoji: roleInfo.emoji,
            team: displayedTeam,
            message: `🕵️ DÉTECTION : Le Joueur #${target.anonymousNumber} est ${roleInfo.emoji} ${roleInfo.name} (Équipe ${displayedTeam === 'bleu' ? '🔵 Bleue' : '🔴 Rouge'})`
          });
          
          console.log(`🕵️ Détecteur Métiers (${detecteur.pseudo}) a reçu : Joueur #${target.anonymousNumber} = ${roleInfo.name} ${target.role === 'agent_double' ? '(AGENT DOUBLE - fausse équipe)' : ''}`);
        }
      }
    });
  }
}, 15000); // Toutes les 15 secondes

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
      // Utiliser userId si présent sur le joueur
      if (!player.userId) continue;
      const user = await User.findById(player.userId);
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
      console.log(`📊 Historique sauvegardé pour userId=${player.userId}`);
    } catch (error) {
      console.error(`Erreur sauvegarde historique pour userId=${player.userId}:`, error);
    }
  }
}

// Notifie tous les joueurs du changement de phase de vote
function notifyVotingPhase(gameCode, phase, voteInfo) {
  const game = games[gameCode];
  if (!game) return;
  
  // Trouver le prochain vote
  const nextVoteIndex = game.currentVoteNumber + 1;
  const nextVote = game.phases.voteSchedule[nextVoteIndex];
  
  game.players.forEach(player => {
    io.to(player.socketId).emit('voting_phase_change', {
      phase: phase,
      voteNumber: game.currentVoteNumber + 1,
      totalVotes: game.phases.numberOfVotes,
      discussionEnd: voteInfo.votingStart,
      votingEnd: voteInfo.endTime,
      nextVoteStart: nextVote ? nextVote.votingStart : null, // Temps avant le PROCHAIN vote
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
  
  // Compter les votes des BLEUS (en excluant les joueurs cryptés)
  const blueVoteCount = {};
  for (const targetId in game.blueVotes) {
    const target = game.players.find(p => p.socketId === targetId);
    // Si la cible est cryptée, les votes ne comptent pas
    if (target && !target.crypted) {
      blueVoteCount[targetId] = game.blueVotes[targetId].length;
    }
  }
  
  // Compter les votes des ROUGES (en excluant les joueurs cryptés)
  const redVoteCount = {};
  for (const targetId in game.redVotes) {
    const target = game.players.find(p => p.socketId === targetId);
    // Si la cible est cryptée, les votes ne comptent pas
    if (target && !target.crypted) {
      redVoteCount[targetId] = game.redVotes[targetId].length;
    }
  }
  
  const deadPlayers = [];
  
  // Trouver le joueur le plus voté par les BLEUS
  if (Object.keys(blueVoteCount).length > 0) {
    const maxBlueVotes = Math.max(...Object.values(blueVoteCount));
    let blueTargets = Object.keys(blueVoteCount).filter(id => blueVoteCount[id] === maxBlueVotes);
    
    // JUGE : Si égalité et qu'un juge existe, c'est son vote qui compte
    if (blueTargets.length > 1) {
      const juge = game.players.find(p => p.isAlive && p.team === 'bleu' && p.role === 'juge');
      if (juge) {
        // Trouver pour qui le juge a voté
        const jugeVote = blueTargets.find(targetId => 
          game.blueVotes[targetId] && game.blueVotes[targetId].includes(juge.socketId)
        );
        if (jugeVote) {
          blueTargets = [jugeVote];
          console.log(`⚖️ JUGE décide pour l'équipe Bleue: Joueur éliminé`);
        }
      }
    }
    
    // En cas d'égalité persistante, choisir aléatoirement
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
    let redTargets = Object.keys(redVoteCount).filter(id => redVoteCount[id] === maxRedVotes);
    
    // JUGE : Si égalité et qu'un juge existe, c'est son vote qui compte
    if (redTargets.length > 1) {
      const juge = game.players.find(p => p.isAlive && p.team === 'rouge' && p.role === 'juge');
      if (juge) {
        // Trouver pour qui le juge a voté
        const jugeVote = redTargets.find(targetId => 
          game.redVotes[targetId] && game.redVotes[targetId].includes(juge.socketId)
        );
        if (jugeVote) {
          redTargets = [jugeVote];
          console.log(`⚖️ JUGE décide pour l'équipe Rouge: Joueur éliminé`);
        }
      }
    }
    
    // En cas d'égalité persistante, choisir aléatoirement
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
    // Stocker les condamnés pour que le Boulanger puisse les sauver
    game.condemned = deadPlayers.map(dp => ({
      socketId: game.players.find(p => p.pseudo === dp.pseudo)?.socketId,
      pseudo: dp.pseudo,
      team: dp.team,
      reason: dp.reason
    })).filter(c => c.socketId);
    
    game.players.forEach(player => {
      io.to(player.socketId).emit('vote_results', {
        eliminated: deadPlayers,
        message: `💀 ${deadPlayers.length} joueur(s) éliminé(s) par vote`
      });
    });
    
    console.log(`💀 Partie ${gameCode} - ${deadPlayers.length} joueur(s) éliminé(s) :`, 
      deadPlayers.map(p => `${p.pseudo} (${p.reason})`).join(', '));
    
    // BOULANGER : Notifier les boulangers qu'ils peuvent sauver quelqu'un
    const boulangers = game.players.filter(p => p.isAlive && p.role === 'boulanger');
    boulangers.forEach(boulanger => {
      // Trouver les condamnés de la même équipe
      const saveableTargets = game.condemned.filter(c => c.team === boulanger.team);
      
      if (saveableTargets.length > 0) {
        io.to(boulanger.socketId).emit('baker_can_save', {
          targets: saveableTargets,
          message: `🍞 BOULANGER ! Un membre de votre équipe va être éliminé. Vous avez 30 secondes pour le sauver !`
        });
        console.log(`🍞 Boulanger ${boulanger.pseudo} peut sauver: ${saveableTargets.map(t => t.pseudo).join(', ')}`);
      }
    });
    
    // Après 30 secondes, tuer définitivement ceux qui n'ont pas été sauvés
    setTimeout(() => {
      if (game.condemned && game.condemned.length > 0) {
        game.condemned.forEach(condemned => {
          const player = game.players.find(p => p.socketId === condemned.socketId);
          if (player && !player.isRevived) {
            // Tuer définitivement
            player.isAlive = false;
          }
        });
        game.condemned = [];
        updateRoom(gameCode);
      }
    }, 30000);
  } else {
    // Aucun vote ou aucune élimination
    game.players.forEach(player => {
      io.to(player.socketId).emit('vote_results', {
        eliminated: [],
        message: '🤷 Aucune élimination - Pas assez de votes'
      });
    });
  }
  
  // ÉLECTION DU REPRÉSENTANT après le 1er vote
  if (!game.representantElected && game.currentVoteNumber >= 1) {
    electRepresentants(gameCode);
  }
  
  // Nettoyer les effets temporaires de ce tour
  cleanupTurnEffects(game);
  
  updateRoom(gameCode);
}

// ==========================
// FONCTIONS UTILITAIRES
// ==========================

// Nettoie les effets temporaires d'un tour
function cleanupTurnEffects(game) {
  // Retirer les protections
  game.players.forEach(p => {
    p.protected = false;
    p.protectedBy = null;
  });
  
  // Retirer le cryptage
  game.players.forEach(p => {
    p.crypted = false;
    p.cryptedBy = null;
  });
  
  // Les joueurs réanimés meurent maintenant
  game.players.forEach(p => {
    if (p.isRevived) {
      p.isAlive = false;
      p.isRevived = false;
      p.canRevivedKill = false;
      p.revivedBy = null;
      console.log(`💀 ${p.pseudo} meurt après avoir été réanimé (fin du tour de grâce)`);
    }
  });
  
  // Annuler l'échange de pseudos du hacker si le tour est terminé
  if (game.pseudoSwap && game.currentTurn >= game.pseudoSwap.turnEnd) {
    const player1 = game.players.find(p => p.socketId === game.pseudoSwap.target1);
    const player2 = game.players.find(p => p.socketId === game.pseudoSwap.target2);
    
    if (player1 && player2) {
      // Remettre les pseudos originaux
      player1.anonymousNumber = game.pseudoSwap.originalNumber1;
      player2.anonymousNumber = game.pseudoSwap.originalNumber2;
      
      console.log(`💻 Échange de pseudos annulé - retour à la normale`);
    }
    
    game.pseudoSwap = null;
  }
  
  // Recharger les munitions des tueurs (1 balle par tour)
  game.players.forEach(p => {
    if (p.isAlive && p.role === 'tueur') {
      const roleInfo = getRoleInfo(p.role);
      p.munitions = roleInfo.powers.killsPerDay || 1;
      console.log(`🔫 Tueur ${p.anonymousNumber} - munition rechargée (${p.munitions})`);
    }
  });
  
  // Incrémenter le compteur de tours
  game.currentTurn++;
  
  console.log(`🔄 Tour ${game.currentTurn} - Effets temporaires nettoyés`);
}

// Élit les représentants après le 1er vote
function electRepresentants(gameCode) {
  const game = games[gameCode];
  if (!game || game.representantElected) return;
  
  const blueAlive = game.players.filter(p => p.team === 'bleu' && p.isAlive);
  const redAlive = game.players.filter(p => p.team === 'rouge' && p.isAlive);
  
  let blueRep = null;
  let redRep = null;
  
  // Élire un représentant bleu aléatoire
  if (blueAlive.length > 0) {
    blueRep = blueAlive[Math.floor(Math.random() * blueAlive.length)];
    blueRep.isRepresentant = true;
    console.log(`👑 Représentant BLEU élu : Joueur ${blueRep.anonymousNumber} (${blueRep.pseudo}) - Rôle : ${blueRep.role}${blueRep.isTraitor ? ' 🎭 TRAÎTRE' : ''}`);
  }
  
  // Élire un représentant rouge aléatoire
  if (redAlive.length > 0) {
    redRep = redAlive[Math.floor(Math.random() * redAlive.length)];
    redRep.isRepresentant = true;
    console.log(`👑 Représentant ROUGE élu : Joueur ${redRep.anonymousNumber} (${redRep.pseudo}) - Rôle : ${redRep.role}${redRep.isTraitor ? ' 🎭 TRAÎTRE' : ''}`);
  }
  
  game.representantElected = true;
  
  // Notifier tous les joueurs de l'élection
  game.players.forEach(player => {
    const message = {
      blueRep: blueRep ? blueRep.anonymousNumber : null,
      redRep: redRep ? redRep.anonymousNumber : null,
      message: '👑 ÉLECTION : Les représentants ont été élus (par leur numéro de joueur) ! Ils connaissent tous les membres de leur équipe et sont immunisés contre les tueurs.'
    };
    
    // Si le joueur est le représentant, lui envoyer des infos supplémentaires
    if (player.isRepresentant) {
      const teamMates = game.players.filter(p => 
        p.team === player.team && 
        p.isAlive && 
        p.socketId !== player.socketId &&
        !p.isTraitor
      );
      
      message.youAreRep = true;
      message.teamMates = teamMates.map(p => ({
        pseudo: p.pseudo,
        anonymousNumber: p.anonymousNumber,
        realLifeInfo: p.realLifeInfo,
        role: p.role
      }));
    }
    
    io.to(player.socketId).emit('representant_elected', message);
  });
  
  updateRoom(gameCode);
}

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
  const blueRepAlive = alivePlayers.some(p => p.team === 'bleu' && p.isRepresentant);
  const redRepAlive = alivePlayers.some(p => p.team === 'rouge' && p.isRepresentant);
  
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
      munitions: 0,
      userId: socket.userId || null // Lier au user authentifié si présent
    });

    socket.join(codeValidation.value);
    console.log(`👥 ${pseudoValidation.value} a rejoint la partie ${codeValidation.value}`);

    socket.emit('game_joined', { gameCode: codeValidation.value });
    
    // Ajouter la partie aux parties en cours si l'utilisateur est connecté
    if (mongoConnected && socket.userId) {
      try {
        const user = await User.findById(socket.userId);
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
            console.log(`📝 Partie ajoutée aux parties en cours pour userId=${socket.userId}`);
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

    // ÉTAPE 3 : Attribution des rôles (SANS REPRÉSENTANT - il sera élu après le 1er vote)
    // Assigne l'équipe
    bleus.forEach(p => {
      p.team = 'bleu';
      p.role = 'lambda'; // Par défaut
      p.isAlive = true;
      p.hasVoted = false;
    });
    rouges.forEach(p => {
      p.team = 'rouge';
      p.role = 'lambda'; // Par défaut
      p.isAlive = true;
      p.hasVoted = false;
    });

    // Met à jour le tableau des joueurs
    game.players = [...bleus, ...rouges];

    // ÉTAPE 3.5 : Attribuer des numéros anonymes aléatoires pour le chat
    const shuffledForNumbers = [...game.players].sort(() => Math.random() - 0.5);
    shuffledForNumbers.forEach((player, index) => {
      player.anonymousNumber = index + 1;
    });

    // ÉTAPE 4 : Désigner les TRAÎTRES (si au moins 8 joueurs)
    let traitors = [];
    if (game.players.length >= 8) {
      // Choisir un joueur lambda de chaque équipe
      const bleusForTraitors = bleus.filter(p => p.role === 'lambda');
      const rougesForTraitors = rouges.filter(p => p.role === 'lambda');
      
      if (bleusForTraitors.length > 0 && rougesForTraitors.length > 0) {
        const traitre1 = bleusForTraitors[Math.floor(Math.random() * bleusForTraitors.length)];
        const traitre2 = rougesForTraitors[Math.floor(Math.random() * rougesForTraitors.length)];
        
        traitre1.isTraitor = true;
        traitre1.traitorPartnerSocketId = traitre2.socketId;
        traitre2.isTraitor = true;
        traitre2.traitorPartnerSocketId = traitre1.socketId;
        
        traitors = [traitre1, traitre2];
        
        console.log(`🎭 Traîtres : ${traitre1.pseudo} (infiltré ${traitre1.team}) & ${traitre2.pseudo} (infiltré ${traitre2.team})`);
      }
    }

    // ÉTAPE 5 : Désigner les AMOUREUX (si au moins 6 joueurs et pas de traîtres en conflit)
    if (game.players.length >= 6) {
      // Choisir un joueur de chaque équipe (sauf les traîtres)
      const bleusEligibles = bleus.filter(p => !p.isTraitor);
      const rougesEligibles = rouges.filter(p => !p.isTraitor);
      
      if (bleusEligibles.length > 0 && rougesEligibles.length > 0) {
        const amoureux1 = bleusEligibles[Math.floor(Math.random() * bleusEligibles.length)];
        const amoureux2 = rougesEligibles[Math.floor(Math.random() * rougesEligibles.length)];
        
        amoureux1.isLover = true;
        amoureux1.loverSocketId = amoureux2.socketId;
        amoureux1.loverRealName = amoureux2.pseudo; // Ils se connaissent par leur NOM RÉEL
        amoureux2.isLover = true;
        amoureux2.loverSocketId = amoureux1.socketId;
        amoureux2.loverRealName = amoureux1.pseudo; // Ils se connaissent par leur NOM RÉEL
        
        console.log(`💕 Amoureux : ${amoureux1.pseudo} (${amoureux1.team}) ❤️ ${amoureux2.pseudo} (${amoureux2.team})`);
        console.log(`   Ils se connaissent par leur NOM RÉEL (pas leur pseudo)`);
      }
    }
    
    // ÉTAPE 6 : Attribution des RÔLES avec le nouveau système
    assignRoles(game.players, traitors);
    
    // Attribuer les propriétés spécifiques des rôles
    game.players.forEach(player => {
      const roleInfo = getRoleInfo(player.role);
      if (roleInfo.powers.kill) {
        player.munitions = roleInfo.powers.killsPerDay || 1;
        player.lastKillTurn = -1; // Pour suivre le cooldown
      }
      if (roleInfo.powers.usesPerGame !== undefined) {
        player.powerUses = roleInfo.powers.usesPerGame;
      }
      // Initialiser d'autres propriétés selon les pouvoirs
      player.protected = false;
      player.crypted = false;
    });
    
    console.log(`🎮 Rôles attribués :`, game.players.map(p => 
      `${p.pseudo} (${p.team}) - ${getRoleInfo(p.role).name} ${p.isTraitor ? '🎭' : ''}`).join(', '));
    game.status = 'PLAYING';
    game.nextEventTime = game.phases.endTime;
    game.representantElected = false; // Sera true après le 1er vote
    game.currentTurn = 0; // Compteur de tours

    console.log(`🚀 La partie ${gameCode} a commencé ! Fin prévue : ${new Date(game.phases.endTime).toLocaleString('fr-FR')}`);
    console.log(`⚠️ IMPORTANT : Les représentants seront élus après le premier vote !`);

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

    // ÉTAPE 7 : Envoie du rôle SECRET à chaque joueur
    game.players.forEach(player => {
      const roleInfo = getRoleInfo(player.role);
      const roleData = {
        team: player.team,
        role: player.role,
        roleInfo: {
          name: roleInfo.name,
          emoji: roleInfo.emoji,
          description: roleInfo.description,
          powers: roleInfo.powers
        },
        munitions: player.munitions || 0,
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
      
      // Si le joueur est amoureux, envoyer l'info de son partenaire (PAR NOM RÉEL)
      if (player.isLover) {
        const lover = game.players.find(p => p.socketId === player.loverSocketId);
        if (lover) {
          roleData.loverInfo = {
            realName: lover.pseudo, // NOM RÉEL (pas le pseudo de jeu)
            team: lover.team,
            role: lover.role
          };
          roleData.loverRealName = lover.pseudo; // Pour affichage direct
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
    if (!player) {
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
    console.log(`💬 Envoi du message à ${game.players.length} joueurs dans la partie ${gameCode}`);
    game.players.forEach(p => {
      console.log(`  → Envoi à ${p.pseudo} (socketId: ${p.socketId})`);
      io.to(p.socketId).emit('chat_message', {
        playerNumber: chatMessage.playerNumber,
        message: chatMessage.message,
        timestamp: chatMessage.timestamp
      });
    });

    console.log(`💬 Partie ${gameCode} - Joueur ${player.anonymousNumber} (${player.pseudo}): ${message.substring(0, 50)}`);
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
      
      // INFLUENCEUR : Vote compte TRIPLE
      if (voter.role === 'influenceur' && !voter.influenceurUsed) {
        game.blueVotes[targetSocketId].push(voter.socketId); // Vote 2
        game.blueVotes[targetSocketId].push(voter.socketId); // Vote 3
        voter.influenceurUsed = true;
        
        // Révéler l'équipe de l'influenceur à tous
        game.players.forEach(player => {
          io.to(player.socketId).emit('action_confirmed', {
            message: `📢 RÉVÉLATION ! Le Joueur ${voter.anonymousNumber} est un INFLUENCEUR de l'équipe BLEUE ! Son vote compte TRIPLE !`
          });
        });
        
        console.log(`📢 INFLUENCEUR ${voter.pseudo} (équipe bleue) utilise son pouvoir - vote x3`);
      }
      
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
      
      // INFLUENCEUR : Vote compte TRIPLE
      if (voter.role === 'influenceur' && !voter.influenceurUsed) {
        game.redVotes[targetSocketId].push(voter.socketId); // Vote 2
        game.redVotes[targetSocketId].push(voter.socketId); // Vote 3
        voter.influenceurUsed = true;
        
        // Révéler l'équipe de l'influenceur à tous
        game.players.forEach(player => {
          io.to(player.socketId).emit('action_confirmed', {
            message: `📢 RÉVÉLATION ! Le Joueur ${voter.anonymousNumber} est un INFLUENCEUR de l'équipe ROUGE ! Son vote compte TRIPLE !`
          });
        });
        
        console.log(`📢 INFLUENCEUR ${voter.pseudo} (équipe rouge) utilise son pouvoir - vote x3`);
      }
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
  // EVENT: UTILISER LE POUVOIR DU TUEUR
  // ==========================
  socket.on('use_killer_power', (data) => {
    const { gameCode, targetSocketId } = data;
    
    // Validation
    const codeValidation = validateGameCode(gameCode);
    if (!codeValidation.valid) {
      socket.emit('error', { message: codeValidation.error });
      return;
    }
    
    const targetValidation = validatePlayerId(targetSocketId);
    if (!targetValidation.valid) {
      socket.emit('error', { message: 'Cible invalide.' });
      return;
    }
    
    const game = games[codeValidation.value];
    if (!game || game.status !== 'PLAYING') {
      socket.emit('error', { message: 'La partie n\'est pas en cours.' });
      return;
    }
    
    // Trouver le tueur
    const killer = game.players.find(p => p.socketId === socket.id);
    if (!killer || !killer.isAlive) {
      socket.emit('error', { message: 'Vous ne pouvez pas utiliser ce pouvoir.' });
      return;
    }
    
    // Vérifier que c'est bien un tueur ou un killeurs
    const roleInfo = getRoleInfo(killer.role);
    if (!roleInfo.powers.kill) {
      socket.emit('error', { message: 'Vous n\'avez pas le pouvoir de tuer.' });
      return;
    }
    
    // Vérifier les munitions
    if (killer.munitions <= 0) {
      socket.emit('error', { message: 'Vous n\'avez plus de munitions.' });
      return;
    }
    
    // Vérifier le cooldown pour les killeurs
    if (killer.role === 'killeurs' && roleInfo.powers.killsEvery) {
      const turnsSinceLastKill = game.currentTurn - (killer.lastKillTurn || -999);
      if (turnsSinceLastKill < roleInfo.powers.killsEvery) {
        socket.emit('error', { 
          message: `Vous devez attendre ${roleInfo.powers.killsEvery - turnsSinceLastKill} tour(s) de plus.` 
        });
        return;
      }
    }
    
    // Trouver la cible
    const target = game.players.find(p => p.socketId === targetValidation.value);
    if (!target || !target.isAlive) {
      socket.emit('error', { message: 'Cette cible n\'est pas disponible.' });
      return;
    }
    
    // Vérifier si la cible est un représentant (immunisé contre les tueurs)
    if (target.isRepresentant) {
      socket.emit('error', { message: 'Le représentant est immunisé contre les tueurs !' });
      return;
    }
    
    // Vérifier si la cible est protégée
    if (target.protected) {
      // Révéler le tueur (gardien de la paix)
      game.players.forEach(p => {
        io.to(p.socketId).emit('killer_revealed', {
          killerNumber: killer.anonymousNumber,
          killerPseudo: killer.pseudo,
          targetNumber: target.anonymousNumber,
          message: `🛡️ PROTECTION ! Joueur ${target.anonymousNumber} était protégé. Le tueur Joueur ${killer.anonymousNumber} est révélé !`
        });
      });
      console.log(`🛡️ Partie ${gameCode} - Tueur ${killer.anonymousNumber} révélé en attaquant ${target.anonymousNumber}`);
      return;
    }
    
    // RÈGLE CRITIQUE : Si tueur tue quelqu'un de sa propre équipe, il meurt aussi !
    let killerDiesAlso = false;
    if (roleInfo.powers.dieIfKillsTeammate && killer.team === target.team && !killer.isTraitor) {
      killerDiesAlso = true;
    }
    
    // Consommer la munition
    killer.munitions--;
    killer.lastKillTurn = game.currentTurn;
    
    // Éliminer la cible
    const deadPlayers = killPlayer(game, target, `tué par un Tueur`);
    
    // Si le tueur doit mourir aussi
    if (killerDiesAlso) {
      const killerDeaths = killPlayer(game, killer, `mort pour avoir tué un membre de sa propre équipe`);
      deadPlayers.push(...killerDeaths);
      
      console.log(`💀 Partie ${gameCode} - LE TUEUR ${killer.pseudo} MEURT pour avoir tué ${target.pseudo} de sa propre équipe !`);
    }
    
    // Notifier tous les joueurs
    game.players.forEach(p => {
      io.to(p.socketId).emit('killer_action', {
        eliminated: deadPlayers,
        message: killerDiesAlso 
          ? `💀 Un tueur a tué quelqu'un de sa propre équipe et en est mort !`
          : `💀 Un tueur a frappé !`
      });
    });
    
    console.log(`🔪 Partie ${gameCode} - Tueur ${killer.anonymousNumber} a tué ${target.anonymousNumber}${killerDiesAlso ? ' ET EN EST MORT !' : ''}`);
    
    // Vérifier les conditions de victoire
    const victory = checkVictoryConditions(game);
    if (victory) {
      endGameWithWinner(gameCode, victory);
    } else {
      updateRoom(gameCode);
    }
  });

  // ==========================
  // EVENT: GARDIEN DE LA PAIX - Protéger un joueur
  // ==========================
  socket.on('protect_player', (data) => {
    const { gameCode, targetSocketId } = data;
    
    const codeValidation = validateGameCode(gameCode);
    const targetValidation = validatePlayerId(targetSocketId);
    
    if (!codeValidation.valid || !targetValidation.valid) {
      socket.emit('error', { message: 'Données invalides.' });
      return;
    }
    
    const game = games[codeValidation.value];
    if (!game || game.status !== 'PLAYING') {
      socket.emit('error', { message: 'La partie n\'est pas en cours.' });
      return;
    }
    
    const gardien = game.players.find(p => p.socketId === socket.id);
    if (!gardien || !gardien.isAlive || gardien.role !== 'gardien_paix') {
      socket.emit('error', { message: 'Vous n\'êtes pas le gardien de la paix.' });
      return;
    }
    
    const target = game.players.find(p => p.socketId === targetValidation.value);
    if (!target || !target.isAlive) {
      socket.emit('error', { message: 'Cette cible n\'est pas disponible.' });
      return;
    }
    
    // Retirer la protection précédente
    game.players.forEach(p => p.protected = false);
    
    // Protéger la nouvelle cible
    target.protected = true;
    target.protectedBy = gardien.socketId;
    
    socket.emit('action_confirmed', {
      message: `🛡️ Vous protégez le Joueur #${target.anonymousNumber} ce tour`
    });
    
    console.log(`🛡️ Partie ${gameCode} - Gardien ${gardien.anonymousNumber} protège Joueur #${target.anonymousNumber}`);
  });

  // ==========================
  // EVENT: CYBERPOMPIER - Crypter un joueur
  // ==========================
  socket.on('crypt_player', (data) => {
    const { gameCode, targetSocketId } = data;
    
    const codeValidation = validateGameCode(gameCode);
    const targetValidation = validatePlayerId(targetSocketId);
    
    if (!codeValidation.valid || !targetValidation.valid) {
      socket.emit('error', { message: 'Données invalides.' });
      return;
    }
    
    const game = games[codeValidation.value];
    if (!game || game.status !== 'PLAYING') {
      socket.emit('error', { message: 'La partie n\'est pas en cours.' });
      return;
    }
    
    const pompier = game.players.find(p => p.socketId === socket.id);
    if (!pompier || !pompier.isAlive || pompier.role !== 'cyberpompier') {
      socket.emit('error', { message: 'Vous n\'êtes pas le cyberpompier.' });
      return;
    }
    
    const target = game.players.find(p => p.socketId === targetValidation.value);
    if (!target || !target.isAlive) {
      socket.emit('error', { message: 'Cette cible n\'est pas disponible.' });
      return;
    }
    
    // Retirer le cryptage précédent
    game.players.forEach(p => p.crypted = false);
    
    // Crypter la nouvelle cible
    target.crypted = true;
    target.cryptedBy = pompier.socketId;
    
    socket.emit('action_confirmed', {
      message: `👨‍🚒 Vous cryptez le Joueur #${target.anonymousNumber}. Les votes contre lui ne compteront pas ce tour.`
    });
    
    console.log(`👨‍🚒 Partie ${gameCode} - Cyberpompier ${pompier.anonymousNumber} crypte Joueur #${target.anonymousNumber}`);
  });

  // ==========================
  // EVENT: JOURNALISTE - Poser une question
  // ==========================
  socket.on('ask_question', (data) => {
    const { gameCode, targetSocketId, questionType } = data;
    
    const codeValidation = validateGameCode(gameCode);
    const targetValidation = validatePlayerId(targetSocketId);
    
    if (!codeValidation.valid || !targetValidation.valid) {
      socket.emit('error', { message: 'Données invalides.' });
      return;
    }
    
    const game = games[codeValidation.value];
    if (!game || game.status !== 'PLAYING') {
      socket.emit('error', { message: 'La partie n\'est pas en cours.' });
      return;
    }
    
    const journaliste = game.players.find(p => p.socketId === socket.id);
    if (!journaliste || !journaliste.isAlive || journaliste.role !== 'journaliste') {
      socket.emit('error', { message: 'Vous n\'êtes pas le journaliste.' });
      return;
    }
    
    // Vérifier le cooldown (1 question par tour)
    if (journaliste.lastQuestionTurn === game.currentTurn) {
      socket.emit('error', { message: 'Vous avez déjà posé une question ce tour.' });
      return;
    }
    
    const target = game.players.find(p => p.socketId === targetValidation.value);
    if (!target || !target.isAlive) {
      socket.emit('error', { message: 'Cette cible n\'est pas disponible.' });
      return;
    }
    
    // Préparer la réponse
    let answer = '';
    let truthful = Math.random() > 0.33; // 2/3 de chance d'être vrai
    
    if (questionType === 'isTraitor') {
      answer = truthful ? (target.isTraitor ? 'OUI' : 'NON') : (target.isTraitor ? 'NON' : 'OUI');
    } else if (questionType === 'team') {
      answer = truthful ? target.team : (target.team === 'bleu' ? 'rouge' : 'bleu');
    } else if (questionType === 'role') {
      const roleInfo = getRoleInfo(target.role);
      answer = truthful ? roleInfo.name : getRoleInfo('lambda').name;
    }
    
    journaliste.lastQuestionTurn = game.currentTurn;
    
    // Envoyer la réponse à TOUS les joueurs (publique)
    const message = {
      question: `Le Joueur #${target.anonymousNumber} ${questionType === 'isTraitor' ? 'est-il un traître ?' : questionType === 'team' ? 'de quelle équipe ?' : 'quel est son rôle ?'}`,
      answer: answer,
      warning: '⚠️ Cette réponse a 1 chance sur 3 d\'être fausse !',
      askedBy: journaliste.anonymousNumber
    };
    
    game.players.forEach(p => {
      io.to(p.socketId).emit('journalist_answer', message);
    });
    
    console.log(`📰 Partie ${gameCode} - Journaliste ${journaliste.anonymousNumber} demande: Joueur #${target.anonymousNumber} ${questionType} → ${answer} (${truthful ? 'vrai' : 'faux'})`);
  });

  // ==========================
  // EVENT: STALKER - Enquêter sur un nom réel
  // ==========================
  socket.on('investigate_name', (data) => {
    const { gameCode, realName } = data;
    
    const codeValidation = validateGameCode(gameCode);
    if (!codeValidation.valid) {
      socket.emit('error', { message: 'Code de partie invalide.' });
      return;
    }
    
    const game = games[codeValidation.value];
    if (!game || game.status !== 'PLAYING') {
      socket.emit('error', { message: 'La partie n\'est pas en cours.' });
      return;
    }
    
    const stalker = game.players.find(p => p.socketId === socket.id);
    if (!stalker || !stalker.isAlive || stalker.role !== 'stalker') {
      socket.emit('error', { message: 'Vous n\'êtes pas le stalker.' });
      return;
    }
    
    // Vérifier le cooldown
    if (stalker.lastInvestigationTurn === game.currentTurn) {
      socket.emit('error', { message: 'Vous avez déjà enquêté ce tour.' });
      return;
    }
    
    // Chercher le joueur par nom réel
    const target = game.players.find(p => 
      p.pseudo.toLowerCase() === realName.toLowerCase() && 
      p.isAlive &&
      p.socketId !== stalker.socketId
    );
    
    if (!target) {
      socket.emit('error', { message: 'Aucun joueur trouvé avec ce nom.' });
      return;
    }
    
    stalker.lastInvestigationTurn = game.currentTurn;
    
    // Donner un indice sur le pseudo
    const number = target.anonymousNumber;
    let hint = '';
    
    const hints = [
      `Le pseudo est ${number % 2 === 0 ? 'un nombre PAIR' : 'un nombre IMPAIR'}`,
      `Le pseudo commence par "${String(number).charAt(0)}"`,
      `Le pseudo contient ${String(number).length} chiffre(s)`,
      number < 50 ? 'Le pseudo est INFÉRIEUR à 50' : 'Le pseudo est SUPÉRIEUR ou égal à 50'
    ];
    
    hint = hints[Math.floor(Math.random() * hints.length)];
    
    socket.emit('investigation_result', {
      realName: realName,
      hint: hint,
      message: `🎯 ENQUÊTE sur ${realName}: ${hint}`
    });
    
    console.log(`🎯 Partie ${gameCode} - Stalker ${stalker.anonymousNumber} enquête sur ${realName} (Joueur #${number}) → ${hint}`);
  });

  // ==========================
  // EVENT: HACKER - Échanger deux pseudos
  // ==========================
  socket.on('swap_pseudos', (data) => {
    const { gameCode, target1SocketId, target2SocketId } = data;
    
    const codeValidation = validateGameCode(gameCode);
    const target1Validation = validatePlayerId(target1SocketId);
    const target2Validation = validatePlayerId(target2SocketId);
    
    if (!codeValidation.valid || !target1Validation.valid || !target2Validation.valid) {
      socket.emit('error', { message: 'Données invalides.' });
      return;
    }
    
    const game = games[codeValidation.value];
    if (!game || game.status !== 'PLAYING') {
      socket.emit('error', { message: 'La partie n\'est pas en cours.' });
      return;
    }
    
    const hacker = game.players.find(p => p.socketId === socket.id);
    if (!hacker || !hacker.isAlive || hacker.role !== 'hacker') {
      socket.emit('error', { message: 'Vous n\'êtes pas le hacker.' });
      return;
    }
    
    // Vérifier les utilisations restantes
    if (!hacker.powerUses || hacker.powerUses <= 0) {
      socket.emit('error', { message: 'Vous avez déjà utilisé votre pouvoir.' });
      return;
    }
    
    const target1 = game.players.find(p => p.socketId === target1Validation.value);
    const target2 = game.players.find(p => p.socketId === target2Validation.value);
    
    if (!target1 || !target1.isAlive || !target2 || !target2.isAlive) {
      socket.emit('error', { message: 'Les cibles doivent être vivantes.' });
      return;
    }
    
    if (target1.socketId === target2.socketId) {
      socket.emit('error', { message: 'Vous devez choisir deux joueurs différents.' });
      return;
    }
    
    // Échanger les pseudos
    const temp = target1.anonymousNumber;
    target1.anonymousNumber = target2.anonymousNumber;
    target2.anonymousNumber = temp;
    
    // Sauvegarder pour annuler après 1 tour
    game.pseudoSwap = {
      target1: target1.socketId,
      target2: target2.socketId,
      originalNumber1: target2.anonymousNumber, // Inversé car déjà échangé
      originalNumber2: temp,
      turnEnd: game.currentTurn + 1
    };
    
    hacker.powerUses--;
    
    // Notifier tous les joueurs
    game.players.forEach(p => {
      io.to(p.socketId).emit('pseudos_swapped', {
        message: `💻 HACK ! Deux pseudos ont été échangés pour ce tour !`
      });
    });
    
    socket.emit('action_confirmed', {
      message: `💻 Vous avez échangé les pseudos des Joueurs #${target1.anonymousNumber} et #${target2.anonymousNumber} pour ce tour !`
    });
    
    console.log(`💻 Partie ${gameCode} - Hacker échange pseudos: ${temp} ↔️ ${target2.anonymousNumber}`);
    
    updateRoom(gameCode);
  });

  // ==========================
  // EVENT: GURU - Deviner et convertir
  // ==========================
  socket.on('convert_player', (data) => {
    const { gameCode, targetSocketId, guessedName } = data;
    
    const codeValidation = validateGameCode(gameCode);
    const targetValidation = validatePlayerId(targetSocketId);
    
    if (!codeValidation.valid || !targetValidation.valid) {
      socket.emit('error', { message: 'Données invalides.' });
      return;
    }
    
    const game = games[codeValidation.value];
    if (!game || game.status !== 'PLAYING') {
      socket.emit('error', { message: 'La partie n\'est pas en cours.' });
      return;
    }
    
    const guru = game.players.find(p => p.socketId === socket.id);
    if (!guru || !guru.isAlive || guru.role !== 'guru' || !guru.isTraitor) {
      socket.emit('error', { message: 'Vous n\'êtes pas le guru.' });
      return;
    }
    
    // Vérifier les utilisations restantes
    if (!guru.powerUses || guru.powerUses <= 0) {
      socket.emit('error', { message: 'Vous n\'avez plus de tentatives.' });
      return;
    }
    
    const target = game.players.find(p => p.socketId === targetValidation.value);
    if (!target || !target.isAlive) {
      socket.emit('error', { message: 'Cette cible n\'est pas disponible.' });
      return;
    }
    
    // Vérifier que c'est un ennemi
    if (target.team === guru.team && !guru.isTraitor) {
      socket.emit('error', { message: 'Vous ne pouvez convertir que des ennemis.' });
      return;
    }
    
    guru.powerUses--;
    
    // Vérifier si le nom deviné est correct
    const isCorrect = target.pseudo.toLowerCase() === guessedName.toLowerCase();
    
    if (isCorrect) {
      // CONVERSION RÉUSSIE !
      target.isTraitor = true;
      target.convertedBy = guru.socketId;
      
      // Notifier le guru
      socket.emit('conversion_success', {
        targetNumber: target.anonymousNumber,
        targetName: target.pseudo,
        message: `🧙 SUCCÈS ! Vous avez converti ${target.pseudo} (Joueur #${target.anonymousNumber}) en Traître !`
      });
      
      // Notifier la cible qu'elle est maintenant traître
      io.to(target.socketId).emit('you_are_converted', {
        message: `🧙 Vous avez été CONVERTI ! Vous êtes maintenant un TRAÎTRE !`,
        newTeam: 'traîtres'
      });
      
      console.log(`🧙 Partie ${gameCode} - Guru ${guru.anonymousNumber} a converti ${target.pseudo}!`);
    } else {
      socket.emit('conversion_failed', {
        message: `❌ Échec. Ce n'était pas le bon nom pour le Joueur #${target.anonymousNumber}.`,
        remainingAttempts: guru.powerUses
      });
      
      console.log(`🧙 Partie ${gameCode} - Guru ${guru.anonymousNumber} a échoué à convertir Joueur #${target.anonymousNumber}`);
    }
  });

  // ==========================
  // EVENT: USURPATEUR - Voler un pseudo de mort
  // ==========================
  socket.on('steal_pseudo', (data) => {
    const { gameCode, deadPlayerSocketId } = data;
    
    const codeValidation = validateGameCode(gameCode);
    const deadValidation = validatePlayerId(deadPlayerSocketId);
    
    if (!codeValidation.valid || !deadValidation.valid) {
      socket.emit('error', { message: 'Données invalides.' });
      return;
    }
    
    const game = games[codeValidation.value];
    if (!game || game.status !== 'PLAYING') {
      socket.emit('error', { message: 'La partie n\'est pas en cours.' });
      return;
    }
    
    const usurpateur = game.players.find(p => p.socketId === socket.id);
    if (!usurpateur || !usurpateur.isAlive || usurpateur.role !== 'usurpateur') {
      socket.emit('error', { message: 'Vous n\'êtes pas l\'usurpateur.' });
      return;
    }
    
    // Vérifier les utilisations restantes
    if (!usurpateur.powerUses || usurpateur.powerUses <= 0) {
      socket.emit('error', { message: 'Vous avez déjà utilisé votre pouvoir.' });
      return;
    }
    
    const deadPlayer = game.players.find(p => p.socketId === deadValidation.value);
    if (!deadPlayer || deadPlayer.isAlive) {
      socket.emit('error', { message: 'Ce joueur doit être mort.' });
      return;
    }
    
    // Voler le pseudo
    const oldNumber = usurpateur.anonymousNumber;
    usurpateur.anonymousNumber = deadPlayer.anonymousNumber;
    usurpateur.powerUses--;
    
    // Notifier tous les joueurs
    game.players.forEach(p => {
      io.to(p.socketId).emit('pseudo_stolen', {
        message: `🎭 Un joueur a pris l'identité d'un mort !`
      });
    });
    
    socket.emit('action_confirmed', {
      message: `🎭 Vous êtes maintenant le Joueur #${usurpateur.anonymousNumber} (ancien #${oldNumber})`
    });
    
    console.log(`🎭 Partie ${gameCode} - Usurpateur prend le pseudo du Joueur #${deadPlayer.anonymousNumber}`);
    
    updateRoom(gameCode);
  });

  // ==========================
  // EVENT: BOULANGER - Sauver un joueur condamné
  // ==========================
  socket.on('save_player', (data) => {
    const { gameCode, targetSocketId } = data;
    
    const codeValidation = validateGameCode(gameCode);
    const targetValidation = validatePlayerId(targetSocketId);
    
    if (!codeValidation.valid || !targetValidation.valid) {
      socket.emit('error', { message: 'Données invalides.' });
      return;
    }
    
    const game = games[codeValidation.value];
    if (!game || game.status !== 'PLAYING') {
      socket.emit('error', { message: 'La partie n\'est pas en cours.' });
      return;
    }
    
    const boulanger = game.players.find(p => p.socketId === socket.id);
    if (!boulanger || !boulanger.isAlive || boulanger.role !== 'boulanger') {
      socket.emit('error', { message: 'Vous n\'êtes pas le boulanger.' });
      return;
    }
    
    // Vérifier qu'il y a des condamnés
    if (!game.condemned || game.condemned.length === 0) {
      socket.emit('error', { message: 'Aucun joueur à sauver actuellement.' });
      return;
    }
    
    // Trouver le condamné
    const condemned = game.condemned.find(c => c.socketId === targetValidation.value);
    if (!condemned) {
      socket.emit('error', { message: 'Ce joueur ne peut pas être sauvé.' });
      return;
    }
    
    // Vérifier que c'est de la même équipe
    if (condemned.team !== boulanger.team) {
      socket.emit('error', { message: 'Vous ne pouvez sauver que votre équipe.' });
      return;
    }
    
    const target = game.players.find(p => p.socketId === targetValidation.value);
    if (!target) {
      socket.emit('error', { message: 'Joueur introuvable.' });
      return;
    }
    
    // SAUVER le joueur
    target.isRevived = true;
    target.revivedBy = boulanger.socketId;
    target.canRevivedKill = true; // Peut tuer une fois
    
    // Retirer des condamnés
    game.condemned = game.condemned.filter(c => c.socketId !== targetValidation.value);
    
    // Notifier tous les joueurs
    game.players.forEach(p => {
      io.to(p.socketId).emit('action_confirmed', {
        message: `🍞 UN BOULANGER A SAUVÉ LE JOUEUR #${target.anonymousNumber} ! Il reste en vie pour ce tour et peut SE VENGER !`
      });
    });
    
    socket.emit('action_confirmed', {
      message: `🍞 Vous avez sauvé le Joueur #${target.anonymousNumber} ! Vous êtes immunisé contre lui.`
    });
    
    io.to(target.socketId).emit('you_are_revived', {
      message: `🍞 VOUS AVEZ ÉTÉ SAUVÉ PAR UN BOULANGER ! Vous pouvez TUER UN JOUEUR en représailles !`,
      canKill: true
    });
    
    console.log(`🍞 Partie ${gameCode} - Boulanger ${boulanger.pseudo} sauve ${target.pseudo}`);
    
    updateRoom(gameCode);
  });

  // ==========================
  // EVENT: JOUEUR RÉANIMÉ - Tuer en représailles
  // ==========================
  socket.on('revived_kill', (data) => {
    const { gameCode, targetSocketId } = data;
    
    const codeValidation = validateGameCode(gameCode);
    const targetValidation = validatePlayerId(targetSocketId);
    
    if (!codeValidation.valid || !targetValidation.valid) {
      socket.emit('error', { message: 'Données invalides.' });
      return;
    }
    
    const game = games[codeValidation.value];
    if (!game || game.status !== 'PLAYING') {
      socket.emit('error', { message: 'La partie n\'est pas en cours.' });
      return;
    }
    
    const revived = game.players.find(p => p.socketId === socket.id);
    if (!revived || !revived.isRevived || !revived.canRevivedKill) {
      socket.emit('error', { message: 'Vous ne pouvez pas tuer actuellement.' });
      return;
    }
    
    const target = game.players.find(p => p.socketId === targetValidation.value);
    if (!target || !target.isAlive) {
      socket.emit('error', { message: 'Cible invalide.' });
      return;
    }
    
    // Ne peut pas tuer le boulanger qui l'a sauvé
    if (target.socketId === revived.revivedBy) {
      socket.emit('error', { message: '🍞 Vous ne pouvez pas tuer le boulanger qui vous a sauvé !' });
      return;
    }
    
    // TUER la cible
    const deadPlayers = killPlayer(game, target, `tué par le Joueur #${revived.anonymousNumber} (réanimé)`);
    
    // Retirer le pouvoir de tuer
    revived.canRevivedKill = false;
    
    // Notifier tous les joueurs
    game.players.forEach(player => {
      io.to(player.socketId).emit('killer_action', {
        eliminated: deadPlayers,
        message: `☠️ Le Joueur #${revived.anonymousNumber} (RÉANIMÉ) a tué le Joueur #${target.anonymousNumber} !`
      });
    });
    
    console.log(`☠️ Partie ${gameCode} - Joueur réanimé ${revived.pseudo} tue ${target.pseudo}`);
    
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

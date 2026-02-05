const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { endGame } = require('../utils/gameCleanup');

// Middleware pour vérifier le token (copié de auth.js)
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (token.length > 500) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET non configuré!');
      return res.status(500).json({ error: 'Erreur de configuration serveur' });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId).select('-password -emailVerificationToken');
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' });
    }
    res.status(401).json({ error: 'Authentification échouée' });
  }
};

// Terminer une partie manuellement
router.post('/end-game', auth, async (req, res) => {
  try {
    const { gameId, winner } = req.body;
    
    if (!gameId) {
      return res.status(400).json({ error: 'gameId requis' });
    }
    
    const game = await endGame(gameId, winner, req.user._id);
    
    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }
    
    res.json({ 
      message: 'Partie terminée avec succès',
      game: {
        gameId: game.gameId,
        winner: game.winner,
        finishedAt: game.finishedAt,
        willBeDeletedAt: game.expireAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la fin de partie: ' + error.message });
  }
});

// Obtenir l'historique des parties d'un utilisateur
router.get('/my-games', auth, async (req, res) => {
  try {
    const Game = require('../models/Game');
    
    const games = await Game.find({ 
      userId: req.user._id 
    })
    .sort({ createdAt: -1 })
    .limit(50); // Limite à 50 parties les plus récentes
    
    res.json({ games });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des parties: ' + error.message });
  }
});

module.exports = router;

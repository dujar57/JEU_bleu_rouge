const express = require('express');
const router = express.Router();
const { endGame } = require('../utils/gameCleanup');
const { auth } = require('./auth');

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

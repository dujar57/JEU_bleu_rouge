const Game = require('../models/Game');
const User = require('../models/User');

// Terminer une partie et planifier sa suppression
async function endGame(gameId, winner, userId = null) {
  try {
    // Date d'expiration : 1 jour après la fin de la partie
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + 1); // +1 jour
    
    // Mettre à jour la partie dans la BDD
    const game = await Game.findOneAndUpdate(
      { gameId: gameId },
      { 
        status: 'finished',
        winner: winner,
        finishedAt: new Date(),
        expireAt: expireDate // MongoDB supprimera automatiquement après cette date
      },
      { new: true }
    );
    
    if (!game) {
      console.log(`Partie ${gameId} non trouvée dans la BDD`);
      return;
    }
    
    console.log(`✅ Partie ${gameId} terminée. Gagnant: ${winner}. Suppression prévue le ${expireDate.toLocaleString()}`);
    
    // Mettre à jour les statistiques de l'utilisateur si connecté
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $inc: { 
          gamesPlayed: 1,
          gamesWon: winner ? 1 : 0 // Incrémente seulement si le joueur a gagné
        }
      });
    }
    
    return game;
  } catch (error) {
    console.error('Erreur lors de la fin de partie:', error);
  }
}

// Fonction de nettoyage manuel (facultatif - en plus du TTL automatique)
async function cleanupOldGames() {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const result = await Game.deleteMany({
      status: 'finished',
      finishedAt: { $lt: oneDayAgo }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 ${result.deletedCount} parties terminées supprimées`);
    }
  } catch (error) {
    console.error('Erreur lors du nettoyage des parties:', error);
  }
}

module.exports = { endGame, cleanupOldGames };

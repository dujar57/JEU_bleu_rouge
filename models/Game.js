const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  playerName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'playing', 'finished'],
    default: 'waiting'
  },
  players: [{
    socketId: String,
    name: String,
    team: String,
    joinedAt: Date
  }],
  winner: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  finishedAt: {
    type: Date,
    default: null
  },
  // Date d'expiration automatique (utilisé par MongoDB TTL)
  expireAt: {
    type: Date,
    default: null
  }
});

// Index TTL : supprime automatiquement les documents 1 jour après la date 'expireAt'
gameSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Game', gameSchema);

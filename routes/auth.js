const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour vérifier le token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt_temporaire');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Veuillez vous authentifier' });
  }
};

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Cet email est déjà utilisé' : 'Ce nom d\'utilisateur est déjà pris' 
      });
    }
    
    // Créer l'utilisateur
    const user = new User({ username, email, password });
    await user.save();
    
    // Créer le token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'votre_secret_jwt_temporaire',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Compte créé avec succès',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon
      },
      token
    });
  } catch (error) {
    res.status(400).json({ error: 'Erreur lors de la création du compte: ' + error.message });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    // Vérifier le mot de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    // Créer le token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'votre_secret_jwt_temporaire',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Connexion réussie',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon
      },
      token
    });
  } catch (error) {
    res.status(400).json({ error: 'Erreur lors de la connexion: ' + error.message });
  }
});

// Obtenir le profil de l'utilisateur
router.get('/profile', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      gamesPlayed: req.user.gamesPlayed,
      gamesWon: req.user.gamesWon,
      createdAt: req.user.createdAt
    }
  });
});

// Déconnexion
router.post('/logout', auth, async (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

module.exports = { router, auth };

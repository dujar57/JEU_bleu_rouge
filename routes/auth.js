const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
// const { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } = require('../utils/emailService');

// Rate limiting strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Trop de tentatives, réessayez dans 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Middleware pour vérifier le token
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    if (token.length > 500) { // Sécurité : limite la taille du token
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

// Inscription avec validation stricte
router.post('/register', authLimiter, [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Le pseudo doit contenir entre 3 et 30 caractères')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores')
    .escape(), // Protection XSS
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide')
    .isLength({ max: 254 })
    .withMessage('Email trop long'),
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Le mot de passe doit contenir entre 6 et 128 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array()[0].msg 
      });
    }
    
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
    
    // Générer le token de vérification email
    // const verificationToken = generateVerificationToken();
    // user.emailVerificationToken = verificationToken;
    // user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 heures
    
    await user.save();
    
    // Envoyer l'email de vérification
    // const emailSent = await sendVerificationEmail(user, verificationToken);

    // Créer le token JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET non configuré');
    }
    
    const token = jwt.sign(
      { userId: user._id },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Compte créé avec succès!',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon
      },
      token
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});

// Connexion avec validation
router.post('/login', authLimiter, [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array()[0].msg 
      });
    }
    
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
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET non configuré');
    }
    
    const token = jwt.sign(
      { userId: user._id }, 
      jwtSecret,
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
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Obtenir le profil de l'utilisateur
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        emailVerified: req.user.emailVerified,
        gamesPlayed: req.user.gamesPlayed,
        gamesWon: req.user.gamesWon,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// Déconnexion
router.post('/logout', auth, async (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

// Vérifier l'email avec le token
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Token de vérification manquant' });
    }
    
    // Trouver l'utilisateur avec ce token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() } // Token non expiré
    });
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Token invalide ou expiré. Veuillez demander un nouveau lien de vérification.' 
      });
    }
    
    // Vérifier l'email
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    
    // Envoyer l'email de bienvenue
    // await sendWelcomeEmail(user);
    
    res.json({ 
      message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.',
      success: true
    });
  } catch (error) {
    console.error('Erreur vérification email:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification de l\'email' });
  }
});

// Renvoyer l'email de vérification
router.post('/resend-verification', auth, async (req, res) => {
  try {
    const user = req.user;
    
    if (user.emailVerified) {
      return res.status(400).json({ error: 'Votre email est déjà vérifié' });
    }
    
    // Générer un nouveau token
    // const verificationToken = generateVerificationToken();
    // user.emailVerificationToken = verificationToken;
    // user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 heures
    await user.save();
    
    // Envoyer l'email
    // const emailSent = await sendVerificationEmail(user, verificationToken);
    
    res.json({ message: 'Email de vérification renvoyé avec succès' });
  } catch (error) {
    console.error('Erreur renvoi email:', error);
    res.status(500).json({ error: 'Erreur lors du renvoi de l\'email' });
  }
});

module.exports = router;


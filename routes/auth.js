const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');
const { generateVerificationToken, sendVerificationEmail, sendWelcomeEmail } = require('../utils/emailService');

// Rate limiting strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Trop de tentatives, réessayez dans 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// Blacklist de tokens (en production, utiliser Redis)
const tokenBlacklist = new Set();

// Middleware pour vérifier le token
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Vérifier si le token est dans la blacklist
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ error: 'Token invalidé. Veuillez vous reconnecter.' });
    }
    
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
], async (req, res) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Erreurs de validation:', errors.array());
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
    
    // ===== VÉRIFICATION EMAIL DÉSACTIVÉE =====
    // Pour réactiver: décommenter le code ci-dessous et modifier emailVerified: false
    
    // const verificationToken = generateVerificationToken();
    // const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    // Créer l'utilisateur (email vérifié par défaut)
    const user = new User({ 
      username, 
      email, 
      password,
      emailVerified: true  // ⚠️ Modifié: email vérifié automatiquement (pas de domaine)
      // Pour réactiver la vérification:
      // emailVerified: false,
      // emailVerificationToken: verificationToken,
      // emailVerificationExpires: tokenExpiry
    });
    
    await user.save();
    
    // ===== ENVOI EMAIL DÉSACTIVÉ =====
    // Pour réactiver: décommenter le code ci-dessous
    // try {
    //   await sendVerificationEmail(user, verificationToken);
    //   console.log(`✅ Email de vérification envoyé à ${email}`);
    // } catch (emailError) {
    //   console.error('❌ Erreur envoi email:', emailError);
    // }
    
    console.log(`✅ Utilisateur créé: ${username} (email auto-vérifié)`);

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
    
    // Protection contre timing attack - temps constant
    const user = await User.findOne({ email }).select('+password');
    
    // Exécuter comparePassword même si user n'existe pas (timing attack prevention)
    const dummyHash = '$2a$10$YourDummyHashHere';
    const isMatch = user 
      ? await user.comparePassword(password)
      : await require('bcryptjs').compare(password, dummyHash);
    
    if (!user || !isMatch) {
      // Message générique pour ne pas révéler si l'email existe
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    // ===== VÉRIFICATION EMAIL DÉSACTIVÉE =====
    // Pour réactiver: décommenter le code ci-dessous
    // if (!user.emailVerified) {
    //   return res.status(403).json({ 
    //     error: 'Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.',
    //     emailVerificationRequired: true,
    //     email: user.email
    //   });
    // }
    
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

// Déconnexion sécurisée
router.post('/logout', auth, async (req, res) => {
  try {
    // Ajouter le token à la blacklist
    const token = req.token;
    tokenBlacklist.add(token);
    
    // Nettoyer les vieux tokens après 7 jours (correspond à l'expiration JWT)
    setTimeout(() => {
      tokenBlacklist.delete(token);
    }, 7 * 24 * 60 * 60 * 1000);
    
    console.log(`🚪 Utilisateur ${req.user.username} déconnecté`);
    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Erreur logout:', error);
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
});

// ===== ROUTES DE VÉRIFICATION EMAIL DÉSACTIVÉES =====
// Pour réactiver: décommenter les routes ci-dessous

/*
// Vérifier l'email avec le token
// Route pour vérifier l'email avec un code à 6 chiffres (GET pour anciens liens, POST pour nouveau système)
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Code de vérification manquant' });
    }
    
    // Trouver l'utilisateur avec ce code
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() } // Code non expiré
    });
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Code invalide ou expiré (15 minutes). Veuillez demander un nouveau code.' 
      });
    }
    
    // Vérifier l'email
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    
    // Envoyer l'email de bienvenue
    try {
      await sendWelcomeEmail(user);
      console.log(`🎉 Email de bienvenue envoyé à ${user.email}`);
    } catch (emailError) {
      console.error('Erreur envoi email bienvenue:', emailError);
    }
    
    res.json({ 
      message: 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.',
      success: true
    });
  } catch (error) {
    console.error('Erreur vérification email:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification de l\'email' });
  }
});

// Route POST pour vérifier l'email avec le code (nouveau système)
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Code de vérification manquant' });
    }
    
    // Trouver l'utilisateur avec ce code
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() } // Code non expiré
    });
    
    if (!user) {
      return res.status(400).json({ 
        error: 'Code invalide ou expiré. Le code est valable 15 minutes.' 
      });
    }
    
    // Vérifier l'email
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    
    // Envoyer l'email de bienvenue
    try {
      await sendWelcomeEmail(user);
      console.log(`🎉 Email de bienvenue envoyé à ${user.email}`);
    } catch (emailError) {
      console.error('Erreur envoi email bienvenue:', emailError);
    }
    
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
    const verificationToken = generateVerificationToken();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();
    
    // Envoyer l'email
    const emailSent = await sendVerificationEmail(user, verificationToken);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'email' });
    }
    
    res.json({ 
      message: 'Email de vérification renvoyé avec succès. Vérifiez votre boîte de réception.',
      success: true 
    });
  } catch (error) {
    console.error('Erreur renvoi email:', error);
    res.status(500).json({ error: 'Erreur lors du renvoi de l\'email' });
  }
});
*/

// GET /profile - Récupérer le profil utilisateur avec historique
router.get('/profile', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Utiliser l'historique directement depuis le modèle User
    const matchHistory = user.matchHistory.slice(-20).reverse().map(match => ({
      gameId: match.gameId,
      won: match.won,
      team: match.team,
      role: match.role,
      isTraitor: match.isTraitor,
      date: match.playedAt,
      duration: match.duration,
      playerCount: match.playerCount
    }));
    
    // Récupérer toutes les parties en cours
    const currentGames = user.currentGames.map(game => ({
      gameId: game.gameId,
      joinedAt: game.joinedAt,
      lastActivityAt: game.lastActivityAt,
      canRejoin: true
    }));
    
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        gamesPlayed: user.gamesPlayed,
        gamesWon: user.gamesWon,
        createdAt: user.createdAt
      },
      matchHistory,
      currentGames
    });
  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// PUT /update-profile - Modifier les informations du profil
router.put('/update-profile', 
  authLimiter,
  auth,
  [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('Le pseudo doit contenir entre 3 et 20 caractères')
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage('Le pseudo ne peut contenir que des lettres, chiffres, - et _'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Email invalide')
      .normalizeEmail(),
    body('currentPassword')
      .optional()
      .isLength({ min: 1 })
      .withMessage('Mot de passe actuel requis pour changer de mot de passe'),
    body('newPassword')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
  ],
  async (req, res) => {
    const startTime = Date.now();
    
    try {
      // Validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, currentPassword, newPassword } = req.body;
      const user = req.user;
      let updated = false;
      let emailChanged = false;

      // Vérifier qu'au moins un champ est fourni
      if (!username && !email && !newPassword) {
        return res.status(400).json({ error: 'Aucune modification fournie' });
      }

      // Modifier le username
      if (username && username !== user.username) {
        // Vérifier si le username est déjà pris
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ error: 'Ce pseudo est déjà utilisé' });
        }
        user.username = username;
        updated = true;
      }

      // Modifier l'email
      if (email && email !== user.email) {
        // Vérifier si l'email est déjà utilisé
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ error: 'Cet email est déjà utilisé' });
        }
        user.email = email;
        user.emailVerified = false; // Réinitialiser la vérification
        emailChanged = true;
        updated = true;
        
        // Envoyer un nouvel email de vérification
        try {
          const verificationToken = generateVerificationToken();
          user.emailVerificationToken = verificationToken;
          user.emailVerificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
          await sendVerificationEmail(user, verificationToken);
        } catch (emailError) {
          console.error('Erreur envoi email vérification:', emailError);
        }
      }

      // Modifier le mot de passe
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Le mot de passe actuel est requis' });
        }

        // Vérifier le mot de passe actuel
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          // Protection timing attack
          await new Promise(resolve => setTimeout(resolve, 1000));
          return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
        }

        user.password = newPassword; // Le hachage est fait automatiquement par le pre-save hook
        updated = true;
      }

      if (!updated) {
        return res.status(400).json({ error: 'Aucun changement détecté' });
      }

      // Sauvegarder les modifications
      await user.save();

      // Protection timing attack
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      console.log(`✅ Profil mis à jour pour ${user.username}`);

      res.json({ 
        message: 'Profil mis à jour avec succès',
        emailChanged: emailChanged ? 'Un email de vérification a été envoyé à votre nouvelle adresse' : undefined,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          emailVerified: user.emailVerified
        }
      });
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
    }
  }
);

module.exports = router;

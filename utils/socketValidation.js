// -*- coding: utf-8 -*-
// @charset "UTF-8"
/**
 * Utilitaires de validation et sécurité pour Socket.io
 */

// Protection XSS - Nettoie les chaînes de caractères
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Supprime < et >
    .replace(/javascript:/gi, '') // Supprime javascript:
    .replace(/on\w+=/gi, '') // Supprime les handlers d'événements (onclick=, etc.)
    .substring(0, 200); // Limite la longueur
};

// Validation du pseudo
const validatePseudo = (pseudo) => {
  if (!pseudo || typeof pseudo !== 'string') {
    return { valid: false, error: 'Le pseudo est requis' };
  }
  
  const cleaned = sanitizeString(pseudo);
  
  if (cleaned.length < 2) {
    return { valid: false, error: 'Le pseudo doit contenir au moins 2 caractères' };
  }
  
  if (cleaned.length > 30) {
    return { valid: false, error: 'Le pseudo ne peut pas dépasser 30 caractères' };
  }
  
  // Autoriser uniquement lettres, chiffres, espaces, tirets et underscores
  if (!/^[a-zA-Z0-9àâäéèêëïîôùûüÿæœçÀÂÄÉÈÊËÏÎÔÙÛÜŸÆŒÇ _-]+$/.test(cleaned)) {
    return { valid: false, error: 'Le pseudo contient des caractères non autorisés' };
  }
  
  return { valid: true, value: cleaned };
};

// Validation du code de partie
const validateGameCode = (code) => {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Le code de partie est requis' };
  }
  
  const cleaned = code.trim().toUpperCase();
  
  if (cleaned.length !== 4) {
    return { valid: false, error: 'Le code doit contenir exactement 4 caractères' };
  }
  
  if (!/^[A-Z]{4}$/.test(cleaned)) {
    return { valid: false, error: 'Le code doit contenir uniquement des lettres' };
  }
  
  return { valid: true, value: cleaned };
};

// Validation des infos de vie réelle
const validateRealLifeInfo = (info) => {
  if (!info || typeof info !== 'string') {
    return { valid: false, error: 'Les informations sont requises' };
  }
  
  const cleaned = sanitizeString(info);
  
  if (cleaned.length < 2) {
    return { valid: false, error: 'Les informations doivent contenir au moins 2 caractères' };
  }
  
  if (cleaned.length > 100) {
    return { valid: false, error: 'Les informations ne peuvent pas dépasser 100 caractères' };
  }
  
  return { valid: true, value: cleaned };
};

// Validation des messages de chat
const validateChatMessage = (message) => {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Le message est vide' };
  }
  
  const cleaned = message.trim();
  
  if (cleaned.length === 0) {
    return { valid: false, error: 'Le message est vide' };
  }
  
  if (cleaned.length > 500) {
    return { valid: false, error: 'Le message est trop long (max 500 caractères)' };
  }
  
  // Protection XSS basique
  const sanitized = cleaned
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
  
  return { valid: true, value: sanitized };
};

// Validation de la durée de partie
const validateDuration = (duration) => {
  if (!duration || typeof duration !== 'number') {
    return { valid: false, error: 'La durée est invalide' };
  }
  
  const minDuration = 20 * 60 * 1000; // 20 minutes
  const maxDuration = 10 * 24 * 60 * 60 * 1000; // 10 jours
  
  if (duration < minDuration || duration > maxDuration) {
    return { valid: false, error: 'La durée doit être entre 20 minutes et 10 jours' };
  }
  
  return { valid: true, value: duration };
};

// Validation d'un ID de joueur (pour les votes)
const validatePlayerId = (playerId) => {
  if (!playerId || typeof playerId !== 'string') {
    return { valid: false, error: 'ID joueur invalide' };
  }
  
  // Socket.io IDs ont un format spécifique
  if (playerId.length < 10 || playerId.length > 50) {
    return { valid: false, error: 'ID joueur invalide' };
  }
  
  return { valid: true, value: playerId };
};

// Rate limiting par socket (anti-spam)
const rateLimiter = new Map();

const checkRateLimit = (socketId, actionType, limit = 10, windowMs = 60000) => {
  const now = Date.now();
  const key = `${socketId}_${actionType}`;
  
  if (!rateLimiter.has(key)) {
    rateLimiter.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  
  const record = rateLimiter.get(key);
  
  if (now > record.resetAt) {
    // Reset le compteur
    rateLimiter.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }
  
  if (record.count >= limit) {
    return { 
      allowed: false, 
      error: 'Trop de requêtes, veuillez patienter',
      retryAfter: Math.ceil((record.resetAt - now) / 1000)
    };
  }
  
  record.count++;
  return { allowed: true };
};

// Nettoyer les anciennes entrées du rate limiter
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimiter.entries()) {
    if (now > record.resetAt + 60000) {
      rateLimiter.delete(key);
    }
  }
}, 60000); // Nettoyage toutes les minutes

module.exports = {
  sanitizeString,
  validatePseudo,
  validateGameCode,
  validateRealLifeInfo,
  validateChatMessage,
  validateDuration,
  validatePlayerId,
  checkRateLimit
};

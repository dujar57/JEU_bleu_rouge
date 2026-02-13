// -*- coding: utf-8 -*-
// @charset "UTF-8"
/**
 * Validation des variables d'environnement au démarrage
 */

const validateEnv = () => {
  console.log('🔍 Vérification des variables d\'environnement...\n');
  
  const required = ['MONGODB_URI'];
  const optional = {
    'APP_URL': 'Sera détecté automatiquement depuis les requêtes',
    'EMAIL_USER': 'Les emails ne seront pas envoyés',
    'EMAIL_PASSWORD': 'Les emails ne seront pas envoyés',
    'REDIS_URL': 'Token blacklist sera en mémoire (non persistant)'
  };
  
  let hasError = false;
  
  // Variables obligatoires
  required.forEach(key => {
    if (!process.env[key]) {
      console.error(`❌ ERREUR : ${key} est requis !`);
      hasError = true;
    } else {
      console.log(`✅ ${key} configuré`);
    }
  });
  
  // Génération automatique JWT_SECRET si absent
  if (!process.env.JWT_SECRET) {
    const crypto = require('crypto');
    process.env.JWT_SECRET = crypto.randomBytes(64).toString('hex');
    console.warn('⚠️  JWT_SECRET généré automatiquement (non persistant entre redémarrages)');
  } else if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET trop court ! Minimum 32 caractères');
    hasError = true;
  } else if (process.env.JWT_SECRET === 'votre_secret_jwt_super_securise_changez_moi') {
    console.error('❌ JWT_SECRET utilise la valeur par défaut !');
    hasError = true;
  } else {
    console.log(`✅ JWT_SECRET configuré`);
    if (process.env.JWT_SECRET.match(/^[0-9a-f]{64,}$/i)) {
      console.log('✅ JWT_SECRET format hexadécimal valide');
    }
  }
  
  // Variables optionnelles
  Object.entries(optional).forEach(([key, warning]) => {
    if (!process.env[key]) {
      console.warn(`⚠️  ${key} non configuré : ${warning}`);
    } else {
      console.log(`✅ ${key} configuré`);
    }
  });
  
  console.log('');
  
  if (hasError) {
    console.error('💥 Démarrage impossible : erreurs de configuration\n');
    process.exit(1);
  }
  
  console.log('✅ Configuration valide\n');
};

module.exports = { validateEnv };

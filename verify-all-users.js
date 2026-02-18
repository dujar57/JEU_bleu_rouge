const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

/**
 * Script de migration: Vérifier tous les utilisateurs existants
 * À exécuter une seule fois après la désactivation de la vérification email
 * 
 * Commande: node verify-all-users.js
 */

async function verifyAllUsers() {
  try {
    // Connexion à MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bleu-rouge';
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connecté à MongoDB\n');

    // Trouver tous les utilisateurs non vérifiés
    const unverifiedUsers = await User.find({ emailVerified: false });
    console.log(`📊 Utilisateurs non vérifiés trouvés: ${unverifiedUsers.length}\n`);

    if (unverifiedUsers.length === 0) {
      console.log('✅ Tous les utilisateurs sont déjà vérifiés!');
      process.exit(0);
    }

    // Vérifier tous les utilisateurs
    let verified = 0;
    for (const user of unverifiedUsers) {
      user.emailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();
      console.log(`✅ ${user.username} (${user.email}) - Vérifié`);
      verified++;
    }

    console.log(`\n🎉 Migration terminée!`);
    console.log(`✅ ${verified} utilisateur(s) vérifié(s)\n`);

    // Afficher un résumé
    const totalUsers = await User.countDocuments();
    const verifiedCount = await User.countDocuments({ emailVerified: true });
    console.log(`📊 RÉSUMÉ FINAL:`);
    console.log(`   Total utilisateurs: ${totalUsers}`);
    console.log(`   Vérifiés: ${verifiedCount}`);
    console.log(`   Non vérifiés: ${totalUsers - verifiedCount}\n`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
    process.exit(0);
  }
}

// Exécuter la migration
verifyAllUsers();

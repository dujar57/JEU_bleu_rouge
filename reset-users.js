require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function resetUsers() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    const count = await User.countDocuments();
    console.log(`📊 Nombre d'utilisateurs actuels: ${count}`);

    if (count > 0) {
      console.log('🗑️  Suppression de tous les utilisateurs...');
      const result = await User.deleteMany({});
      console.log(`✅ ${result.deletedCount} utilisateur(s) supprimé(s)`);
    } else {
      console.log('ℹ️  Aucun utilisateur à supprimer');
    }

    await mongoose.connection.close();
    console.log('✅ Déconnexion de MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

resetUsers();

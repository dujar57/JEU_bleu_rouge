require('dotenv').config();
const { generateVerificationToken, sendVerificationEmail } = require('./utils/emailService');

// Test de l'envoi d'email
async function testEmail() {
  console.log('🧪 Test de configuration email...\n');
  
  // Vérifier les variables d'environnement
  console.log('📋 Variables d\'environnement :');
  console.log('   EMAIL_SERVICE:', process.env.EMAIL_SERVICE || '❌ NON DÉFINIE');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ NON DÉFINIE');
  console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✅ DÉFINIE (masquée)' : '❌ NON DÉFINIE');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST || '❌ NON DÉFINIE');
  console.log('   SMTP_PORT:', process.env.SMTP_PORT || '❌ NON DÉFINIE');
  console.log('   APP_URL:', process.env.APP_URL || '❌ NON DÉFINIE');
  console.log('');
  
  // Vérifier que toutes les variables nécessaires sont présentes
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Configuration incomplète !');
    console.error('   Veuillez définir EMAIL_USER et EMAIL_PASSWORD dans le fichier .env');
    console.error('');
    console.error('📖 Consultez le fichier CONFIG_EMAIL_RAPIDE.md pour plus d\'infos');
    process.exit(1);
  }
  
  // Créer un utilisateur de test
  const testUser = {
    username: 'TestUser',
    email: process.env.EMAIL_USER // Envoyer à votre propre email pour tester
  };
  
  console.log(`📧 Envoi d'un email de test à : ${testUser.email}\n`);
  
  try {
    const token = generateVerificationToken();
    const result = await sendVerificationEmail(testUser, token);
    
    if (result) {
      console.log('✅ Email envoyé avec succès !');
      console.log('');
      console.log('📬 Vérifiez votre boîte mail (et le dossier SPAM)');
      console.log('');
      console.log('🔗 Lien de vérification :');
      console.log(`   ${process.env.APP_URL || 'https://jeu-bleu-rouge.onrender.com'}/verify-email?token=${token}`);
    } else {
      console.log('❌ Erreur lors de l\'envoi de l\'email');
      console.log('');
      console.log('💡 Vérifications à faire :');
      console.log('   1. Le mot de passe d\'application Gmail est correct (16 caractères)');
      console.log('   2. La validation en 2 étapes est activée sur Gmail');
      console.log('   3. Les variables d\'environnement sont bien configurées');
    }
  } catch (error) {
    console.error('❌ Erreur :', error.message);
    console.error('');
    console.error('📖 Consultez CONFIG_EMAIL_RAPIDE.md pour résoudre ce problème');
  }
}

// Exécuter le test
testEmail();

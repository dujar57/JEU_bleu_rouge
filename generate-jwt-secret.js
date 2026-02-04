// Script pour générer un JWT_SECRET sécurisé
// Usage: node generate-jwt-secret.js

const crypto = require('crypto');

console.log('\n🔐 GÉNÉRATION D\'UN JWT_SECRET SÉCURISÉ\n');
console.log('═'.repeat(60));

// Générer une clé de 64 bytes (512 bits)
const secret = crypto.randomBytes(64).toString('hex');

console.log('\n✅ JWT_SECRET généré avec succès!\n');
console.log('Copiez cette valeur dans vos variables d\'environnement:\n');
console.log('JWT_SECRET=' + secret);
console.log('\n═'.repeat(60));

console.log('\n📋 INSTRUCTIONS:\n');
console.log('1. Sur Render.com:');
console.log('   - Allez dans votre service > Environment');
console.log('   - Cherchez ou ajoutez JWT_SECRET');
console.log('   - Collez la valeur générée ci-dessus');
console.log('   - Cliquez "Save Changes"');
console.log('\n2. En local (.env):');
console.log('   - Ouvrez votre fichier .env');
console.log('   - Ajoutez: JWT_SECRET=' + secret);
console.log('   - NE JAMAIS COMMITER ce fichier!');
console.log('\n⚠️  IMPORTANT:');
console.log('   - Ne partagez JAMAIS cette clé');
console.log('   - Changez-la si elle est compromise');
console.log('   - Utilisez une clé différente par environnement');
console.log('\n');

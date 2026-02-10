#!/usr/bin/env node
/**
 * Script de test de sécurité pour le jeu Bleu vs Rouge
 * Teste les mesures de sécurité implémentées
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_URL || 'https://jeu-bleu-rouge.onrender.com';
const isHttps = BASE_URL.startsWith('https');
const client = isHttps ? https : http;

console.log(`🔍 Tests de sécurité sur: ${BASE_URL}\n`);

// Fonction helper pour faire des requêtes
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Tests
async function runTests() {
  let passed = 0;
  let failed = 0;

  console.log('📋 Test 1: Headers de sécurité HTTPS');
  try {
    const res = await makeRequest('/');
    
    // Vérifier HSTS
    if (res.headers['strict-transport-security']) {
      console.log('  ✅ HSTS activé:', res.headers['strict-transport-security']);
      passed++;
    } else {
      console.log('  ❌ HSTS manquant');
      failed++;
    }
    
    // Vérifier X-Frame-Options
    if (res.headers['x-frame-options']) {
      console.log('  ✅ X-Frame-Options:', res.headers['x-frame-options']);
      passed++;
    } else {
      console.log('  ❌ X-Frame-Options manquant');
      failed++;
    }
    
    // Vérifier CSP
    if (res.headers['content-security-policy']) {
      console.log('  ✅ CSP activée');
      passed++;
    } else {
      console.log('  ❌ CSP manquante');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Erreur:', error.message);
    failed += 3;
  }

  console.log('\n📋 Test 2: Rate Limiting sur /api/auth/login');
  try {
    // Faire 6 requêtes rapides (limite = 5)
    const requests = [];
    for (let i = 0; i < 6; i++) {
      requests.push(makeRequest('/api/auth/login', {
        method: 'POST',
        body: { username: 'test', password: 'wrong' }
      }));
    }
    
    const results = await Promise.all(requests);
    const blocked = results.filter(r => r.statusCode === 429).length;
    
    if (blocked > 0) {
      console.log(`  ✅ Rate limiting actif (${blocked} requêtes bloquées)`);
      passed++;
    } else {
      console.log('  ❌ Rate limiting ne fonctionne pas');
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Erreur:', error.message);
    failed++;
  }

  console.log('\n📋 Test 3: Validation des entrées (username trop court)');
  try {
    const res = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        username: 'ab', // Trop court (min 3)
        email: 'test@example.com',
        password: 'Test123!'
      }
    });
    
    if (res.statusCode === 400) {
      console.log('  ✅ Validation refuse les usernames trop courts');
      passed++;
    } else {
      console.log('  ❌ Validation échouée:', res.statusCode);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Erreur:', error.message);
    failed++;
  }

  console.log('\n📋 Test 4: Validation email format');
  try {
    const res = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        username: 'testuser',
        email: 'invalidemail', // Format invalide
        password: 'Test123!'
      }
    });
    
    if (res.statusCode === 400) {
      console.log('  ✅ Validation refuse les emails invalides');
      passed++;
    } else {
      console.log('  ❌ Validation échouée:', res.statusCode);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Erreur:', error.message);
    failed++;
  }

  console.log('\n📋 Test 5: Mot de passe faible rejeté');
  try {
    const res = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: '123' // Trop court
      }
    });
    
    if (res.statusCode === 400) {
      console.log('  ✅ Validation refuse les mots de passe faibles');
      passed++;
    } else {
      console.log('  ❌ Validation échouée:', res.statusCode);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Erreur:', error.message);
    failed++;
  }

  console.log('\n📋 Test 6: Token manquant sur endpoint protégé');
  try {
    const res = await makeRequest('/api/auth/me', {
      method: 'GET'
    });
    
    if (res.statusCode === 401) {
      console.log('  ✅ Endpoint protégé refuse les requêtes sans token');
      passed++;
    } else {
      console.log('  ❌ Endpoint non protégé:', res.statusCode);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Erreur:', error.message);
    failed++;
  }

  console.log('\n📋 Test 7: Token invalide rejeté');
  try {
    const res = await makeRequest('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer token_invalide_xyz123'
      }
    });
    
    if (res.statusCode === 401) {
      console.log('  ✅ Endpoint refuse les tokens invalides');
      passed++;
    } else {
      console.log('  ❌ Token invalide accepté:', res.statusCode);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Erreur:', error.message);
    failed++;
  }

  console.log('\n📋 Test 8: NoSQL Injection Prevention');
  try {
    const res = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {
        username: { $ne: null }, // Tentative d'injection
        password: { $ne: null }
      }
    });
    
    if (res.statusCode === 400 || res.statusCode === 401) {
      console.log('  ✅ Protection contre injections NoSQL active');
      passed++;
    } else {
      console.log('  ❌ Vulnérable aux injections:', res.statusCode);
      failed++;
    }
  } catch (error) {
    console.log('  ❌ Erreur:', error.message);
    failed++;
  }

  // Résumé
  console.log('\n' + '='.repeat(50));
  console.log(`📊 RÉSULTATS: ${passed} tests réussis, ${failed} tests échoués`);
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('✅ Tous les tests de sécurité sont passés!');
    process.exit(0);
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifier la configuration.');
    process.exit(1);
  }
}

// Exécution
console.log('🚀 Démarrage des tests de sécurité...\n');
runTests().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});

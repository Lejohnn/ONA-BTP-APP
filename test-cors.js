#!/usr/bin/env node

/**
 * Script de test CORS pour Odoo
 * Ce script vérifie si le serveur Odoo est correctement configuré pour CORS
 */

const https = require('https');
const http = require('http');

console.log('🔍 Test de configuration CORS pour Odoo');
console.log('URL: https://btp.onaerp.com/jsonrpc');
console.log('');

// Test 1: Vérifier les headers CORS
function testCorsHeaders() {
  console.log('📋 Test 1: Vérification des headers CORS...');
  
  const options = {
    hostname: 'btp.onaerp.com',
    port: 443,
    path: '/jsonrpc',
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:8100',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type,Authorization'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Headers CORS:');
    
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-max-age'
    ];
    
    corsHeaders.forEach(header => {
      const value = res.headers[header];
      if (value) {
        console.log(`✅ ${header}: ${value}`);
      } else {
        console.log(`❌ ${header}: Non défini`);
      }
    });
    
    console.log('');
  });

  req.on('error', (error) => {
    console.log(`❌ Erreur de connexion: ${error.message}`);
  });

  req.end();
}

// Test 2: Test de requête POST réelle
function testPostRequest() {
  console.log('📤 Test 2: Test de requête POST...');
  
  const postData = JSON.stringify({
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'common',
      method: 'version',
      args: []
    }
  });

  const options = {
    hostname: 'btp.onaerp.com',
    port: 443,
    path: '/jsonrpc',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Origin': 'http://localhost:8100'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'Non défini'}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ Réponse reçue:', response);
      } catch (e) {
        console.log('❌ Réponse invalide:', data);
      }
      console.log('');
    });
  });

  req.on('error', (error) => {
    console.log(`❌ Erreur de connexion: ${error.message}`);
  });

  req.write(postData);
  req.end();
}

// Test 3: Test de requête de login
function testLoginRequest() {
  console.log('🔐 Test 3: Test de requête de login...');
  
  const postData = JSON.stringify({
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'common',
      method: 'login',
      args: ['btptst', 'ingineer.btp@gmail.com', 'demo']
    }
  });

  const options = {
    hostname: 'btp.onaerp.com',
    port: 443,
    path: '/jsonrpc',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Origin': 'http://localhost:8100'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'Non défini'}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (response.result && typeof response.result === 'number') {
          console.log('✅ Login réussi! UID:', response.result);
        } else {
          console.log('❌ Login échoué:', response);
        }
      } catch (e) {
        console.log('❌ Réponse invalide:', data);
      }
      console.log('');
    });
  });

  req.on('error', (error) => {
    console.log(`❌ Erreur de connexion: ${error.message}`);
  });

  req.write(postData);
  req.end();
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests CORS...\n');
  
  // Attendre entre les tests
  testCorsHeaders();
  
  setTimeout(() => {
    testPostRequest();
  }, 2000);
  
  setTimeout(() => {
    testLoginRequest();
  }, 4000);
  
  setTimeout(() => {
    console.log('📊 Résumé des tests:');
    console.log('Si vous voyez des ❌ dans les headers CORS,');
    console.log('le serveur Odoo doit être configuré pour CORS.');
    console.log('');
    console.log('Consultez le fichier CORS_SOLUTION.md pour les solutions.');
  }, 6000);
}

// Exécuter si appelé directement
if (require.main === module) {
  runTests();
}

module.exports = { testCorsHeaders, testPostRequest, testLoginRequest }; 
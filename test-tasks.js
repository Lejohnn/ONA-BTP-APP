// Script de test pour l'API des tâches
const https = require('https');

// Configuration
const odooUrl = 'https://btp.onaerp.com/jsonrpc';
const dbName = 'btptst';
const token = 'btp_authentication_token';

// Test avec différents UIDs
const testUids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function testWithUid(uid) {
  const data = JSON.stringify({
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'object',
      method: 'execute_kw',
      args: [
        dbName,
        uid,
        token,
        'project.task',
        'search_read',
        [[['active', '=', true]]],
        {
          fields: ['id', 'name', 'description', 'project_id', 'state', 'progress']
        }
      ]
    },
    id: null
  });

  const options = {
    hostname: 'btp.onaerp.com',
    port: 443,
    path: '/jsonrpc',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(responseData);
        console.log(`\n=== Test avec UID ${uid} ===`);
        console.log('Status:', res.statusCode);
        
        if (result.error) {
          console.log('❌ Erreur:', result.error.message);
        } else if (result.result) {
          console.log('✅ Succès! Tâches trouvées:', result.result.length);
          if (result.result.length > 0) {
            console.log('Première tâche:', result.result[0]);
          }
        } else {
          console.log('⚠️ Réponse inattendue:', result);
        }
      } catch (error) {
        console.log('❌ Erreur parsing JSON:', error.message);
        console.log('Réponse brute:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.log(`❌ Erreur réseau pour UID ${uid}:`, error.message);
  });

  req.write(data);
  req.end();
}

console.log('🔍 Test de l\'API des tâches avec différents UIDs...\n');

// Tester avec chaque UID
testUids.forEach(uid => {
  setTimeout(() => testWithUid(uid), uid * 500); // Délai de 500ms entre chaque test
});

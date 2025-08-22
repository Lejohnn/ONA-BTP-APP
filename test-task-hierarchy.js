const https = require('https');

// Configuration
const config = {
  hostname: 'btp.onaerp.com',
  port: 443,
  path: '/jsonrpc',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'ONA-BTP-Mobile/1.0'
  }
};

// Fonction pour faire une requête JSON-RPC
function makeRequest(method, args) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "object",
        method: "execute_kw",
        args: args
      }
    });

    const req = https.request(config, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Test 1: Vérifier les champs de hiérarchie dans project.task
async function testTaskHierarchyFields() {
  console.log('🔍 Test 1: Champs de hiérarchie dans project.task');
  console.log('================================================');
  
  try {
    const result = await makeRequest('call', [
      'btptst', 7, 'demo',
      'project.task',
      'search_read',
      [[['id', '=', 1]]], // Tâche ID 1
      {
        fields: [
          'id', 'name', 'parent_id', 'child_ids'
        ],
        limit: 1
      }
    ]);
    
    console.log('✅ Tâche avec champs de hiérarchie:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Test 2: Vérifier toutes les tâches avec leurs relations parent/enfant
async function testAllTasksHierarchy() {
  console.log('\n🔍 Test 2: Toutes les tâches avec hiérarchie');
  console.log('============================================');
  
  try {
    const result = await makeRequest('call', [
      'btptst', 7, 'demo',
      'project.task',
      'search_read',
      [[]], // Toutes les tâches
      {
        fields: [
          'id', 'name', 'parent_id', 'child_ids', 'state', 'progress'
        ],
        limit: 10
      }
    ]);
    
    console.log('✅ Toutes les tâches avec hiérarchie:', JSON.stringify(result, null, 2));
    
    // Analyser les résultats
    if (result.result && result.result.length > 0) {
      console.log('\n📊 Analyse des relations parent/enfant:');
      
      result.result.forEach(task => {
        const isParent = task.child_ids && task.child_ids.length > 0;
        const isChild = task.parent_id && task.parent_id.length > 0;
        
        console.log(`\n📋 Tâche ${task.id}: ${task.name}`);
        console.log(`   - Est parent: ${isParent} (${task.child_ids?.length || 0} enfants)`);
        console.log(`   - Est enfant: ${isChild} ${isChild ? `(parent: ${task.parent_id[1]})` : ''}`);
        
        if (isParent && isChild) {
          console.log(`   ⚠️  Tâche intermédiaire (parent + enfant)`);
        } else if (isParent) {
          console.log(`   👑 Tâche mère`);
        } else if (isChild) {
          console.log(`   👶 Sous-tâche`);
        } else {
          console.log(`   📄 Tâche simple`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Test 3: Vérifier les champs disponibles dans project.task
async function testTaskFields() {
  console.log('\n🔍 Test 3: Champs disponibles dans project.task');
  console.log('===============================================');
  
  try {
    const result = await makeRequest('call', [
      'btptst', 7, 'demo',
      'project.task',
      'fields_get',
      [[]],
      { attributes: ['string', 'type', 'relation'] }
    ]);
    
    console.log('✅ Champs disponibles dans project.task:');
    
    if (result.result) {
      const fields = Object.keys(result.result);
      const hierarchyFields = fields.filter(field => 
        field.includes('parent') || 
        field.includes('child') || 
        field.includes('sub') ||
        field.includes('depend')
      );
      
      console.log('\n🔗 Champs potentiellement liés à la hiérarchie:');
      hierarchyFields.forEach(field => {
        const fieldInfo = result.result[field];
        console.log(`   - ${field}: ${fieldInfo.string} (${fieldInfo.type})`);
        if (fieldInfo.relation) {
          console.log(`     Relation: ${fieldInfo.relation}`);
        }
      });
      
      console.log('\n📋 Tous les champs disponibles:');
      fields.forEach(field => {
        const fieldInfo = result.result[field];
        console.log(`   - ${field}: ${fieldInfo.string} (${fieldInfo.type})`);
      });
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🚀 Début des tests pour la hiérarchie des tâches');
  console.log('===============================================\n');
  
  await testTaskHierarchyFields();
  await testAllTasksHierarchy();
  await testTaskFields();
  
  console.log('\n✅ Tous les tests terminés');
}

runAllTests().catch(console.error);

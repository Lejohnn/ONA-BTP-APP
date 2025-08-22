const https = require('https');

// Configuration
const odooUrl = 'https://btp.onaerp.com/jsonrpc';
const dbName = 'btptst';
const uid = 7; // UID par défaut

// Requête pour récupérer les projets avec les nouveaux champs de site
const requestBody = {
  jsonrpc: "2.0",
  method: "call",
  params: {
    service: "object",
    method: "execute_kw",
    args: [
      dbName,
      uid,
      "demo",
      "project.project",
      "search_read",
      [[["user_id", "=", uid]]], // Récupérer seulement les projets de l'utilisateur connecté
      {
        fields: [
          'id', 'name', 'description', 'state', 'user_id', 'partner_id',
          'date_start', 'date', 'progressbar', 'task_ids', 'type_of_construction',
          'site_name', 'site_area', 'site_width', 'site_length'
        ],
        limit: 10
      }
    ]
  }
};

console.log('🔍 Test de l\'API Odoo pour les projets avec les nouveaux champs de site');
console.log('📤 Requête envoyée:', JSON.stringify(requestBody, null, 2));

// Options pour la requête HTTPS
const options = {
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

// Fonction pour faire la requête
function makeRequest() {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          reject(new Error(`Erreur de parsing JSON: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Erreur de requête: ${error.message}`));
    });
    
    req.write(JSON.stringify(requestBody));
    req.end();
  });
}

// Exécution du test
async function testProjectAPI() {
  try {
    console.log('🚀 Envoi de la requête...');
    const response = await makeRequest();
    
    console.log('📦 Réponse reçue:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data?.result) {
      const projects = response.data.result;
      console.log(`✅ ${projects.length} projets récupérés`);
      
      // Analyser chaque projet pour vérifier les champs de site
      projects.forEach((project, index) => {
        console.log(`\n📋 Projet ${index + 1}: ${project.name}`);
        console.log(`   ID: ${project.id}`);
        console.log(`   État: ${project.state}`);
        console.log(`   Type de construction: ${project.type_of_construction || 'Non renseigné'}`);
        console.log(`   Site name: ${project.site_name || 'Non renseigné'}`);
        console.log(`   Site area: ${project.site_area || 'Non renseigné'}`);
        console.log(`   Site width: ${project.site_width || 'Non renseigné'}`);
        console.log(`   Site length: ${project.site_length || 'Non renseigné'}`);
        
        // Vérifier si les champs de site sont présents
        const hasSiteInfo = project.site_name || project.site_area || project.site_width || project.site_length;
        console.log(`   📍 Informations de site disponibles: ${hasSiteInfo ? 'OUI' : 'NON'}`);
      });
      
      // Résumé
      const projectsWithSiteInfo = projects.filter(p => p.site_name || p.site_area || p.site_width || p.site_length);
      console.log(`\n📊 Résumé:`);
      console.log(`   Total projets: ${projects.length}`);
      console.log(`   Projets avec infos de site: ${projectsWithSiteInfo.length}`);
      console.log(`   Projets sans infos de site: ${projects.length - projectsWithSiteInfo.length}`);
      
    } else {
      console.error('❌ Erreur dans la réponse API');
      console.error('Status:', response.status);
      console.error('Data:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Lancer le test
testProjectAPI();

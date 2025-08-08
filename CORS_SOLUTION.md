# 🔧 Solution CORS pour Odoo - ONA BTP

## 🚨 Problème Identifié

L'erreur CORS indique que le serveur Odoo ne gère pas correctement les requêtes cross-origin :

```
Access to fetch at 'https://btp.onaerp.com/jsonrpc' from origin 'http://localhost:8100' has been blocked by CORS policy
```

## 🛠️ Solutions

### **Solution 1 : Configuration CORS côté Serveur Odoo**

#### A. Configuration Apache/Nginx (Recommandé)

Si Odoo est derrière Apache ou Nginx, ajoutez ces headers :

**Pour Apache (.htaccess ou configuration) :**
```apache
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
Header always set Access-Control-Max-Age "86400"

# Gérer les requêtes OPTIONS (preflight)
RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

**Pour Nginx :**
```nginx
location /jsonrpc {
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    add_header 'Access-Control-Max-Age' '86400' always;
    
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
        add_header 'Access-Control-Max-Age' '86400';
        add_header 'Content-Type' 'text/plain; charset=utf-8';
        add_header 'Content-Length' '0';
        return 204;
    }
    
    proxy_pass http://localhost:8069;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

#### B. Configuration Odoo (Alternative)

Dans le fichier de configuration Odoo (`odoo.conf`) :

```ini
[options]
# Activer CORS
cors_enabled = True
cors_origins = *
cors_methods = GET,POST,OPTIONS
cors_headers = Content-Type,Authorization
```

### **Solution 2 : Proxy CORS Temporaire**

En attendant la configuration serveur, vous pouvez utiliser un proxy CORS :

#### A. Service de Proxy CORS

```javascript
// Service de proxy CORS temporaire
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const ODOO_URL = 'https://btp.onaerp.com/jsonrpc';

// Utiliser le proxy pour les requêtes
const proxiedUrl = CORS_PROXY + ODOO_URL;
```

#### B. Proxy Local avec Node.js

Créez un fichier `cors-proxy.js` :

```javascript
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Configuration CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Proxy vers Odoo
app.use('/odoo', createProxyMiddleware({
  target: 'https://btp.onaerp.com',
  changeOrigin: true,
  pathRewrite: {
    '^/odoo': ''
  }
}));

app.listen(3000, () => {
  console.log('CORS Proxy running on port 3000');
});
```

### **Solution 3 : Modification de l'Application Mobile**

#### A. Utiliser Capacitor avec Configuration Spéciale

Modifiez le service d'authentification pour gérer CORS :

```typescript
// Dans auth.service.ts
private async makeOdooRequest(body: any): Promise<any> {
  const options = {
    url: this.odooUrl,
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'ONA-BTP-Mobile/1.0',
      // Headers CORS supplémentaires
      'Origin': 'capacitor://localhost',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    },
    data: body,
    connectTimeout: 45000,
    readTimeout: 45000
  };

  return CapacitorHttp.post(options);
}
```

#### B. Configuration Capacitor pour CORS

Dans `capacitor.config.ts` :

```typescript
const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'ONA BTP CC',
  webDir: 'www',
  server: {
    androidScheme: 'https',
    // Configuration CORS
    allowNavigation: ['https://btp.onaerp.com/*'],
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};
```

## 🧪 **Test de Validation**

### **Test 1 : Vérifier la Configuration CORS**

```bash
# Test avec curl pour vérifier les headers CORS
curl -I -X OPTIONS https://btp.onaerp.com/jsonrpc \
  -H "Origin: http://localhost:8100" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

**Réponse attendue :**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### **Test 2 : Test depuis le Navigateur**

```javascript
// Test dans la console du navigateur
fetch('https://btp.onaerp.com/jsonrpc', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'common',
      method: 'version',
      args: []
    }
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));
```

## 📞 **Contact Administrateur**

Si vous n'avez pas accès à la configuration serveur, contactez l'administrateur Odoo avec ces informations :

### **Demande de Configuration CORS :**

```
Bonjour,

Notre application mobile ONA BTP rencontre des erreurs CORS lors de la connexion à l'API Odoo.

URL concernée : https://btp.onaerp.com/jsonrpc

Erreur : Access to fetch at 'https://btp.onaerp.com/jsonrpc' from origin 'http://localhost:8100' has been blocked by CORS policy

Configuration CORS nécessaire :
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods: GET, POST, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Authorization
- Gestion des requêtes OPTIONS (preflight)

Merci de configurer ces headers CORS sur le serveur Odoo.

Cordialement,
```

## 🔄 **Solution Temporaire**

En attendant la configuration serveur, vous pouvez :

1. **Tester sur un appareil physique** (pas d'émulateur)
2. **Utiliser un VPN** pour contourner les restrictions
3. **Configurer un proxy CORS local**
4. **Utiliser l'accès direct** pour les tests

## 📱 **Test sur Appareil Physique**

Les applications mobiles natives (via Capacitor) ont moins de restrictions CORS que les navigateurs web. Testez sur un appareil Android/iOS réel pour voir si le problème persiste. 
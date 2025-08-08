# 🚨 Résolution du Problème CORS - ONA BTP

## 📋 **Résumé du Problème**

Vous avez correctement identifié le problème : **CORS (Cross-Origin Resource Sharing)**. L'erreur que vous voyez :

```
Access to fetch at 'https://btp.onaerp.com/jsonrpc' from origin 'http://localhost:8100' has been blocked by CORS policy
```

Confirme que le serveur Odoo n'est pas configuré pour accepter les requêtes cross-origin.

## ✅ **Pourquoi cURL fonctionne mais pas l'app mobile**

| Méthode | CORS | Fonctionne |
|---------|------|------------|
| **cURL** | ❌ Pas de restrictions | ✅ Fonctionne |
| **Navigateur Web** | ✅ Restrictions CORS | ❌ Bloqué |
| **App Mobile (Capacitor)** | ✅ Restrictions CORS | ❌ Bloqué |

## 🛠️ **Solutions Immédiates**

### **Solution 1 : Test sur Appareil Physique (Recommandé)**

Les applications mobiles natives ont moins de restrictions CORS que les navigateurs web.

```bash
# Build et test sur appareil physique
ionic capacitor build android
ionic capacitor run android --device
```

### **Solution 2 : Test de Configuration CORS**

Exécutez le script de test pour diagnostiquer :

```bash
# Dans le répertoire ona_btp_app
node test-cors.js
```

### **Solution 3 : Configuration Temporaire**

Modifiez temporairement l'URL pour tester :

```typescript
// Dans environment.ts
export const environment = {
  production: false,
  // URL temporaire pour test
  odooUrl: 'https://cors-anywhere.herokuapp.com/https://btp.onaerp.com/jsonrpc',
  odooDb: 'btptst'
};
```

## 📞 **Contact Administrateur Odoo**

### **Message à envoyer :**

```
Bonjour,

Notre application mobile ONA BTP rencontre des erreurs CORS lors de la connexion à l'API Odoo.

URL concernée : https://btp.onaerp.com/jsonrpc

Erreur détectée :
Access to fetch at 'https://btp.onaerp.com/jsonrpc' from origin 'http://localhost:8100' has been blocked by CORS policy

Configuration CORS nécessaire sur le serveur Odoo :

1. Headers CORS requis :
   - Access-Control-Allow-Origin: *
   - Access-Control-Allow-Methods: GET, POST, OPTIONS
   - Access-Control-Allow-Headers: Content-Type, Authorization
   - Access-Control-Max-Age: 86400

2. Gestion des requêtes OPTIONS (preflight)

3. Configuration Apache/Nginx (si applicable) :
   - Ajouter les headers CORS dans la configuration
   - Gérer les requêtes OPTIONS

Cette configuration permettra à notre application mobile d'accéder à l'API Odoo sans erreurs CORS.

Merci de votre assistance.

Cordialement,
```

## 🔧 **Solutions Techniques**

### **A. Configuration Apache (.htaccess)**

```apache
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
Header always set Access-Control-Max-Age "86400"

RewriteEngine On
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
```

### **B. Configuration Nginx**

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
}
```

### **C. Configuration Odoo (odoo.conf)**

```ini
[options]
cors_enabled = True
cors_origins = *
cors_methods = GET,POST,OPTIONS
cors_headers = Content-Type,Authorization
```

## 🧪 **Tests de Validation**

### **Test 1 : Vérifier les Headers CORS**

```bash
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

Ouvrez la console du navigateur et exécutez :

```javascript
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

## 📱 **Test sur Appareil Physique**

### **Étapes :**

1. **Build l'application :**
   ```bash
   ionic capacitor build android
   ```

2. **Installer sur appareil physique :**
   ```bash
   ionic capacitor run android --device
   ```

3. **Tester les outils de diagnostic :**
   - "Test cURL exact"
   - "Tester la connectivité réseau"
   - "Diagnostic complet"

## 🔄 **Solutions Temporaires**

### **A. Utiliser l'Accès Direct**

En attendant la configuration CORS, utilisez le bouton "Accès direct" pour tester l'application.

### **B. Proxy CORS Local**

Créez un proxy CORS local :

```javascript
// cors-proxy.js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

## 📊 **Statut Actuel**

- ✅ **cURL fonctionne** : L'API Odoo est accessible
- ❌ **CORS non configuré** : Le serveur bloque les requêtes cross-origin
- ✅ **Code mobile corrigé** : Gestion améliorée des erreurs CORS
- ✅ **Outils de diagnostic** : Tests intégrés dans l'application

## 🎯 **Prochaines Étapes**

1. **Contactez l'administrateur Odoo** avec le message fourni
2. **Testez sur appareil physique** pour voir si CORS est contourné
3. **Utilisez les outils de diagnostic** pour identifier les problèmes
4. **Attendez la configuration CORS** côté serveur

## 📞 **Support**

Si les problèmes persistent après la configuration CORS :

1. Consultez les logs de la console
2. Utilisez les outils de diagnostic intégrés
3. Testez avec différents réseaux (WiFi/mobile)
4. Vérifiez les paramètres de sécurité de l'appareil

---

**Note :** Le problème CORS est une limitation de sécurité côté serveur. Une fois configuré correctement, l'application mobile fonctionnera parfaitement. 
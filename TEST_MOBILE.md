# 📱 Guide de Test Mobile - ONA BTP

## 🎯 **Objectif Principal**

Résoudre le problème d'authentification sur mobile en utilisant exactement la même structure que votre requête cURL qui fonctionne.

## 🔧 **Corrections Apportées**

### **1. Structure de Requête Corrigée**

**Avant (incorrect) :**
```typescript
args: [this.dbName, codeclient, password] // this.dbName = 'btptst'
```

**Après (correct - comme votre cURL) :**
```typescript
args: ['btptst', codeclient, password] // Utilisation directe
```

### **2. Nouveaux Tests Ajoutés**

- ✅ **Test Auth cURL exacte** : Teste l'authentification avec les identifiants exacts de votre cURL
- ✅ **Test cURL exact** : Teste la connectivité API avec la structure exacte
- ✅ **Logs détaillés** : Pour diagnostiquer les problèmes

## 🧪 **Tests à Effectuer sur Mobile**

### **Étape 1 : Test de Connectivité**

1. **Tester la connectivité réseau**
   - Bouton : "Tester la connectivité réseau"
   - Vérifie l'accès internet général

2. **Tester la connexion Odoo**
   - Bouton : "Tester la connexion Odoo"
   - Vérifie l'accès à l'API Odoo

### **Étape 2 : Test d'Authentification**

3. **Test cURL exact**
   - Bouton : "Test cURL exact"
   - Teste la structure de requête exacte

4. **Test Auth cURL exacte**
   - Bouton : "Test Auth cURL exacte"
   - Teste l'authentification avec vos identifiants cURL

### **Étape 3 : Test d'Authentification Réelle**

5. **Authentification avec formulaire**
   - Utilisez : `ingineer.btp@gmail.com` / `demo`
   - Vérifiez les logs dans la console

## 📊 **Interprétation des Résultats**

### **Si tous les tests réussissent :**
- ✅ Connectivité réseau OK
- ✅ API Odoo accessible
- ✅ Structure de requête correcte
- ✅ Authentification fonctionne

### **Si certains tests échouent :**

#### **Test réseau échoue :**
- Problème de connexion internet
- Vérifiez WiFi/mobile data

#### **Test Odoo échoue :**
- Problème CORS ou serveur inaccessible
- Vérifiez l'URL de l'API

#### **Test cURL exact échoue :**
- Problème de structure de requête
- Vérifiez les logs pour détails

#### **Test Auth cURL exacte échoue :**
- Problème d'authentification spécifique
- Vérifiez les identifiants et la réponse serveur

## 🔍 **Logs à Surveiller**

### **Dans la Console Mobile :**

```javascript
// Recherchez ces messages dans les logs :
"=== TEST EXACT CURL LOGIN ==="
"Test body (exact cURL):"
"=== TEST CURL RÉUSSI ==="
"✅ Test cURL login successful, UID:"
"❌ Test cURL login failed"
```

### **Informations Clés :**

1. **Status de la réponse** (200 = OK, 403 = Erreur auth, etc.)
2. **UID retourné** (nombre > 0 = succès)
3. **Erreurs détaillées** (CORS, timeout, etc.)

## 🛠️ **Commandes de Build et Test**

```bash
# Build pour mobile
ionic capacitor build android

# Installer sur appareil physique
ionic capacitor run android --device

# Ou utiliser Android Studio
ionic capacitor open android
```

## 📱 **Test sur Appareil Physique**

### **Étapes Recommandées :**

1. **Installez l'APK sur votre appareil**
2. **Ouvrez l'application**
3. **Allez à la page de login**
4. **Testez dans cet ordre :**
   - "Tester la connectivité réseau"
   - "Tester la connexion Odoo"
   - "Test cURL exact"
   - "Test Auth cURL exacte"
   - **Enfin :** Essayez de vous connecter avec `ingineer.btp@gmail.com` / `demo`

## 🔧 **Dépannage**

### **Si l'authentification échoue toujours :**

1. **Vérifiez les logs de la console**
2. **Comparez avec les résultats des tests**
3. **Vérifiez que tous les tests passent**
4. **Regardez les détails de la réponse serveur**

### **Si les boutons de test ne répondent pas :**

1. **Vérifiez la console pour les erreurs JavaScript**
2. **Redémarrez l'application**
3. **Vérifiez la connexion internet**

## 📞 **Support**

### **Informations à Collecter :**

1. **Résultats de tous les tests**
2. **Logs de la console**
3. **Messages d'erreur exacts**
4. **Version de l'application**
5. **Type d'appareil et OS**

### **En cas de problème persistant :**

1. **Contactez l'administrateur Odoo** pour la configuration CORS
2. **Testez sur différents appareils**
3. **Vérifiez les paramètres de sécurité de l'appareil**

---

**Note :** L'objectif est que l'authentification fonctionne exactement comme votre requête cURL. Si les tests passent mais l'authentification échoue, nous aurons des informations détaillées pour diagnostiquer le problème. 
# 📱 Guide pour Voir les Logs sur Mobile - ONA BTP

## 🔍 **Comment Voir les Logs sur Mobile**

### **Méthode 1 : Logs Visibles dans l'Application**

✅ **Nouveau :** Les logs s'affichent maintenant directement dans l'application !

1. **Ouvrez l'application sur votre Pixel 4a**
2. **Allez à la page de login**
3. **Regardez la zone "📋 Logs de diagnostic"** en bas de l'écran
4. **Les logs s'affichent en temps réel** pendant les tests

### **Méthode 2 : Logs via Android Studio**

1. **Connectez votre Pixel 4a à l'ordinateur**
2. **Ouvrez Android Studio**
3. **Allez dans "Logcat"** (en bas de l'écran)
4. **Filtrez par votre application** :
   - Sélectionnez votre appareil
   - Sélectionnez votre application "ONA BTP"
   - Tapez "APP LOG" dans le filtre

### **Méthode 3 : Logs via ADB (Command Line)**

```bash
# Dans le terminal, connecté à votre appareil
adb logcat | grep "APP LOG"

# Ou pour voir tous les logs de l'application
adb logcat | grep "ona_btp_app"
```

## 🧪 **Tests à Effectuer et Logs à Surveiller**

### **Test 1 : Connectivité Réseau**
```bash
# Logs attendus :
[APP LOG]: === TEST CONNECTIVITÉ RÉSEAU ===
[APP LOG]: ✅ Connectivité réseau OK - Internet fonctionne
# OU
[APP LOG]: ❌ Problème de connectivité réseau
```

### **Test 2 : Connexion Odoo**
```bash
# Logs attendus :
[APP LOG]: === TEST CONNEXION ODOO ===
[APP LOG]: ✅ Connexion Odoo OK - Le serveur répond
# OU
[APP LOG]: ❌ Connexion Odoo échouée
```

### **Test 3 : Test cURL Exact**
```bash
# Logs attendus :
[APP LOG]: === TEST EXACT CURL REQUEST ===
[APP LOG]: ✅ Test cURL exact réussi - L'API Odoo fonctionne !
# OU
[APP LOG]: ❌ Test cURL exact échoué
```

### **Test 4 : Authentification cURL Exacte**
```bash
# Logs attendus :
[APP LOG]: === TEST AUTHENTIFICATION CURL EXACT ===
[APP LOG]: ✅ Authentification cURL exacte réussie ! UID reçu
# OU
[APP LOG]: ❌ Authentification cURL exacte échouée
```

## 🔧 **Dépannage des Notifications**

### **Problème : Les notifications ne s'affichent pas sur mobile**

**Solution :**
1. **Les notifications sont maintenant améliorées** avec des alertes natives
2. **Les logs s'affichent dans l'application** même si les notifications ne marchent pas
3. **Vérifiez la zone de logs** en bas de l'écran

### **Si rien ne s'affiche :**

1. **Vérifiez que l'application est bien installée**
2. **Redémarrez l'application**
3. **Vérifiez la connexion internet**
4. **Regardez les logs via Android Studio**

## 📊 **Interprétation des Logs**

### **Logs de Succès :**
```
[APP LOG]: === TEST AUTHENTIFICATION CURL EXACT ===
[APP LOG]: ✅ Authentification cURL exacte réussie ! UID reçu
```

### **Logs d'Erreur :**
```
[APP LOG]: === TEST AUTHENTIFICATION CURL EXACT ===
[APP LOG]: ❌ Authentification cURL exacte échouée
[APP LOG]: ❌ Erreur authentification: Failed to fetch
```

### **Logs de Diagnostic :**
```
[APP LOG]: === TEST CONNECTIVITÉ RÉSEAU ===
[APP LOG]: ✅ Connectivité réseau OK - Internet fonctionne
[APP LOG]: === TEST CONNEXION ODOO ===
[APP LOG]: ❌ Connexion Odoo échouée
```

## 🎯 **Étapes de Test Recommandées**

1. **Ouvrez l'application sur votre Pixel 4a**
2. **Allez à la page de login**
3. **Regardez la zone de logs en bas**
4. **Testez dans cet ordre :**
   - "Tester la connectivité réseau"
   - "Tester la connexion Odoo"
   - "Test cURL exact"
   - "Test Auth cURL exacte"
5. **Notez les résultats dans les logs**
6. **Essayez l'authentification réelle**

## 📞 **Support**

### **Si les logs ne s'affichent pas :**

1. **Vérifiez Android Studio Logcat**
2. **Redémarrez l'application**
3. **Vérifiez que l'APK est à jour**
4. **Contactez-nous avec les logs d'Android Studio**

### **Informations à Collecter :**

1. **Logs de l'application** (zone visible)
2. **Logs Android Studio** (Logcat)
3. **Résultats des tests**
4. **Messages d'erreur exacts**

---

**Note :** Les logs sont maintenant visibles directement dans l'application, ce qui facilite grandement le diagnostic sur mobile ! 
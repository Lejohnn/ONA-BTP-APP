# 🔧 Guide de Diagnostic Mobile - ONA BTP

## 📱 Problèmes de Connexion Mobile

Ce guide vous aide à diagnostiquer et résoudre les problèmes de connexion mobile avec l'application ONA BTP.

## 🚨 Problèmes Courants

### 1. **Impossible de se connecter à l'API Odoo**

**Symptômes :**
- L'application ne parvient pas à se connecter au serveur
- Messages d'erreur "Connexion impossible" ou "Timeout"
- L'authentification échoue même avec les bons identifiants

**Solutions :**

#### A. Vérifier la connectivité réseau
1. Testez votre connexion internet (WiFi ou mobile)
2. Utilisez le bouton "Tester la connectivité réseau" dans l'app
3. Vérifiez que vous avez un signal stable

#### B. Vérifier l'URL de l'API
- URL actuelle : `https://btp.onaerp.com/jsonrpc`
- Assurez-vous que cette URL est accessible depuis votre appareil
- Testez avec le bouton "Tester la connexion Odoo"

#### C. Problèmes de certificats SSL
- Certains réseaux mobiles bloquent les connexions HTTPS
- Essayez de vous connecter via WiFi plutôt que mobile
- Vérifiez les paramètres de sécurité de votre appareil

### 2. **Timeouts et Connexions Lentes**

**Symptômes :**
- L'application met beaucoup de temps à répondre
- Messages d'erreur "Timeout"
- Connexions qui échouent après un délai

**Solutions :**

#### A. Optimiser la connexion réseau
- Passez en WiFi si possible (plus stable que mobile)
- Évitez les réseaux publics avec restrictions
- Vérifiez la qualité du signal

#### B. Redémarrer l'application
1. Fermez complètement l'application
2. Redémarrez votre appareil
3. Relancez l'application

#### C. Vider le cache
- Allez dans les paramètres de votre appareil
- Applications > ONA BTP > Stockage
- Videz le cache et les données

### 3. **Erreurs d'Authentification**

**Symptômes :**
- Identifiants rejetés même s'ils sont corrects
- Messages "Identifiants incorrects"
- Impossible de se connecter avec des identifiants valides

**Solutions :**

#### A. Vérifier les identifiants
- Assurez-vous que le code client est correct
- Vérifiez que le mot de passe est exact
- Testez les identifiants sur le web si possible

#### B. Problème de base de données
- Vérifiez que la base de données `btptst` est accessible
- Contactez l'administrateur système

## 🛠️ Outils de Diagnostic Intégrés

### 1. **Diagnostic Complet**
Utilisez le bouton "Diagnostic complet" pour :
- Tester la connectivité internet
- Vérifier l'accessibilité du serveur Odoo
- Mesurer la latence réseau
- Générer un rapport détaillé

### 2. **Test de Connectivité Réseau**
Teste si votre appareil peut accéder à internet en général.

### 3. **Test de Connexion Odoo**
Teste spécifiquement la connexion à l'API Odoo.

## 📊 Interprétation des Résultats

### ✅ Tests Réussis
- **Connectivité réseau OK** : Votre appareil peut accéder à internet
- **Connexion Odoo OK** : Le serveur Odoo est accessible
- **Latence < 2000ms** : Connexion rapide

### ❌ Tests Échoués
- **Connectivité réseau échouée** : Problème de connexion internet
- **Connexion Odoo échouée** : Serveur inaccessible ou problème d'URL
- **Latence > 5000ms** : Connexion lente

## 🔧 Solutions Avancées

### 1. **Configuration Android**
- Vérifiez les permissions réseau dans les paramètres
- Désactivez temporairement l'antivirus
- Vérifiez les paramètres de proxy

### 2. **Configuration iOS**
- Vérifiez les paramètres de confidentialité
- Désactivez temporairement le VPN
- Vérifiez les restrictions de contenu

### 3. **Problèmes de Réseau**
- Essayez un autre réseau WiFi
- Testez avec une connexion mobile différente
- Vérifiez les restrictions du réseau

## 📞 Support Technique

Si les problèmes persistent :

1. **Collectez les informations de diagnostic**
   - Utilisez le diagnostic complet
   - Notez les messages d'erreur exacts
   - Capturez les logs de la console

2. **Contactez le support**
   - Fournissez le rapport de diagnostic
   - Décrivez les étapes de reproduction
   - Indiquez votre type d'appareil et OS

## 🔄 Mise à Jour de l'Application

Assurez-vous d'avoir la dernière version de l'application :
- Vérifiez les mises à jour dans le store
- Redémarrez l'application après mise à jour
- Videz le cache si nécessaire

## 📋 Checklist de Dépannage

- [ ] Test de connectivité réseau
- [ ] Test de connexion Odoo
- [ ] Vérification des identifiants
- [ ] Test sur différents réseaux
- [ ] Redémarrage de l'application
- [ ] Vérification des permissions
- [ ] Diagnostic complet exécuté

---

**Note :** Ce guide est spécifique à l'application ONA BTP. Pour des problèmes généraux de réseau, consultez la documentation de votre fournisseur d'accès internet. 
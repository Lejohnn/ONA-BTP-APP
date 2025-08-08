# 🧪 Guide de Test - Mode Hors Ligne

## 🎯 Objectifs de Test

### ✅ Fonctionnalités à Tester

1. **Authentification Hors Ligne**
   - Connexion avec cache local
   - Gestion des identifiants en cache
   - Messages d'information appropriés

2. **Affichage des Projets**
   - Chargement depuis le cache local
   - Gestion des images avec fallback
   - Indicateurs de statut hors ligne

3. **Synchronisation**
   - Queue d'actions en attente
   - Synchronisation automatique au retour en ligne
   - Gestion des erreurs de synchronisation

## 📱 Tests sur Mobile

### 🔌 Test 1 : Authentification Hors Ligne

#### Prérequis
- Être connecté au moins une fois avec internet
- Avoir des données en cache

#### Étapes
1. **Désactiver le WiFi/Données mobiles**
2. **Ouvrir l'application**
3. **Tenter de se connecter avec les identifiants en cache**

#### Résultats Attendus
- ✅ **Message** : "Mode hors ligne - Connexion avec cache local"
- ✅ **Connexion** : Réussie avec les données en cache
- ✅ **Navigation** : Vers la liste des projets
- ✅ **Indicateur** : Badge "Hors ligne" visible

### 📊 Test 2 : Affichage des Projets Hors Ligne

#### Étapes
1. **Être connecté en mode hors ligne**
2. **Naviguer vers la liste des projets**
3. **Vérifier l'affichage des projets**

#### Résultats Attendus
- ✅ **Indicateur** : "Mode hors ligne - Données en cache"
- ✅ **Projets** : Affichage des projets depuis le cache
- ✅ **Images** : Images avec fallback intelligent
- ✅ **Performance** : Chargement rapide (pas d'appels API)

### 🔄 Test 3 : Synchronisation

#### Étapes
1. **Être en mode hors ligne**
2. **Ajouter un nouveau projet** (simulation)
3. **Réactiver internet**
4. **Observer la synchronisation**

#### Résultats Attendus
- ✅ **Queue** : Projet ajouté à la queue de synchronisation
- ✅ **Message** : "Projet ajouté à la queue de synchronisation"
- ✅ **Synchronisation** : Automatique au retour en ligne
- ✅ **Notification** : "X action(s) synchronisée(s)"

### 🖼️ Test 4 : Gestion des Images

#### Étapes
1. **Vérifier l'affichage des images de projets**
2. **Simuler une erreur de chargement d'image**
3. **Vérifier le fallback**

#### Résultats Attendus
- ✅ **Images** : Affichage correct selon le type/état
- ✅ **Fallback** : Image de remplacement en cas d'erreur
- ✅ **Performance** : Chargement optimisé

## 🖥️ Tests sur Web

### 🌐 Test 5 : Simulation Hors Ligne (Navigateur)

#### Étapes
1. **Ouvrir les DevTools (F12)**
2. **Aller dans l'onglet Network**
3. **Cocher "Offline"**
4. **Tester l'application**

#### Résultats Attendus
- ✅ **Comportement** : Identique au mobile
- ✅ **Messages** : Indicateurs de mode hors ligne
- ✅ **Cache** : Utilisation du cache local

## 🐛 Tests d'Erreurs

### ❌ Test 6 : Cache Vide

#### Étapes
1. **Effacer le cache** (bouton "Effacer cache")
2. **Se déconnecter**
3. **Passer en mode hors ligne**
4. **Tenter de se connecter**

#### Résultats Attendus
- ✅ **Message** : "Connexion internet requise pour la première authentification"
- ✅ **Comportement** : Pas de connexion possible

### 🔄 Test 7 : Erreur de Synchronisation

#### Étapes
1. **Être en mode hors ligne**
2. **Ajouter plusieurs projets**
3. **Simuler une erreur de synchronisation**
4. **Vérifier la gestion d'erreur**

#### Résultats Attendus
- ✅ **Gestion** : Erreurs loggées dans la console
- ✅ **Queue** : Actions restent en attente
- ✅ **Retry** : Nouvelle tentative au prochain cycle

## 📊 Métriques à Surveiller

### Performance
- **Temps de chargement** : < 2s en mode hors ligne
- **Taille du cache** : < 50MB
- **Mémoire utilisée** : Stable

### Fonctionnalité
- **Taux de succès** : 100% pour les opérations en cache
- **Synchronisation** : 100% des actions synchronisées
- **Erreurs** : 0% d'erreurs critiques

## 🛠️ Outils de Debug

### Console Logs
```javascript
// Vérifier le statut du cache
await this.offlineStorage.getCacheStats();

// Vérifier la queue de synchronisation
this.offlineStorage.getSyncQueue().subscribe(queue => {
  console.log('Queue:', queue);
});

// Vérifier le statut de connexion
this.offlineStorage.getOnlineStatus().subscribe(isOnline => {
  console.log('Online:', isOnline);
});
```

### Local Storage
```javascript
// Vérifier les données en cache
localStorage.getItem('odoo_uid');
localStorage.getItem('cached_user');
localStorage.getItem('cached_projects');
```

## 🎯 Critères de Validation

### ✅ Test Réussi Si
- [ ] Authentification fonctionne en mode hors ligne
- [ ] Projets s'affichent depuis le cache
- [ ] Images se chargent avec fallback
- [ ] Synchronisation fonctionne au retour en ligne
- [ ] Messages d'information sont clairs
- [ ] Performance reste acceptable
- [ ] Pas d'erreurs critiques

### ❌ Test Échoué Si
- [ ] Impossible de se connecter hors ligne
- [ ] Projets ne s'affichent pas
- [ ] Images ne se chargent pas
- [ ] Synchronisation ne fonctionne pas
- [ ] Messages confus ou manquants
- [ ] Performance dégradée
- [ ] Erreurs critiques

## 🚀 Améliorations Futures

### Fonctionnalités Avancées
- [ ] **Synchronisation partielle** : Synchroniser seulement les données modifiées
- [ ] **Compression des données** : Réduire la taille du cache
- [ ] **Synchronisation en arrière-plan** : Synchroniser sans bloquer l'interface
- [ ] **Gestion des conflits** : Résoudre les conflits de données
- [ ] **Notifications push** : Informer des changements synchronisés

### Optimisations
- [ ] **Cache intelligent** : Supprimer automatiquement les anciennes données
- [ ] **Préchargement** : Charger les données importantes en avance
- [ ] **Compression d'images** : Optimiser les images en cache
- [ ] **Indexation** : Améliorer la recherche dans le cache 
# Architecture d'Hydratation - ONA BTP Mobile App

## Vue d'ensemble

Cette architecture implémente le **pattern d'hydratation** pour optimiser la gestion des données provenant de l'API Odoo dans l'application mobile. Elle sépare clairement la logique métier de la logique de présentation et améliore les performances de rendu.

## Structure de l'Architecture

### 1. Interfaces de Base (`src/app/models/interfaces/`)

#### `base.interface.ts`
- **IBaseModel** : Interface commune pour tous les modèles
- **IErrorHandling** : Gestion des erreurs de validation
- **ILoadingState** : Gestion des états de chargement

#### `user.interface.ts`
- **IUserOdoo** : Structure exacte des données brutes d'Odoo
- **IUser** : Interface du modèle utilisateur hydraté

#### `project.interface.ts`
- **IProjectOdoo** : Données brutes du modèle project.project
- **IProject** : Modèle projet hydraté

#### `task.interface.ts`
- **ITaskOdoo** : Données brutes du modèle project.task
- **ITask** : Modèle tâche hydraté

### 2. Classes de Base (`src/app/models/base/`)

#### `base-model.ts`
Classe abstraite qui implémente :
- Logique commune d'hydratation
- Méthodes utilitaires pour le nettoyage des données
- Gestion des erreurs et états de chargement
- Parsing des dates et tuples Odoo

### 3. Modèles Métier (`src/app/models/`)

#### `user.model.ts`
Classe `User` qui étend `BaseModel` et implémente `IUser` :
- Hydratation complète des données utilisateur
- Validation des données
- Méthodes métier spécifiques (formatage, calculs)
- Optimisation pour l'affichage mobile

### 4. Services d'Hydratation (`src/app/services/`)

#### `hydration.service.ts`
Service centralisé qui :
- Coordonne l'hydratation de tous les modèles
- Valide les données avant traitement
- Gère les erreurs et cas par défaut
- Fournit des utilitaires de débogage

## Avantages du Pattern d'Hydratation

### 1. Performance
- **Calculs pré-calculés** : Les valeurs formatées sont calculées une seule fois
- **Rendu optimisé** : Les templates reçoivent des données prêtes à l'affichage
- **Mémoire optimisée** : Évite les recalculs répétitifs

### 2. Maintenabilité
- **Séparation des responsabilités** : Logique métier séparée de la présentation
- **Code réutilisable** : Méthodes communes dans la classe de base
- **Validation centralisée** : Règles de validation dans les modèles

### 3. Robustesse
- **Gestion d'erreurs** : Validation et nettoyage des données
- **Fallbacks** : Valeurs par défaut en cas d'erreur
- **Logging** : Traçabilité complète du processus d'hydratation

### 4. Flexibilité
- **Extensibilité** : Facile d'ajouter de nouveaux modèles
- **Évolution API** : Adaptation aux changements d'API centralisée
- **Tests** : Modèles testables indépendamment

## Utilisation

### 1. Dans un Service

```typescript
import { HydrationService } from '../services/hydration.service';
import { User } from '../models/user.model';

export class UserService {
  constructor(private hydrationService: HydrationService) {}

  getUserProfile(): Observable<User | null> {
    return this.getUserFromOdoo().pipe(
      map(userData => this.hydrationService.hydrateUser(userData))
    );
  }
}
```

### 2. Dans un Composant

```typescript
import { User } from '../models/user.model';

export class ProfilePage {
  userProfile: User | null = null;

  loadUserProfile() {
    this.userService.getUserProfile().subscribe({
      next: (user: User | null) => {
        if (user && user.isValid()) {
          this.userProfile = user;
        }
      }
    });
  }
}
```

### 3. Dans un Template

```html
<div *ngIf="userProfile">
  <img [src]="userProfile.getAvatarUrl()" [alt]="userProfile.name" />
  <h2>{{ userProfile.name }}</h2>
  <p>{{ userProfile.getFullAddress() }}</p>
  <p>{{ userProfile.getFormattedPhone() }}</p>
</div>
```

## Flux de Données

```
API Odoo → Service API → HydrationService → Modèle Hydraté → Template
    ↓           ↓              ↓                ↓              ↓
Données    Validation    Transformation    Méthodes      Affichage
brutes     et nettoyage   en modèle       métier        optimisé
```

## Validation et Gestion d'Erreurs

### 1. Validation des Données
- Vérification des champs requis
- Validation des formats (email, dates, etc.)
- Contrôle des types de données

### 2. Gestion des Erreurs
- Logging détaillé des erreurs
- Valeurs par défaut en cas d'échec
- Messages d'erreur utilisateur appropriés

### 3. Fallbacks
- Utilisateur par défaut si hydratation échoue
- Images par défaut pour les avatars
- Textes par défaut pour les champs manquants

## Extensions Futures

### 1. Modèles à Implémenter
- **Project** : Gestion des projets avec toutes les relations
- **Task** : Gestion des tâches avec matériaux et équipements
- **Material** : Gestion des matériaux et plans
- **Equipment** : Gestion des équipements et véhicules

### 2. Optimisations Possibles
- **Cache d'hydratation** : Mise en cache des modèles hydratés
- **Hydratation lazy** : Chargement à la demande
- **Compression** : Optimisation de la taille des données

### 3. Fonctionnalités Avancées
- **Synchronisation** : Sync bidirectionnelle avec Odoo
- **Offline** : Gestion hors ligne avec hydratation locale
- **Real-time** : Mises à jour en temps réel

## Bonnes Pratiques

### 1. Développement
- Toujours utiliser les interfaces pour la cohérence
- Implémenter la validation dans les modèles
- Utiliser les méthodes utilitaires de BaseModel
- Logger les erreurs d'hydratation

### 2. Performance
- Éviter les recalculs dans les templates
- Utiliser les méthodes `toDisplay()` pour l'affichage
- Valider les données avant hydratation
- Gérer la mémoire avec les observables

### 3. Maintenance
- Documenter les changements d'API
- Tester les modèles indépendamment
- Maintenir la compatibilité des interfaces
- Surveiller les performances d'hydratation

## Conclusion

Cette architecture d'hydratation fournit une base solide et évolutive pour la gestion des données dans l'application mobile ONA BTP. Elle respecte les principes du génie logiciel et optimise les performances pour une expérience utilisateur fluide.

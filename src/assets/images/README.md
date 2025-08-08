# Guide d'Organisation des Images

## 📁 Structure des Dossiers

```
assets/images/
├── logo.png                    # Logo principal de l'application
├── projects/                   # Images des projets
│   ├── construction-in-progress.jpg
│   ├── construction-completed.jpg
│   ├── construction-cancelled.jpg
│   ├── renovation-in-progress.jpg
│   ├── renovation-completed.jpg
│   ├── renovation-cancelled.jpg
│   ├── maintenance-in-progress.jpg
│   ├── maintenance-completed.jpg
│   ├── maintenance-cancelled.jpg
│   ├── default-in-progress.jpg
│   ├── default-completed.jpg
│   ├── default-cancelled.jpg
│   └── default-project.jpg
├── placeholders/               # Images de remplacement
│   ├── small-placeholder.jpg
│   ├── medium-placeholder.jpg
│   └── large-placeholder.jpg
├── categories/                 # Images par catégorie
│   ├── residential.jpg
│   ├── commercial.jpg
│   ├── industrial.jpg
│   ├── infrastructure.jpg
│   ├── renovation.jpg
│   ├── maintenance.jpg
│   └── default.jpg
├── progress/                   # Images de progression
│   ├── completed.jpg
│   ├── almost-done.jpg
│   ├── halfway.jpg
│   ├── quarter.jpg
│   └── just-started.jpg
└── avatars/                   # Avatars utilisateurs
    ├── user-1.jpg
    ├── user-2.jpg
    └── default-avatar.jpg
```

## 🎨 Recommandations d'Images

### Images de Projets
- **Taille recommandée** : 400x300px
- **Format** : JPG ou PNG
- **Poids maximum** : 200KB par image
- **Style** : Photos réelles de chantiers ou illustrations professionnelles

### Images de Remplacement
- **Taille** : 300x200px (small), 400x300px (medium), 600x400px (large)
- **Style** : Design épuré avec icônes ou illustrations génériques

### Avatars
- **Taille** : 100x100px
- **Format** : JPG ou PNG
- **Style** : Photos de profil ou avatars génériques

## 🔧 Utilisation dans le Code

### Service d'Images
```typescript
// Récupération d'image de projet
const imageUrl = this.imageService.getProjectImage(type, state, customUrl);

// Récupération d'image de remplacement
const placeholder = this.imageService.getPlaceholderImage('medium');

// Gestion d'erreur d'image
<img [src]="imageUrl" (error)="onImageError($event, projet)">
```

### Fallback Intelligent
Le système utilise automatiquement :
1. **Image personnalisée** (si fournie)
2. **Image par type/état** (si configurée)
3. **Image par défaut** (fallback)

## 📱 Optimisation Mobile

### Compression
- Utiliser des images optimisées pour le web
- Compresser les images sans perte de qualité visible
- Utiliser des formats modernes (WebP si supporté)

### Chargement
- Utiliser `loading="lazy"` pour les images
- Implémenter des placeholders pendant le chargement
- Gérer les erreurs de chargement avec des fallbacks

## 🎯 Bonnes Pratiques

1. **Nommage** : Utiliser des noms descriptifs et cohérents
2. **Organisation** : Grouper les images par fonction
3. **Optimisation** : Compresser toutes les images
4. **Accessibilité** : Fournir des textes alternatifs
5. **Responsive** : Préparer différentes tailles si nécessaire

## 🚀 Intégration

Les images sont automatiquement gérées par le `ImageService` qui :
- Valide les URLs d'images
- Fournit des fallbacks intelligents
- Gère les erreurs de chargement
- Optimise l'expérience utilisateur 
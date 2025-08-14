import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  
  // ===== GESTION DES IMAGES DE PROJETS =====
  getProjectImage(projectType: string, projectState: string, customImageUrl?: string): string {
    // Si une image personnalisée est fournie et valide, l'utiliser
    if (customImageUrl && this.isImageUrlValid(customImageUrl)) {
      return customImageUrl;
    }

    // Utiliser les images existantes selon le type et l'état
    return this.getImageByTypeAndState(projectType, projectState);
  }

  private getImageByTypeAndState(type: string, state: string): string {
    // Utiliser les images WebP optimisées
    const imageMap: { [key: string]: string } = {
      'construction': 'assets/images/1.webp',
      'renovation': 'assets/images/2.webp',
      'maintenance': 'assets/images/3.webp',
      'default': 'assets/images/4.webp'
    };

    // Retourner l'image selon le type, sinon utiliser l'image par défaut
    return imageMap[type] || imageMap['default'];
  }

  // ===== VALIDATION D'IMAGES =====
  private isImageUrlValid(url: string): boolean {
    return !!(url && url.trim() !== '' && (
      url.startsWith('http://') || 
      url.startsWith('https://') || 
      url.startsWith('assets/')
    ));
  }

  // ===== GESTION DES PLACEHOLDERS =====
  getPlaceholderImage(size: 'small' | 'medium' | 'large' = 'medium'): string {
    const placeholderMap = {
      small: 'assets/images/placeholders/small-placeholder.webp',
      medium: 'assets/images/placeholders/medium-placeholder.webp',
      large: 'assets/images/placeholders/large-placeholder.webp'
    };

    return placeholderMap[size];
  }

  // ===== GESTION DES AVATARS =====
  getUserAvatar(userId: number, userName?: string): string {
    // Utiliser une icône Ionic par défaut (plus léger qu'une image)
    return 'person-circle';
  }

  // ===== UTILITAIRES =====
  getImageAltText(projectType: string, projectState: string): string {
    const typeNames: { [key: string]: string } = {
      'construction': 'Construction',
      'renovation': 'Rénovation',
      'maintenance': 'Maintenance',
      'repair': 'Réparation',
      'installation': 'Installation'
    };

    const stateNames: { [key: string]: string } = {
      'in_progress': 'en cours',
      'done': 'terminé',
      'cancelled': 'annulé',
      'pending': 'en attente'
    };

    const typeName = typeNames[projectType] || 'Projet';
    const stateName = stateNames[projectState] || '';

    return `${typeName} ${stateName}`.trim();
  }
} 
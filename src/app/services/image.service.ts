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
    // Utiliser les images existantes (1.png, 2.png, 3.png, 4.png)
    const imageMap: { [key: string]: string } = {
      'construction': 'assets/images/1.png',
      'renovation': 'assets/images/2.png',
      'maintenance': 'assets/images/3.png',
      'default': 'assets/images/4.png'
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
      small: 'assets/images/2.png',
      medium: 'assets/images/1.png',
      large: 'assets/images/3.png'
    };

    return placeholderMap[size];
  }

  // ===== GESTION DES AVATARS =====
  getUserAvatar(userId: number, userName?: string): string {
    // Utiliser l'image de profil existante
    return 'assets/images/profile-avatar.png';
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
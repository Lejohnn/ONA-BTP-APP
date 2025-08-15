import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HeaderTitleService {
  private currentTitle = new BehaviorSubject<string>('');
  public currentTitle$ = this.currentTitle.asObservable();

  // Mapping des routes vers les titres avec format "ONA BTP - [Titre]"
  private pageTitles: { [key: string]: string } = {
    '/home': 'ONA BTP - Accueil',
    '/tabs/dashboard': 'ONA BTP - Tableau de Bord',
    '/tabs/projets': 'ONA BTP - Projets',
    '/tabs/taches': 'ONA BTP - Tâches',
    '/tabs/caisse': 'ONA BTP - Caisse',

    '/tabs/profile': 'ONA BTP - Profil',
    '/liste-projets': 'ONA BTP - Liste des Projets',
    '/liste-taches': 'ONA BTP - Liste des Tâches',
    '/detail-projet': 'ONA BTP - Détail Projet',
    '/detail-tache': 'ONA BTP - Détail Tâche',
    '/detail-ressource': 'ONA BTP - Détail Ressource',
    '/creer-tache': 'ONA BTP - Créer Tâche',
    '/modifier-tache': 'ONA BTP - Modifier Tâche',
    '/ajout-equipement': 'ONA BTP - Ajouter Équipement',
    '/assignation-ouvrier': 'ONA BTP - Assignation Ouvrier',
    '/mise-a-jour-projet': 'ONA BTP - Mise à Jour Projet',
    '/login': 'ONA BTP - Connexion',
    '/module-caisse': 'ONA BTP - Module Caisse',

    '/profile': 'ONA BTP - Profil',
    '/taches': 'ONA BTP - Tâches'
  };

  constructor() {}

  /**
   * Définit le titre actuel
   * @param title Titre à définir
   */
  setTitle(title: string) {
    this.currentTitle.next(title);
  }

  /**
   * Obtient le titre pour une route donnée
   * @param route Route de la page
   * @returns Titre formaté "ONA BTP - [Titre]"
   */
  getTitleForRoute(route: string): string {
    return this.pageTitles[route] || 'ONA BTP';
  }

  /**
   * Obtient le titre actuel
   * @returns Titre actuel
   */
  getCurrentTitle(): string {
    return this.currentTitle.value;
  }

  /**
   * Formate un titre personnalisé avec le préfixe ONA BTP
   * @param customTitle Titre personnalisé
   * @returns Titre formaté "ONA BTP - [Titre]"
   */
  formatTitle(customTitle: string): string {
    return `ONA BTP - ${customTitle}`;
  }

  /**
   * Met à jour le titre pour une page avec un nom dynamique (ex: nom du projet)
   * @param baseTitle Titre de base (ex: "Détail Projet")
   * @param dynamicName Nom dynamique (ex: nom du projet)
   * @returns Titre formaté "ONA BTP - [Titre] - [Nom]"
   */
  formatDynamicTitle(baseTitle: string, dynamicName?: string): string {
    if (dynamicName) {
      return `ONA BTP - ${baseTitle} - ${dynamicName}`;
    }
    return `ONA BTP - ${baseTitle}`;
  }
}

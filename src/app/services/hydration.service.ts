import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Project } from '../models/project.model';
import { IUserOdoo } from '../models/interfaces/user.interface';
import { IProjectOdoo } from '../models/interfaces/project.interface';

/**
 * Service d'hydratation centralisé
 * Responsable de la transformation des données brutes Odoo en modèles métier
 * Implémente le pattern d'hydratation pour optimiser les performances
 */
@Injectable({
  providedIn: 'root'
})
export class HydrationService {

  constructor() {
    console.log('🚀 Service d\'hydratation initialisé');
  }

  /**
   * Hydrate un utilisateur à partir des données Odoo
   * @param rawData Données brutes provenant de l'API Odoo
   * @returns Instance User hydratée
   */
  hydrateUser(rawData: IUserOdoo): User {
    console.log('🔄 Hydratation d\'un utilisateur');
    
    try {
      const user = new User(rawData);
      
      if (!user.isValid()) {
        console.warn('⚠️ Utilisateur invalide après hydratation:', user.errors);
      }
      
      return user;
    } catch (error) {
      console.error('❌ Erreur lors de l\'hydratation de l\'utilisateur:', error);
      throw new Error('Échec de l\'hydratation de l\'utilisateur');
    }
  }

  /**
   * Hydrate une liste d'utilisateurs
   * @param rawDataList Liste de données brutes
   * @returns Liste d'utilisateurs hydratés
   */
  hydrateUsers(rawDataList: IUserOdoo[]): User[] {
    console.log(`🔄 Hydratation de ${rawDataList.length} utilisateurs`);
    
    const users: User[] = [];
    const errors: string[] = [];

    rawDataList.forEach((rawData, index) => {
      try {
        const user = this.hydrateUser(rawData);
        users.push(user);
      } catch (error) {
        console.error(`❌ Erreur lors de l'hydratation de l'utilisateur ${index}:`, error);
        errors.push(`Utilisateur ${index + 1}: ${error}`);
      }
    });

    if (errors.length > 0) {
      console.warn('⚠️ Erreurs lors de l\'hydratation:', errors);
    }

    console.log(`✅ ${users.length} utilisateurs hydratés avec succès`);
    return users;
  }

  /**
   * Valide les données brutes avant hydratation
   * @param rawData Données à valider
   * @returns true si valide, false sinon
   */
  validateUserData(rawData: any): boolean {
    if (!rawData) {
      console.error('❌ Données utilisateur manquantes');
      return false;
    }

    if (!rawData.id || typeof rawData.id !== 'number') {
      console.error('❌ ID utilisateur invalide:', rawData.id);
      return false;
    }

    if (!rawData.name || typeof rawData.name !== 'string') {
      console.error('❌ Nom utilisateur invalide:', rawData.name);
      return false;
    }

    if (!rawData.email || typeof rawData.email !== 'string') {
      console.error('❌ Email utilisateur invalide:', rawData.email);
      return false;
    }

    return true;
  }

  /**
   * Nettoie et prépare les données avant hydratation
   * @param rawData Données brutes
   * @returns Données nettoyées
   */
  preprocessUserData(rawData: any): IUserOdoo {
    console.log('🧹 Prétraitement des données utilisateur');
    
    // S'assurer que tous les champs requis sont présents
    const cleanedData: IUserOdoo = {
      id: rawData.id || 0,
      avatar_1024: rawData.avatar_1024 || false,
      active: rawData.active !== undefined ? rawData.active : true,
      city: rawData.city || false,
      company_id: rawData.company_id || false,
      company_name: rawData.company_name,
      partner_id: rawData.partner_id || false,
      country_id: rawData.country_id || false,
      create_date: rawData.create_date || '',
      write_date: rawData.write_date || '',
      create_uid: rawData.create_uid || false,
      write_uid: rawData.write_uid || false,
      currency_id: rawData.currency_id || false,
      display_name: rawData.display_name || rawData.name || '',
      email: rawData.email || '',
      employee: rawData.employee !== undefined ? rawData.employee : false,
      employee_id: rawData.employee_id || false,
      equipment_count: rawData.equipment_count || 0,
      equipment_ids: rawData.equipment_ids || [],
      expense_manager_id: rawData.expense_manager_id || false,
      gender: rawData.gender || false,
      lang: rawData.lang || 'fr_FR',
      login: rawData.login || rawData.email || '',
      name: rawData.name || '',
      mobile: rawData.mobile || false,
      partner_latitude: rawData.partner_latitude || false,
      partner_longitude: rawData.partner_longitude || false,
      project_ids: rawData.project_ids || [],
      sale_order_ids: rawData.sale_order_ids || [],
      street: rawData.street || false,
      task_ids: rawData.task_ids || []
    };

    console.log('✅ Données utilisateur prétraitées');
    return cleanedData;
  }

  /**
   * Crée un utilisateur par défaut en cas d'erreur
   * @returns Utilisateur par défaut
   */
  createDefaultUser(): User {
    console.log('🔄 Création d\'un utilisateur par défaut');
    
    const defaultData: IUserOdoo = {
      id: 0,
      avatar_1024: false,
      active: true,
      city: false,
      company_id: false,
      partner_id: false,
      country_id: false,
      create_date: new Date().toISOString(),
      write_date: new Date().toISOString(),
      create_uid: false,
      write_uid: false,
      currency_id: false,
      display_name: 'Utilisateur par défaut',
      email: 'default@example.com',
      employee: false,
      employee_id: false,
      equipment_count: 0,
      equipment_ids: [],
      expense_manager_id: false,
      gender: false,
      lang: 'fr_FR',
      login: 'default',
      name: 'Utilisateur par défaut',
      mobile: false,
      partner_latitude: false,
      partner_longitude: false,
      project_ids: [],
      sale_order_ids: [],
      street: false,
      task_ids: []
    };

    return new User(defaultData);
  }

  /**
   * Vérifie si les données sont dans le bon format Odoo
   * @param data Données à vérifier
   * @returns true si format Odoo, false sinon
   */
  isOdooFormat(data: any): boolean {
    return data && 
           typeof data === 'object' && 
           'id' in data && 
           'name' in data && 
           'display_name' in data;
  }

  /**
   * Convertit les données en format compatible avec l'hydratation
   * @param data Données à convertir
   * @returns Données converties
   */
  convertToOdooFormat(data: any): IUserOdoo | null {
    if (this.isOdooFormat(data)) {
      return data as IUserOdoo;
    }

    // Tentative de conversion depuis d'autres formats
    if (data && typeof data === 'object') {
      console.log('🔄 Tentative de conversion vers le format Odoo');
      
      // Logique de conversion personnalisée selon le format source
      // À adapter selon les formats de données rencontrés
      
      return null;
    }

    return null;
  }

  // ===== HYDATATION DES PROJETS =====

  /**
   * Hydrate un projet à partir des données Odoo
   * @param rawData Données brutes provenant de l'API Odoo
   * @returns Instance Project hydratée
   */
  hydrateProject(rawData: IProjectOdoo): Project {
    console.log('🔄 Hydratation d\'un projet');
    
    try {
      const project = new Project(rawData);
      
      if (!project.isValid()) {
        console.warn('⚠️ Projet invalide après hydratation:', project.errors);
      }
      
      return project;
    } catch (error) {
      console.error('❌ Erreur lors de l\'hydratation du projet:', error);
      throw new Error('Échec de l\'hydratation du projet');
    }
  }

  /**
   * Hydrate une liste de projets
   * @param rawDataList Liste de données brutes
   * @returns Liste de projets hydratés
   */
  hydrateProjects(rawDataList: IProjectOdoo[]): Project[] {
    console.log(`🔄 Hydratation de ${rawDataList.length} projets`);
    
    const projects: Project[] = [];
    const errors: string[] = [];

    rawDataList.forEach((rawData, index) => {
      try {
        const project = this.hydrateProject(rawData);
        projects.push(project);
      } catch (error) {
        console.error(`❌ Erreur lors de l'hydratation du projet ${index}:`, error);
        errors.push(`Projet ${index + 1}: ${error}`);
      }
    });

    if (errors.length > 0) {
      console.warn('⚠️ Erreurs lors de l\'hydratation:', errors);
    }

    console.log(`✅ ${projects.length} projets hydratés avec succès`);
    return projects;
  }

  /**
   * Valide les données brutes de projet avant hydratation
   * @param rawData Données à valider
   * @returns true si valide, false sinon
   */
  validateProjectData(rawData: any): boolean {
    if (!rawData) {
      console.error('❌ Données projet manquantes');
      return false;
    }

    if (!rawData.id || typeof rawData.id !== 'number') {
      console.error('❌ ID projet invalide:', rawData.id);
      return false;
    }

    if (!rawData.name || typeof rawData.name !== 'string') {
      console.error('❌ Nom projet invalide:', rawData.name);
      return false;
    }

    return true;
  }

  /**
   * Nettoie et prépare les données de projet avant hydratation
   * @param rawData Données brutes
   * @returns Données nettoyées
   */
  preprocessProjectData(rawData: any): IProjectOdoo {
    console.log('🧹 Prétraitement des données projet');
    
    // S'assurer que tous les champs requis sont présents
    const cleanedData: IProjectOdoo = {
      id: rawData.id || 0,
      name: rawData.name || '',
      description: rawData.description || false,
      display_name: rawData.display_name || rawData.name || '',
      state: rawData.state || 'draft',
      active: rawData.active !== undefined ? rawData.active : true,
      date_start: rawData.date_start || '',
      date: rawData.date || '',
      user_id: rawData.user_id || false,
      partner_id: rawData.partner_id || false,
      task_count: rawData.task_count || 0,
      type_of_construction: rawData.type_of_construction || false
    };

    console.log('✅ Données projet prétraitées');
    return cleanedData;
  }

  /**
   * Crée un projet par défaut en cas d'erreur
   * @returns Projet par défaut
   */
  createDefaultProject(): Project {
    console.log('🔄 Création d\'un projet par défaut');
    
    const defaultData: IProjectOdoo = {
      id: 0,
      name: 'Projet par défaut',
      description: false,
      display_name: 'Projet par défaut',
      state: 'draft',
      active: true,
      date_start: new Date().toISOString(),
      date: new Date().toISOString(),
      user_id: false,
      partner_id: false,
      task_count: 0,
      type_of_construction: false
    };

    return new Project(defaultData);
  }

  /**
   * Méthode utilitaire pour déboguer les données
   * @param data Données à analyser
   * @param label Étiquette pour l'identification
   */
  debugData(data: any, label: string = 'Données'): void {
    console.log(`🔍 Debug ${label}:`, {
      type: typeof data,
      isArray: Array.isArray(data),
      keys: data ? Object.keys(data) : 'null/undefined',
      sample: data ? JSON.stringify(data).substring(0, 200) + '...' : 'null/undefined'
    });
  }
}

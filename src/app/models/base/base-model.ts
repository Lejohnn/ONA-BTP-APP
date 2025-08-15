import { IBaseModel, IErrorHandling, ILoadingState } from '../interfaces/base.interface';

/**
 * Classe de base pour tous les modèles de l'application
 * Implémente les interfaces communes et fournit la logique d'hydratation de base
 */
export abstract class BaseModel implements IBaseModel, IErrorHandling, ILoadingState {
  // Propriétés de base
  id: number = 0;
  displayName: string = '';
  createDate?: Date;
  writeDate?: Date;
  isActive: boolean = true;

  // Gestion des erreurs
  errors: string[] = [];

  // État de chargement
  isLoading: boolean = false;
  isLoaded: boolean = false;

  constructor(rawData?: any) {
    if (rawData) {
      this.hydrate(rawData);
    }
  }

  /**
   * Méthode d'hydratation abstraite que chaque classe enfant doit implémenter
   * @param rawData Données brutes provenant de l'API
   * @returns Instance hydratée
   */
  abstract hydrate(rawData: any): this;

  /**
   * Méthode de validation abstraite
   * @returns true si valide, false sinon
   */
  abstract isValid(): boolean;

  /**
   * Méthode de conversion pour l'affichage abstraite
   * @returns Objet optimisé pour le rendu
   */
  abstract toDisplay(): any;

  /**
   * Méthode de conversion JSON abstraite
   * @returns Objet JSON
   */
  abstract toJSON(): any;

  // === IMPLÉMENTATION DES MÉTHODES COMMUNES ===

  /**
   * Vérifie s'il y a des erreurs
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Ajoute une erreur
   */
  addError(error: string): void {
    if (error && !this.errors.includes(error)) {
      this.errors.push(error);
    }
  }

  /**
   * Efface toutes les erreurs
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Marque l'objet comme en cours de chargement
   */
  setLoading(loading: boolean): void {
    this.isLoading = loading;
    if (!loading) {
      this.isLoaded = true;
    }
  }

  // === MÉTHODES UTILITAIRES COMMUNES ===

  /**
   * Parse une date depuis une chaîne Odoo
   * @param dateString Date au format Odoo
   * @returns Date parsée ou undefined
   */
  protected parseOdooDate(dateString: string | false): Date | undefined {
    if (!dateString || typeof dateString !== 'string') {
      return undefined;
    }
    
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? undefined : date;
    } catch (error) {
      console.warn('Erreur lors du parsing de la date:', dateString, error);
      return undefined;
    }
  }

  /**
   * Extrait le nom depuis un tuple Odoo [id, name]
   * @param tuple Tuple Odoo [id, name]
   * @returns Nom extrait ou chaîne par défaut
   */
  protected extractNameFromTuple(tuple: [number, string] | false): string {
    if (!tuple || !Array.isArray(tuple) || tuple.length < 2) {
      return 'Non renseigné';
    }
    return tuple[1] || 'Non renseigné';
  }

  /**
   * Extrait l'ID depuis un tuple Odoo [id, name]
   * @param tuple Tuple Odoo [id, name]
   * @returns ID extrait ou undefined
   */
  protected extractIdFromTuple(tuple: [number, string] | false): number | undefined {
    if (!tuple || !Array.isArray(tuple) || tuple.length < 1) {
      return undefined;
    }
    return tuple[0];
  }

  /**
   * Nettoie une chaîne de caractères
   * @param value Valeur à nettoyer
   * @param defaultValue Valeur par défaut si la valeur est vide
   * @returns Chaîne nettoyée
   */
  protected cleanString(value: string | false, defaultValue: string = 'Non renseigné'): string {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return defaultValue;
    }
    return value.trim();
  }

  /**
   * Nettoie un nombre
   * @param value Valeur à nettoyer
   * @param defaultValue Valeur par défaut si la valeur est invalide
   * @returns Nombre nettoyé
   */
  protected cleanNumber(value: number | false, defaultValue: number = 0): number {
    if (value === null || value === undefined || value === false || isNaN(value)) {
      return defaultValue;
    }
    return Number(value);
  }

  /**
   * Nettoie un booléen
   * @param value Valeur à nettoyer
   * @param defaultValue Valeur par défaut
   * @returns Booléen nettoyé
   */
  protected cleanBoolean(value: boolean | false, defaultValue: boolean = false): boolean {
    if (value === null || value === undefined || value === false) {
      return defaultValue;
    }
    return Boolean(value);
  }

  /**
   * Valide que l'objet a un ID valide
   */
  protected validateId(): boolean {
    if (!this.id || this.id <= 0) {
      this.addError('ID invalide');
      return false;
    }
    return true;
  }

  /**
   * Valide que l'objet a un nom d'affichage
   */
  protected validateDisplayName(): boolean {
    if (!this.displayName || this.displayName.trim() === '') {
      this.addError('Nom d\'affichage requis');
      return false;
    }
    return true;
  }

  /**
   * Méthode de validation de base
   * À surcharger dans les classes enfants si nécessaire
   */
  protected validateBase(): boolean {
    this.clearErrors();
    
    const validations = [
      this.validateId(),
      this.validateDisplayName()
    ];
    
    return validations.every(validation => validation);
  }
}

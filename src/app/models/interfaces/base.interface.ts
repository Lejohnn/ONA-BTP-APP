/**
 * Interface de base pour tous les modèles de l'application
 * Définit les méthodes communes d'hydratation et de validation
 */
export interface IBaseModel {
  /**
   * Identifiant unique du modèle
   */
  id: number;

  /**
   * Nom d'affichage du modèle
   */
  displayName: string;

  /**
   * Date de création
   */
  createDate?: Date;

  /**
   * Date de dernière modification
   */
  writeDate?: Date;

  /**
   * Indique si le modèle est actif
   */
  isActive: boolean;

  /**
   * Hydrate l'objet à partir de données brutes
   * @param rawData Données brutes provenant de l'API
   * @returns Instance hydratée
   */
  hydrate(rawData: any): this;

  /**
   * Valide les données de l'objet
   * @returns true si valide, false sinon
   */
  isValid(): boolean;

  /**
   * Retourne une version nettoyée de l'objet pour l'affichage
   * @returns Objet optimisé pour le rendu
   */
  toDisplay(): any;

  /**
   * Retourne une version JSON de l'objet
   * @returns Objet JSON
   */
  toJSON(): any;
}

/**
 * Interface pour les modèles avec gestion d'erreurs
 */
export interface IErrorHandling {
  /**
   * Messages d'erreur de validation
   */
  errors: string[];

  /**
   * Indique s'il y a des erreurs
   */
  hasErrors(): boolean;

  /**
   * Ajoute une erreur
   */
  addError(error: string): void;

  /**
   * Efface toutes les erreurs
   */
  clearErrors(): void;
}

/**
 * Interface pour les modèles avec gestion d'état de chargement
 */
export interface ILoadingState {
  /**
   * Indique si l'objet est en cours de chargement
   */
  isLoading: boolean;

  /**
   * Indique si l'objet a été chargé au moins une fois
   */
  isLoaded: boolean;

  /**
   * Marque l'objet comme en cours de chargement
   */
  setLoading(loading: boolean): void;
}

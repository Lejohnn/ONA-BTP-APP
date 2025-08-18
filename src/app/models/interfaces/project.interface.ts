import { IBaseModel } from './base.interface';

/**
 * Interface pour les données projet brutes provenant d'Odoo
 * Correspond exactement aux champs du modèle project.project
 */
export interface IProjectOdoo {
  id: number;
  name: string;
  description: string | false;
  display_name: string;
  state: string;
  active: boolean;
  date_start: string;
  date: string;
  user_id: [number, string] | false;
  partner_id: [number, string] | false;
  progressbar: number;
  task_ids: number[];
  type_of_construction: string | false;
}

/**
 * Interface pour le modèle projet hydraté
 * Version nettoyée et optimisée pour l'application mobile
 */
export interface IProject extends IBaseModel {
  // Informations de base
  name: string;
  description: string;
  displayName: string;
  
  // Informations de contact
  email: string;
  phone: string;
  mobile: string;
  
  // Informations géographiques
  latitude?: number;
  longitude?: number;
  locationId?: number;
  locationName?: string;
  
  // Informations de site
  siteName: string;
  siteArea?: number;
  siteLength?: number;
  siteWidth?: number;
  
  // Dates importantes
  startDate?: Date;
  endDate?: Date;
  deadline?: Date;
  
  // Progression et statistiques
  progress: number;
  taskCompletionPercentage: number;
  effectiveHours: number;
  
  // Compteurs
  taskCount: number;
  openTaskCount: number;
  closedTaskCount: number;
  collaboratorCount: number;
  expenseCount: number;
  purchaseOrderCount: number;
  vendorBillCount: number;
  maintenanceRequestCount: number;
  materialRequestCount: number;
  
  // Relations
  projectManagerId?: number;
  projectManagerName?: string;
  partnerId?: number;
  partnerName?: string;
  companyId?: number;
  companyName?: string;
  stageId?: number;
  stageName?: string;
  
  // Types et catégories
  constructionType: string;
  billingType: string;
  pricingType: string;
  privacyVisibility: string;
  
  // État et statut
  state: string;
  isActive: boolean;
  canMarkMilestoneAsDone: boolean;
  
  // Métadonnées
  color: number;
  createUid?: number;
  writeUid?: number;
  
  // Méthodes spécifiques au projet
  getProgressDisplay(): string;
  getStateDisplay(): string;
  getConstructionTypeDisplay(): string;
  getBillingTypeDisplay(): string;
  hasLocation(): boolean;
  isOverdue(): boolean;
  getDaysRemaining(): number;
  getFormattedStartDate(): string;
  getFormattedEndDate(): string;
  getFormattedDeadline(): string;
  getSiteDimensions(): string;
  getTaskStatistics(): any;
}

import { BaseModel } from './base/base-model';
import { IProject, IProjectOdoo } from './interfaces/project.interface';

/**
 * Classe Project - Modèle hydraté pour les projets
 * Implémente le pattern d'hydratation pour transformer les données Odoo
 * en objets métier optimisés pour l'application mobile
 */
export class Project extends BaseModel implements IProject {
  // Informations de base
  name: string = '';
  description: string = '';
  override displayName: string = '';
  
  // Informations de contact
  email: string = '';
  phone: string = '';
  mobile: string = '';
  
  // Informations géographiques
  latitude?: number;
  longitude?: number;
  locationId?: number;
  locationName?: string;
  
  // Informations de site
  siteName: string = '';
  siteArea?: number;
  siteLength?: number;
  siteWidth?: number;
  
  // Dates importantes
  startDate?: Date;
  endDate?: Date;
  deadline?: Date;
  
  // Progression et statistiques
  progress: number = 0;
  taskCompletionPercentage: number = 0;
  effectiveHours: number = 0;
  
  // Compteurs
  taskCount: number = 0;
  openTaskCount: number = 0;
  closedTaskCount: number = 0;
  collaboratorCount: number = 0;
  expenseCount: number = 0;
  purchaseOrderCount: number = 0;
  vendorBillCount: number = 0;
  maintenanceRequestCount: number = 0;
  materialRequestCount: number = 0;
  
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
  constructionType: string = '';
  billingType: string = '';
  pricingType: string = '';
  privacyVisibility: string = '';
  
  // État et statut
  state: string = '';
  override isActive: boolean = true;
  canMarkMilestoneAsDone: boolean = false;
  
  // Métadonnées
  color: number = 0;
  createUid?: number;
  writeUid?: number;

  constructor(rawData?: IProjectOdoo) {
    super();
    if (rawData) {
      this.hydrate(rawData);
    }
  }

  /**
   * Hydrate l'objet projet à partir des données Odoo brutes
   * @param rawData Données brutes provenant de l'API Odoo
   * @returns Instance hydratée
   */
  hydrate(rawData: IProjectOdoo): this {
    console.log('🔄 Hydratation du projet:', rawData);

    try {
      // Propriétés de base
      this.id = this.cleanNumber(rawData.id);
      this.name = this.cleanString(rawData.name);
      this.description = this.cleanString(rawData.description || false);
      this.displayName = this.cleanString(rawData.display_name);
      this.isActive = this.cleanBoolean(rawData.active, true);

      // Dates
      this.startDate = this.parseOdooDate(rawData.date_start);
      this.endDate = this.parseOdooDate(rawData.date);
      this.deadline = this.parseOdooDate(rawData.date);

      // Compteurs
      this.taskCount = this.cleanNumber(rawData.task_count);

      // Relations
      this.projectManagerId = this.extractIdFromTuple(rawData.user_id);
      this.projectManagerName = this.extractNameFromTuple(rawData.user_id);
      this.partnerId = this.extractIdFromTuple(rawData.partner_id);
      this.partnerName = this.extractNameFromTuple(rawData.partner_id);

      // Types et catégories
      this.constructionType = this.formatConstructionType(rawData.type_of_construction || false);

      // État et statut
      this.state = this.formatState(rawData.state);

      // Valeurs par défaut pour les champs non disponibles
      this.progress = 0;
      this.taskCompletionPercentage = 0;
      this.effectiveHours = 0;
      this.openTaskCount = 0;
      this.closedTaskCount = 0;
      this.collaboratorCount = 0;
      this.expenseCount = 0;
      this.purchaseOrderCount = 0;
      this.vendorBillCount = 0;
      this.maintenanceRequestCount = 0;
      this.materialRequestCount = 0;
      this.billingType = '';
      this.pricingType = '';
      this.privacyVisibility = '';
      this.canMarkMilestoneAsDone = false;
      this.color = 0;

      console.log('✅ Projet hydraté avec succès:', this.toDisplay());

    } catch (error) {
      console.error('❌ Erreur lors de l\'hydratation du projet:', error);
      this.addError('Erreur lors de l\'hydratation des données');
    }

    return this;
  }

  /**
   * Valide les données du projet
   * @returns true si valide, false sinon
   */
  isValid(): boolean {
    this.clearErrors();

    const validations = [
      this.validateBase(),
      this.validateName(),
      this.validateState()
    ];

    return validations.every(validation => validation);
  }

  /**
   * Retourne une version optimisée pour l'affichage
   * @returns Objet optimisé pour le rendu
   */
  toDisplay(): any {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      displayName: this.displayName,
      state: this.state,
      stateDisplay: this.getStateDisplay(),
      progress: this.progress,
      progressDisplay: this.getProgressDisplay(),
      startDate: this.startDate,
      endDate: this.endDate,
      deadline: this.deadline,
      formattedStartDate: this.getFormattedStartDate(),
      formattedEndDate: this.getFormattedEndDate(),
      formattedDeadline: this.getFormattedDeadline(),
      projectManager: this.projectManagerName,
      partner: this.partnerName,
      constructionType: this.constructionType,
      constructionTypeDisplay: this.getConstructionTypeDisplay(),
      billingType: this.billingType,
      billingTypeDisplay: this.getBillingTypeDisplay(),
      hasLocation: this.hasLocation(),
      isOverdue: this.isOverdue(),
      daysRemaining: this.getDaysRemaining(),
      siteDimensions: this.getSiteDimensions(),
      taskStatistics: this.getTaskStatistics(),
      statistics: {
        taskCount: this.taskCount,
        openTaskCount: this.openTaskCount,
        closedTaskCount: this.closedTaskCount,
        collaboratorCount: this.collaboratorCount,
        expenseCount: this.expenseCount,
        purchaseOrderCount: this.purchaseOrderCount,
        vendorBillCount: this.vendorBillCount,
        maintenanceRequestCount: this.maintenanceRequestCount,
        materialRequestCount: this.materialRequestCount
      }
    };
  }

  /**
   * Retourne une version JSON de l'objet
   * @returns Objet JSON
   */
  toJSON(): any {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      displayName: this.displayName,
      state: this.state,
      progress: this.progress,
      taskCompletionPercentage: this.taskCompletionPercentage,
      effectiveHours: this.effectiveHours,
      startDate: this.startDate,
      endDate: this.endDate,
      deadline: this.deadline,
      projectManagerId: this.projectManagerId,
      projectManagerName: this.projectManagerName,
      partnerId: this.partnerId,
      partnerName: this.partnerName,
      companyId: this.companyId,
      companyName: this.companyName,
      stageId: this.stageId,
      stageName: this.stageName,
      constructionType: this.constructionType,
      billingType: this.billingType,
      pricingType: this.pricingType,
      privacyVisibility: this.privacyVisibility,
      isActive: this.isActive,
      canMarkMilestoneAsDone: this.canMarkMilestoneAsDone,
      color: this.color,
      createUid: this.createUid,
      writeUid: this.writeUid,
      createDate: this.createDate,
      writeDate: this.writeDate,
      taskCount: this.taskCount,
      openTaskCount: this.openTaskCount,
      closedTaskCount: this.closedTaskCount,
      collaboratorCount: this.collaboratorCount,
      expenseCount: this.expenseCount,
      purchaseOrderCount: this.purchaseOrderCount,
      vendorBillCount: this.vendorBillCount,
      maintenanceRequestCount: this.maintenanceRequestCount,
      materialRequestCount: this.materialRequestCount,
      latitude: this.latitude,
      longitude: this.longitude,
      locationId: this.locationId,
      locationName: this.locationName,
      siteName: this.siteName,
      siteArea: this.siteArea,
      siteLength: this.siteLength,
      siteWidth: this.siteWidth,
      email: this.email,
      phone: this.phone,
      mobile: this.mobile
    };
  }

  // === MÉTHODES SPÉCIFIQUES AU PROJET ===

  /**
   * Retourne l'affichage de la progression
   */
  getProgressDisplay(): string {
    return `${Math.round(this.progress)}%`;
  }

  /**
   * Retourne l'affichage de l'état
   */
  getStateDisplay(): string {
    return this.state;
  }

  /**
   * Retourne l'affichage du type de construction
   */
  getConstructionTypeDisplay(): string {
    return this.constructionType;
  }

  /**
   * Retourne l'affichage du type de facturation
   */
  getBillingTypeDisplay(): string {
    return this.billingType;
  }

  /**
   * Vérifie si le projet a des coordonnées géographiques
   */
  hasLocation(): boolean {
    return this.latitude !== undefined && this.longitude !== undefined && 
           this.latitude !== 0 && this.longitude !== 0;
  }

  /**
   * Vérifie si le projet est en retard
   */
  isOverdue(): boolean {
    if (!this.deadline) return false;
    return new Date() > this.deadline;
  }

  /**
   * Retourne le nombre de jours restants
   */
  getDaysRemaining(): number {
    if (!this.deadline) return 0;
    const today = new Date();
    const diffTime = this.deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Retourne la date de début formatée
   */
  getFormattedStartDate(): string {
    if (!this.startDate) return 'Non définie';
    return this.startDate.toLocaleDateString('fr-FR');
  }

  /**
   * Retourne la date de fin formatée
   */
  getFormattedEndDate(): string {
    if (!this.endDate) return 'Non définie';
    return this.endDate.toLocaleDateString('fr-FR');
  }

  /**
   * Retourne la date limite formatée
   */
  getFormattedDeadline(): string {
    if (!this.deadline) return 'Non définie';
    return this.deadline.toLocaleDateString('fr-FR');
  }

  /**
   * Retourne les dimensions du site
   */
  getSiteDimensions(): string {
    if (this.siteLength && this.siteWidth) {
      return `${this.siteLength}m × ${this.siteWidth}m`;
    }
    if (this.siteArea) {
      return `${this.siteArea}m²`;
    }
    return 'Non renseignées';
  }

  /**
   * Retourne les statistiques des tâches
   */
  getTaskStatistics(): any {
    return {
      total: this.taskCount,
      open: this.openTaskCount,
      closed: this.closedTaskCount,
      completionRate: this.taskCompletionPercentage
    };
  }

  // === MÉTHODES DE VALIDATION SPÉCIFIQUES ===

  /**
   * Valide le nom
   */
  private validateName(): boolean {
    if (!this.name || this.name.trim() === '') {
      this.addError('Nom du projet requis');
      return false;
    }
    return true;
  }

  /**
   * Valide l'état
   */
  private validateState(): boolean {
    if (!this.state || this.state.trim() === '') {
      this.addError('État du projet requis');
      return false;
    }
    return true;
  }

  // === MÉTHODES UTILITAIRES PRIVÉES ===

  /**
   * Formate le type de construction
   */
  private formatConstructionType(type: string | false): string {
    if (!type) return 'Non renseigné';
    
    const typeMap: { [key: string]: string } = {
      'agricultural': 'Agricole',
      'residential': 'Résidentiel',
      'commercial': 'Commercial',
      'institutional': 'Institutionnel',
      'industrial': 'Industriel',
      'heavy_civil': 'Civil lourd',
      'environmental': 'Environnemental',
      'other': 'Autre'
    };
    return typeMap[type] || type;
  }

  /**
   * Formate le type de facturation
   */
  private formatBillingType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'fixed': 'Forfaitaire',
      'time_material': 'Temps et matériaux',
      'milestone': 'Par étapes',
      'retainer': 'Acompte'
    };
    return typeMap[type] || type;
  }

  /**
   * Formate le type de tarification
   */
  private formatPricingType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'fixed': 'Fixe',
      'variable': 'Variable',
      'hourly': 'Horaire'
    };
    return typeMap[type] || type;
  }

  /**
   * Formate la visibilité
   */
  private formatPrivacyVisibility(visibility: string): string {
    const visibilityMap: { [key: string]: string } = {
      'employees': 'Employés',
      'followers': 'Abonnés',
      'portal': 'Portail'
    };
    return visibilityMap[visibility] || visibility;
  }

  /**
   * Formate l'état
   */
  private formatState(state: string): string {
    const stateMap: { [key: string]: string } = {
      'draft': 'Brouillon',
      'open': 'En cours',
      'pending': 'En attente',
      'close': 'Terminé',
      'cancelled': 'Annulé'
    };
    return stateMap[state] || state;
  }
}

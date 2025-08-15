import { BaseModel } from './base/base-model';
import { IUser, IUserOdoo } from './interfaces/user.interface';

/**
 * Classe User - Modèle hydraté pour les utilisateurs
 * Implémente le pattern d'hydratation pour transformer les données Odoo
 * en objets métier optimisés pour l'application mobile
 */
export class User extends BaseModel implements IUser {
  // Informations de base
  name: string = '';
  email: string = '';
  login: string = '';
  override displayName: string = '';
  
  // Informations de contact
  mobile: string = '';
  phone?: string;
  
  // Informations géographiques
  city: string = '';
  street: string = '';
  country: string = '';
  latitude?: number;
  longitude?: number;
  
  // Informations professionnelles
  company: string = '';
  companyId: number = 0;
  employee: boolean = false;
  employeeId?: number;
  expenseManagerId?: number;
  
  // Préférences
  language: string = '';
  timezone: string = '';
  currency: string = '';
  gender?: string;
  
  // Avatar et image
  avatar: string = '';
  avatarUrl?: string;
  
  // Relations
  partnerId?: number;
  equipmentCount: number = 0;
  projectCount: number = 0;
  taskCount: number = 0;
  saleOrderCount: number = 0;
  
  // Métadonnées
  createUid?: number;
  writeUid?: number;

  constructor(rawData?: IUserOdoo) {
    super();
    if (rawData) {
      this.hydrate(rawData);
    }
  }

  /**
   * Hydrate l'objet utilisateur à partir des données Odoo brutes
   * @param rawData Données brutes provenant de l'API Odoo
   * @returns Instance hydratée
   */
  hydrate(rawData: IUserOdoo): this {
    console.log('🔄 Hydratation de l\'utilisateur:', rawData);

    try {
      // Propriétés de base
      this.id = this.cleanNumber(rawData.id);
      this.name = this.cleanString(rawData.name);
      this.email = this.cleanString(rawData.email);
      this.login = this.cleanString(rawData.login);
      this.displayName = this.cleanString(rawData.display_name);
      this.isActive = this.cleanBoolean(rawData.active, true);

      // Dates
      this.createDate = this.parseOdooDate(rawData.create_date);
      this.writeDate = this.parseOdooDate(rawData.write_date);

      // Informations de contact
      this.mobile = this.cleanString(rawData.mobile);
      this.phone = this.cleanString(rawData.phone || false);

      // Informations géographiques
      this.city = this.cleanString(rawData.city);
      this.street = this.cleanString(rawData.street);
      this.country = this.extractNameFromTuple(rawData.country_id);
      this.latitude = this.cleanNumber(rawData.partner_latitude);
      this.longitude = this.cleanNumber(rawData.partner_longitude);

      // Informations professionnelles
      this.company = this.extractNameFromTuple(rawData.company_id);
      this.companyId = this.cleanNumber(this.extractIdFromTuple(rawData.company_id) || 0);
      this.employee = this.cleanBoolean(rawData.employee);
      this.employeeId = this.extractIdFromTuple(rawData.employee_id);
      this.expenseManagerId = this.extractIdFromTuple(rawData.expense_manager_id);

      // Préférences
      this.language = this.formatLanguage(rawData.lang);
      this.timezone = this.formatTimezone(rawData.tz || 'Europe/Paris');
      this.currency = this.extractNameFromTuple(rawData.currency_id);
      this.gender = this.cleanString(rawData.gender);

      // Avatar
      this.avatar = this.formatAvatar(rawData.avatar_1024);
      this.avatarUrl = this.getAvatarUrl();

      // Relations
      this.partnerId = this.extractIdFromTuple(rawData.partner_id);
      this.equipmentCount = this.cleanNumber(rawData.equipment_count);
      this.projectCount = rawData.project_ids ? rawData.project_ids.length : 0;
      this.taskCount = rawData.task_ids ? rawData.task_ids.length : 0;
      this.saleOrderCount = rawData.sale_order_ids ? rawData.sale_order_ids.length : 0;

      // Métadonnées
      this.createUid = this.extractIdFromTuple(rawData.create_uid);
      this.writeUid = this.extractIdFromTuple(rawData.write_uid);

      console.log('✅ Utilisateur hydraté avec succès:', this.toDisplay());

    } catch (error) {
      console.error('❌ Erreur lors de l\'hydratation de l\'utilisateur:', error);
      this.addError('Erreur lors de l\'hydratation des données');
    }

    return this;
  }

  /**
   * Valide les données de l'utilisateur
   * @returns true si valide, false sinon
   */
  isValid(): boolean {
    this.clearErrors();

    const validations = [
      this.validateBase(),
      this.validateEmail(),
      this.validateName()
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
      email: this.email,
      displayName: this.displayName,
      mobile: this.mobile,
      company: this.company,
      city: this.city,
      street: this.street,
      country: this.country,
      language: this.language,
      timezone: this.timezone,
      avatar: this.avatar,
      avatarUrl: this.avatarUrl,
      isEmployee: this.employee,
      hasLocation: this.hasLocation(),
      fullAddress: this.getFullAddress(),
      formattedPhone: this.getFormattedPhone(),
      languageDisplay: this.getLanguageDisplay(),
      timezoneDisplay: this.getTimezoneDisplay(),
      statistics: {
        equipmentCount: this.equipmentCount,
        projectCount: this.projectCount,
        taskCount: this.taskCount,
        saleOrderCount: this.saleOrderCount
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
      email: this.email,
      login: this.login,
      displayName: this.displayName,
      mobile: this.mobile,
      phone: this.phone,
      city: this.city,
      street: this.street,
      country: this.country,
      latitude: this.latitude,
      longitude: this.longitude,
      company: this.company,
      companyId: this.companyId,
      employee: this.employee,
      employeeId: this.employeeId,
      expenseManagerId: this.expenseManagerId,
      language: this.language,
      timezone: this.timezone,
      currency: this.currency,
      gender: this.gender,
      avatar: this.avatar,
      avatarUrl: this.avatarUrl,
      partnerId: this.partnerId,
      equipmentCount: this.equipmentCount,
      projectCount: this.projectCount,
      taskCount: this.taskCount,
      saleOrderCount: this.saleOrderCount,
      createUid: this.createUid,
      writeUid: this.writeUid,
      createDate: this.createDate,
      writeDate: this.writeDate,
      isActive: this.isActive
    };
  }

  // === MÉTHODES SPÉCIFIQUES À L'UTILISATEUR ===

  /**
   * Retourne l'adresse complète formatée
   */
  getFullAddress(): string {
    const parts = [this.street, this.city, this.country].filter(part => 
      part && part !== 'Non renseigné'
    );
    return parts.length > 0 ? parts.join(', ') : 'Adresse non renseignée';
  }

  /**
   * Retourne le téléphone formaté
   */
  getFormattedPhone(): string {
    return this.mobile !== 'Non renseigné' ? this.mobile : 'Téléphone non renseigné';
  }

  /**
   * Retourne l'affichage de la langue
   */
  getLanguageDisplay(): string {
    return this.language;
  }

  /**
   * Retourne l'affichage du fuseau horaire
   */
  getTimezoneDisplay(): string {
    return this.timezone;
  }

  /**
   * Vérifie si l'utilisateur a des coordonnées géographiques
   */
  hasLocation(): boolean {
    return this.latitude !== undefined && this.longitude !== undefined;
  }

  /**
   * Vérifie si l'utilisateur est un employé
   */
  isEmployee(): boolean {
    return this.employee;
  }

  /**
   * Retourne l'URL de l'avatar
   */
  getAvatarUrl(): string {
    if (this.avatar && this.avatar !== 'person-circle') {
      return this.avatar;
    }
    return 'assets/images/profile-avatar.webp'; // Image par défaut
  }

  // === MÉTHODES DE VALIDATION SPÉCIFIQUES ===

  /**
   * Valide l'email
   */
  private validateEmail(): boolean {
    if (!this.email || this.email === 'Non renseigné') {
      this.addError('Email requis');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.addError('Format d\'email invalide');
      return false;
    }
    
    return true;
  }

  /**
   * Valide le nom
   */
  private validateName(): boolean {
    if (!this.name || this.name.trim() === '') {
      this.addError('Nom requis');
      return false;
    }
    return true;
  }

  // === MÉTHODES UTILITAIRES PRIVÉES ===

  /**
   * Formate la langue pour l'affichage
   */
  private formatLanguage(lang: string): string {
    const languageMap: { [key: string]: string } = {
      'fr_FR': 'Français',
      'en_US': 'English',
      'es_ES': 'Español',
      'de_DE': 'Deutsch'
    };
    return languageMap[lang] || lang;
  }

  /**
   * Formate le fuseau horaire pour l'affichage
   */
  private formatTimezone(tz: string): string {
    const timezoneMap: { [key: string]: string } = {
      'Europe/Paris': 'Paris (UTC+1)',
      'Europe/London': 'Londres (UTC+0)',
      'America/New_York': 'New York (UTC-5)',
      'Africa/Dakar': 'Dakar (UTC+0)'
    };
    return timezoneMap[tz] || tz;
  }

  /**
   * Formate l'avatar
   */
  private formatAvatar(imageData: string | false): string {
    if (imageData && typeof imageData === 'string' && imageData.trim() !== '') {
      return `data:image/png;base64,${imageData}`;
    }
    return 'person-circle';
  }
}

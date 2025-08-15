import { IBaseModel } from './base.interface';

/**
 * Interface pour les données utilisateur brutes provenant d'Odoo
 * Correspond exactement aux champs du modèle res.users
 */
export interface IUserOdoo {
  id: number;
  avatar_1024: string | false;
  active: boolean;
  city: string | false;
  company_id: [number, string] | false;
  company_name?: string;
  partner_id: [number, string] | false;
  country_id: [number, string] | false;
  create_date: string;
  write_date: string;
  create_uid: [number, string] | false;
  write_uid: [number, string] | false;
  currency_id: [number, string] | false;
  display_name: string;
  email: string;
  employee: boolean;
  employee_id: [number, string] | false;
  equipment_count: number;
  equipment_ids: number[];
  expense_manager_id: [number, string] | false;
  gender: string | false;
  lang: string;
  login: string;
  name: string;
  mobile: string | false;
  phone?: string | false;
  partner_latitude: number | false;
  partner_longitude: number | false;
  project_ids: number[];
  sale_order_ids: number[];
  street: string | false;
  task_ids: number[];
  tz?: string;
}

/**
 * Interface pour le modèle utilisateur hydraté
 * Version nettoyée et optimisée pour l'application mobile
 */
export interface IUser extends IBaseModel {
  // Informations de base
  name: string;
  email: string;
  login: string;
  displayName: string;
  
  // Informations de contact
  mobile: string;
  phone?: string;
  
  // Informations géographiques
  city: string;
  street: string;
  country: string;
  latitude?: number;
  longitude?: number;
  
  // Informations professionnelles
  company: string;
  companyId: number;
  employee: boolean;
  employeeId?: number;
  expenseManagerId?: number;
  
  // Préférences
  language: string;
  timezone: string;
  currency: string;
  gender?: string;
  
  // Avatar et image
  avatar: string;
  avatarUrl?: string;
  
  // Relations
  partnerId?: number;
  equipmentCount: number;
  projectCount: number;
  taskCount: number;
  saleOrderCount: number;
  
  // Métadonnées
  createUid?: number;
  writeUid?: number;
  
  // Méthodes spécifiques à l'utilisateur
  getFullAddress(): string;
  getFormattedPhone(): string;
  getLanguageDisplay(): string;
  getTimezoneDisplay(): string;
  hasLocation(): boolean;
  isEmployee(): boolean;
  getAvatarUrl(): string;
}

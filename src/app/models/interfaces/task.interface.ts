import { IBaseModel } from './base.interface';

/**
 * Interface pour les données tâche brutes provenant d'Odoo
 * Correspond exactement aux champs du modèle project.task
 */
export interface ITaskOdoo {
  id: number;
  name: string;
  description: string | false;
  project_id?: [number, string] | false;
  state: string;
  progress: number;
  date_deadline: string | false;
  effective_hours?: number;
  remaining_hours?: number;
  total_hours_spent?: number;
  user_id?: [number, string] | false;
  stage_id?: [number, string] | false;
  priority: string;
  create_date?: string;
  write_date?: string;
}

/**
 * Interface pour le modèle tâche hydraté
 * Version nettoyée et optimisée pour l'application mobile
 */
export interface ITask extends IBaseModel {
  // Informations de base
  name: string;
  description: string;
  displayName: string;
  
  // Relations principales
  projectId?: number;
  projectName?: string;
  stageId?: number;
  stageName?: string;
  userId?: number;
  userName?: string;
  
  // Dates importantes
  deadline?: Date;
  createDate?: Date;
  writeDate?: Date;
  
  // Heures et temps
  effectiveHours: number;
  remainingHours: number;
  totalHoursSpent: number;
  
  // Progression
  progress: number;
  
  // État et statut
  state: string;
  priority: string;
  isActive: boolean;
  
  // Méthodes spécifiques à la tâche
  getProgressDisplay(): string;
  getStateDisplay(): string;
  getFormattedDeadline(): string;
  isOverdue(): boolean;
  getDaysRemaining(): number;
  getHoursRemaining(): number;
  getTotalHoursFormatted(): string;
  getEffectiveHoursFormatted(): string;
  getPriorityDisplay(): string;
  getTaskStatistics(): any;
}

import { IBaseModel } from './base.interface';

/**
 * Interface pour les données tâche brutes provenant d'Odoo
 * Correspond exactement aux champs du modèle project.task
 */
export interface ITaskOdoo {
  id: number;
  active: boolean;
  name: string;
  stage_id: [number, string] | false;
  date_deadline: string;
  project_id: [number, string] | false;
  date_end: string;
  job_cost_id: [number, string] | false;
  job_number: string;
  date_assign: string;
  description: string;
  effective_hours: number;
  expense_ids: number[];
  is_closed: boolean;
  material_plan_ids: number[];
  material_reqsn_count: number;
  milestone_id: [number, string] | false;
  move_ids: number[];
  partner_id: [number, string] | false;
  overtime: number;
  picking_ids: number[];
  planned_date_start: string;
  planned_date_begin: string;
  progress: number;
  reccuring_task: boolean;
  remaining_hours: number;
  req_equipment_line_ids: number[];
  req_vehicle_line_ids: number[];
  state: string;
  task_to_invoice: boolean;
  timesheet_ids: number[];
  total_hours_spent: number;
  working_hours_open: number;
  working_days_open: number;
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
  partnerId?: number;
  partnerName?: string;
  milestoneId?: number;
  milestoneName?: string;
  
  // Dates importantes
  deadline?: Date;
  endDate?: Date;
  assignDate?: Date;
  plannedStartDate?: Date;
  plannedBeginDate?: Date;
  
  // Heures et temps
  effectiveHours: number;
  remainingHours: number;
  totalHoursSpent: number;
  overtime: number;
  workingHoursOpen: number;
  workingDaysOpen: number;
  
  // Progression
  progress: number;
  
  // État et statut
  state: string;
  isClosed: boolean;
  isActive: boolean;
  isRecurring: boolean;
  taskToInvoice: boolean;
  
  // Compteurs
  materialRequestCount: number;
  expenseCount: number;
  
  // Relations complexes
  materialPlanIds: number[];
  expenseIds: number[];
  timesheetIds: number[];
  moveIds: number[];
  pickingIds: number[];
  equipmentRequestIds: number[];
  vehicleRequestIds: number[];
  
  // Métadonnées
  jobCostId?: number;
  jobNumber?: string;
  
  // Méthodes spécifiques à la tâche
  getProgressDisplay(): string;
  getStateDisplay(): string;
  getFormattedDeadline(): string;
  getFormattedEndDate(): string;
  getFormattedAssignDate(): string;
  getFormattedPlannedStartDate(): string;
  getFormattedPlannedBeginDate(): string;
  isOverdue(): boolean;
  getDaysRemaining(): number;
  getHoursRemaining(): number;
  getTotalHoursFormatted(): string;
  getEffectiveHoursFormatted(): string;
  getOvertimeFormatted(): string;
  isAssigned(): boolean;
  isPlanned(): boolean;
  canBeInvoiced(): boolean;
  getTaskStatistics(): any;
}

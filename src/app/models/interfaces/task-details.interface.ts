/**
 * Interfaces pour les données des onglets de détail de tâche
 */

// 1. Planification des matériaux
export interface IMaterialPlan {
  id: number;
  description?: string;
  product_id?: [number, string];
  product_uom?: [number, string];
  product_uom_qty?: number;
}

// 2. Matériaux consommés
export interface IConsumedMaterial {
  id: number;
  description?: string;
  product_id?: [number, string];
  product_uom?: [number, string];
  product_uom_qty?: number;
  consumed_qty?: number;
  is_picked?: boolean;
}

// 3. Véhicules
export interface IVehicleRequest {
  id: number;
  name?: string;
  description?: string;
  fleet_ids?: number[];
  state?: string;
}

// 4. Équipements
export interface IEquipmentRequest {
  id: number;
  name?: string;
  description?: string;
  equipment_ids?: number[];
  state?: string;
}

// 5. Dépenses
export interface IExpense {
  id: number;
  name: string;
  date: string;
  product_id: [number, string];
  quantity: number;
  total_amount: number;
  state: string;
}

// 6. Feuilles de temps
export interface ITimesheet {
  id: number;
  date: string;
  employee_id?: [number, string] | false;
  name: string;
  unit_amount: number;
  end_time?: number;
  job_cost_id?: [number, string] | false;
}

// Interface pour les données d'onglet
export interface ITaskTabData {
  materialPlans: IMaterialPlan[];
  consumedMaterials: IConsumedMaterial[];
  vehicleRequests: IVehicleRequest[];
  equipmentRequests: IEquipmentRequest[];
  expenses: IExpense[];
  timesheets: ITimesheet[];
}

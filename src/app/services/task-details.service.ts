import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  ITaskTabData, 
  IMaterialPlan, 
  IConsumedMaterial, 
  IVehicleRequest, 
  IEquipmentRequest, 
  IExpense, 
  ITimesheet 
} from '../models/interfaces/task-details.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskDetailsService {
  private odooUrl = 'https://btp.onaerp.com/jsonrpc';
  private dbName = 'btptst';
  private uid: number = 7; // UID par défaut

  constructor() {}

  /**
   * Récupère toutes les données des onglets pour une tâche
   * @param taskId ID de la tâche
   * @returns Observable<ITaskTabData>
   */
  getTaskTabData(taskId: number): Observable<ITaskTabData> {
    console.log('🔍 TaskDetailsService - Récupération des données d\'onglets pour la tâche:', taskId);
    
    return from(Promise.all([
      this.getMaterialPlans(taskId),
      this.getConsumedMaterials(taskId),
      this.getVehicleRequests(taskId),
      this.getEquipmentRequests(taskId),
      this.getExpenses(taskId),
      this.getTimesheets(taskId)
    ])).pipe(
      map(([materialPlans, consumedMaterials, vehicleRequests, equipmentRequests, expenses, timesheets]) => {
        return {
          materialPlans,
          consumedMaterials,
          vehicleRequests,
          equipmentRequests,
          expenses,
          timesheets
        };
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des données d\'onglets:', error);
        return of({
          materialPlans: [],
          consumedMaterials: [],
          vehicleRequests: [],
          equipmentRequests: [],
          expenses: [],
          timesheets: []
        });
      })
    );
  }

  /**
   * Récupère les plans de matériaux
   */
  private async getMaterialPlans(taskId: number): Promise<IMaterialPlan[]> {
    try {
      // Pour l'instant, retourner un tableau vide car le modèle n'existe pas
      console.log('📋 Plans de matériaux - Modèle non disponible');
      return [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des plans de matériaux:', error);
      return [];
    }
  }

  /**
   * Récupère les matériaux consommés
   */
  private async getConsumedMaterials(taskId: number): Promise<IConsumedMaterial[]> {
    try {
      // Pour l'instant, retourner un tableau vide car le modèle n'existe pas
      console.log('📋 Matériaux consommés - Modèle non disponible');
      return [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des matériaux consommés:', error);
      return [];
    }
  }

  /**
   * Récupère les demandes de véhicules
   */
  private async getVehicleRequests(taskId: number): Promise<IVehicleRequest[]> {
    try {
      // Pour l'instant, retourner un tableau vide car le modèle n'existe pas
      console.log('📋 Demandes de véhicules - Modèle non disponible');
      return [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des demandes de véhicules:', error);
      return [];
    }
  }

  /**
   * Récupère les demandes d'équipements
   */
  private async getEquipmentRequests(taskId: number): Promise<IEquipmentRequest[]> {
    try {
      // Pour l'instant, retourner un tableau vide car le modèle n'existe pas
      console.log('📋 Demandes d\'équipements - Modèle non disponible');
      return [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des demandes d\'équipements:', error);
      return [];
    }
  }

  /**
   * Récupère les dépenses liées à la tâche
   */
  private async getExpenses(taskId: number): Promise<IExpense[]> {
    try {
      // D'abord, récupérer les IDs des dépenses de la tâche
      const taskData = await this.getTaskExpenseIds(taskId);
      if (!taskData || !taskData.expense_ids || taskData.expense_ids.length === 0) {
        console.log('📋 Aucune dépense trouvée pour la tâche:', taskId);
        return [];
      }

      // Ensuite, récupérer les détails des dépenses
      const requestBody = {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            this.dbName,
            this.uid,
            "demo",
            "hr.expense",
            "search_read",
            [[["id", "in", taskData.expense_ids]]],
            {
              fields: ['id', 'name', 'date', 'product_id', 'quantity', 'total_amount', 'state'],
              limit: 50
            }
          ]
        }
      };

      const options: HttpOptions = {
        url: this.odooUrl,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'ONA-BTP-Mobile/1.0'
        },
        data: requestBody,
        connectTimeout: 10000,
        readTimeout: 10000
      };

      const response = await CapacitorHttp.post(options);
      
      if (response.status === 200 && response.data?.result) {
        console.log('✅ Dépenses récupérées:', response.data.result.length);
        return response.data.result;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des dépenses:', error);
      return [];
    }
  }

  /**
   * Récupère les feuilles de temps liées à la tâche
   */
  private async getTimesheets(taskId: number): Promise<ITimesheet[]> {
    try {
      // D'abord, récupérer les IDs des feuilles de temps de la tâche
      const taskData = await this.getTaskTimesheetIds(taskId);
      if (!taskData || !taskData.timesheet_ids || taskData.timesheet_ids.length === 0) {
        console.log('📋 Aucune feuille de temps trouvée pour la tâche:', taskId);
        return [];
      }

      // Ensuite, récupérer les détails des feuilles de temps
      const requestBody = {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            this.dbName,
            this.uid,
            "demo",
            "account.analytic.line",
            "search_read",
            [[["id", "in", taskData.timesheet_ids]]],
            {
              fields: ['id', 'date', 'employee_id', 'name', 'unit_amount', 'end_time', 'job_cost_id'],
              limit: 50
            }
          ]
        }
      };

      const options: HttpOptions = {
        url: this.odooUrl,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'ONA-BTP-Mobile/1.0'
        },
        data: requestBody,
        connectTimeout: 10000,
        readTimeout: 10000
      };

      const response = await CapacitorHttp.post(options);
      
      if (response.status === 200 && response.data?.result) {
        console.log('✅ Feuilles de temps récupérées:', response.data.result.length);
        return response.data.result;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des feuilles de temps:', error);
      return [];
    }
  }

  /**
   * Récupère les IDs des dépenses d'une tâche
   */
  private async getTaskExpenseIds(taskId: number): Promise<{expense_ids: number[]} | null> {
    try {
      const requestBody = {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            this.dbName,
            this.uid,
            "demo",
            "project.task",
            "search_read",
            [[["id", "=", taskId]]],
            {
              fields: ['expense_ids'],
              limit: 1
            }
          ]
        }
      };

      const options: HttpOptions = {
        url: this.odooUrl,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'ONA-BTP-Mobile/1.0'
        },
        data: requestBody,
        connectTimeout: 10000,
        readTimeout: 10000
      };

      const response = await CapacitorHttp.post(options);
      
      if (response.status === 200 && response.data?.result && response.data.result.length > 0) {
        return response.data.result[0];
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des IDs de dépenses:', error);
      return null;
    }
  }

  /**
   * Récupère les IDs des feuilles de temps d'une tâche
   */
  private async getTaskTimesheetIds(taskId: number): Promise<{timesheet_ids: number[]} | null> {
    try {
      const requestBody = {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            this.dbName,
            this.uid,
            "demo",
            "project.task",
            "search_read",
            [[["id", "=", taskId]]],
            {
              fields: ['timesheet_ids'],
              limit: 1
            }
          ]
        }
      };

      const options: HttpOptions = {
        url: this.odooUrl,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'ONA-BTP-Mobile/1.0'
        },
        data: requestBody,
        connectTimeout: 10000,
        readTimeout: 10000
      };

      const response = await CapacitorHttp.post(options);
      
      if (response.status === 200 && response.data?.result && response.data.result.length > 0) {
        return response.data.result[0];
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des IDs de feuilles de temps:', error);
      return null;
    }
  }
}

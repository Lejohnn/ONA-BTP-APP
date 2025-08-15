import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HydrationService } from './hydration.service';
import { ITaskOdoo, ITask } from '../models/interfaces/task.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private odooUrl = 'https://btp.onaerp.com/jsonrpc';
  private dbName = 'btptst';
  private uid: number = 0;

  constructor(private hydrationService: HydrationService) {
    this.getUidFromStorage();
  }

  // ===== GESTION UID =====
  private getUidFromStorage(): void {
    const storedUid = localStorage.getItem('odoo_uid');
    console.log('🔍 UID stocké dans localStorage:', storedUid);
    if (storedUid) {
      this.uid = parseInt(storedUid);
      console.log('✅ UID parsé:', this.uid);
    } else {
      this.uid = 0;
      console.log('❌ Pas d\'UID trouvé, valeur par défaut:', this.uid);
    }
  }

  // ===== RÉCUPÉRATION DES TÂCHES =====
  
  /**
   * Récupère toutes les tâches
   * @returns Observable<ITask[]>
   */
  getAllTasks(): Observable<ITask[]> {
    console.log('🔍 getAllTasks appelé avec UID:', this.uid);
    if (!this.uid) {
      console.log('❌ Pas d\'UID, retourne tableau vide');
      return of([]);
    }

    return this.getTasksFromOdoo().pipe(
      map(tasksData => {
        console.log('📊 Données brutes reçues:', tasksData);
        if (tasksData && tasksData.length > 0) {
          const hydratedTasks = this.hydrateTasksFromOdoo(tasksData);
          console.log('✅ Tâches hydratées:', hydratedTasks.length);
          return hydratedTasks;
        }
        console.log('❌ Aucune tâche à hydrater');
        return [];
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des tâches:', error);
        return of([]);
      })
    );
  }

  /**
   * Récupère les tâches d'un projet spécifique
   * @param projectId ID du projet
   * @returns Observable<ITask[]>
   */
  getTasksByProject(projectId: number): Observable<ITask[]> {
    if (!this.uid || !projectId) {
      return of([]);
    }

    return this.getTasksFromOdooByProject(projectId).pipe(
      map(tasksData => {
        if (tasksData && tasksData.length > 0) {
          return this.hydrateTasksFromOdoo(tasksData);
        }
        return [];
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des tâches du projet:', error);
        return of([]);
      })
    );
  }

  // ===== REQUÊTES API ODOO =====

  private getTasksFromOdoo(): Observable<ITaskOdoo[]> {
    if (!this.uid) {
      return of([]);
    }

    const options = {
      url: this.odooUrl,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            this.dbName,
            this.uid,
            'demo',
            'project.task',
            'search_read',
            [[['active', '=', true]]],
            {
              fields: [
                'id', 
                'name', 
                'description', 
                'project_id', 
                'state', 
                'progress', 
                'date_deadline', 
                'effective_hours', 
                'remaining_hours', 
                'total_hours_spent', 
                'user_id', 
                'stage_id', 
                'priority', 
                'create_date', 
                'write_date'
              ]
            }
          ]
        },
        id: null
      }
    };

    console.log('📤 Requête API envoyée avec UID:', this.uid);
    console.log('📤 Options:', JSON.stringify(options.data, null, 2));

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📥 Réponse API reçue:', response);
        if (response.data && response.data.result) {
          console.log('✅ Résultat API trouvé:', response.data.result);
          return response.data.result;
        }
        if (response.data && response.data.error) {
          console.error('❌ Erreur API:', response.data.error);
        }
        console.log('❌ Aucun résultat API');
        return [];
      }),
      catchError(error => {
        console.error('❌ Erreur HTTP:', error);
        return of([]);
      })
    );
  }

  private getTasksFromOdooByProject(projectId: number): Observable<ITaskOdoo[]> {
    if (!this.uid) {
      return of([]);
    }

    // Test avec champs minimaux d'abord
    const options: HttpOptions = {
      url: this.odooUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [
            this.dbName,
            this.uid,
            'demo',
            'project.task',
            'search_read',
            [[['active', '=', true], ['project_id', '=', projectId]]],
            {
              fields: ['id', 'name', 'description', 'project_id', 'state', 'progress']
            }
          ]
        }
      }
    };

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        if (response.data && response.data.result) {
          return response.data.result;
        }
        return [];
      })
    );
  }

  // ===== HYDATATION DES DONNÉES =====

  private hydrateTasksFromOdoo(tasksData: ITaskOdoo[]): ITask[] {
    return tasksData.map(taskData => this.hydrateTaskFromOdoo(taskData));
  }

  private hydrateTaskFromOdoo(taskData: ITaskOdoo): ITask {
    // Nettoyer la description HTML
    let cleanDescription = '';
    if (taskData.description && typeof taskData.description === 'string') {
      // Supprimer les balises HTML et les attributs
      cleanDescription = taskData.description
        .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
        .replace(/&nbsp;/g, ' ') // Remplacer les espaces insécables
        .trim();
    }

    // Extraire les informations des relations
    const projectInfo = taskData.project_id && Array.isArray(taskData.project_id) 
      ? { id: taskData.project_id[0], name: taskData.project_id[1] } 
      : { id: undefined, name: undefined };

    const stageInfo = taskData.stage_id && Array.isArray(taskData.stage_id) 
      ? { id: taskData.stage_id[0], name: taskData.stage_id[1] } 
      : { id: undefined, name: undefined };

    const userInfo = taskData.user_id && Array.isArray(taskData.user_id) 
      ? { id: taskData.user_id[0], name: taskData.user_id[1] } 
      : { id: undefined, name: undefined };

    // Traiter les dates
    const deadline = taskData.date_deadline && typeof taskData.date_deadline === 'string'
      ? new Date(taskData.date_deadline) 
      : undefined;

    const createDate = taskData.create_date ? new Date(taskData.create_date) : new Date();
    const writeDate = taskData.write_date ? new Date(taskData.write_date) : new Date();

    // Nettoyer l'état (enlever le préfixe numérique)
    const cleanState = taskData.state.replace(/^\d+_/, '');

    return {
      // Informations de base
      id: taskData.id,
      name: taskData.name,
      description: cleanDescription,
      displayName: taskData.name,
      
      // Relations principales
      projectId: projectInfo.id,
      projectName: projectInfo.name,
      stageId: stageInfo.id,
      stageName: stageInfo.name,
      userId: userInfo.id,
      userName: userInfo.name,
      
      // Dates importantes
      deadline: deadline,
      createDate: createDate,
      writeDate: writeDate,
      
      // Heures et temps
      effectiveHours: taskData.effective_hours || 0,
      remainingHours: taskData.remaining_hours || 0,
      totalHoursSpent: taskData.total_hours_spent || 0,
      
      // Progression
      progress: taskData.progress || 0,
      
      // État et statut
      state: cleanState,
      priority: taskData.priority || '0',
      isActive: true,
      
      // Méthodes IBaseModel
      hydrate: function(rawData: any): ITask {
        return this as ITask;
      },
      isValid: function(): boolean {
        return this.id > 0 && this.name.length > 0;
      },
      toDisplay: function(): any {
        return {
          id: this.id,
          name: this.name,
          displayName: this.displayName,
          progress: this.progress,
          state: this.state,
          projectName: this.projectName,
          deadline: this.deadline
        };
      },
      toJSON: function(): any {
        return {
          id: this.id,
          name: this.name,
          description: this.description,
          displayName: this.displayName,
          projectId: this.projectId,
          projectName: this.projectName,
          stageId: this.stageId,
          stageName: this.stageName,
          userId: this.userId,
          userName: this.userName,
          progress: this.progress,
          state: this.state,
          deadline: this.deadline,
          effectiveHours: this.effectiveHours,
          remainingHours: this.remainingHours,
          totalHoursSpent: this.totalHoursSpent,
          priority: this.priority,
          isActive: this.isActive,
          createDate: this.createDate,
          writeDate: this.writeDate
        };
      },

      // Méthodes spécifiques à la tâche
      getProgressDisplay: function(): string {
        return `${Math.round(this.progress * 100)}%`;
      },
      getStateDisplay: function(): string {
        const stateMap: { [key: string]: string } = {
          'draft': 'Brouillon',
          'open': 'Ouverte',
          'pending': 'En attente',
          'in_progress': 'En cours',
          'done': 'Terminée',
          'cancelled': 'Annulée',
          'closed': 'Fermée'
        };
        return stateMap[this.state] || this.state;
      },
      getFormattedDeadline: function(): string {
        if (!this.deadline) return 'Aucune date limite';
        return this.deadline.toLocaleDateString('fr-FR');
      },
      isOverdue: function(): boolean {
        if (!this.deadline) return false;
        return this.deadline < new Date() && this.state !== 'done';
      },
      getDaysRemaining: function(): number {
        if (!this.deadline) return -1;
        const now = new Date();
        const diffTime = this.deadline.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      },
      getHoursRemaining: function(): number {
        return this.remainingHours;
      },
      getTotalHoursFormatted: function(): string {
        return `${this.totalHoursSpent}h`;
      },
      getEffectiveHoursFormatted: function(): string {
        return `${this.effectiveHours}h`;
      },
      getPriorityDisplay: function(): string {
        const priorityMap: { [key: string]: string } = {
          '0': 'Normale',
          '1': 'Élevée',
          '2': 'Très élevée'
        };
        return priorityMap[this.priority] || 'Normale';
      },
      getTaskStatistics: function(): any {
        return {
          progress: this.progress,
          effectiveHours: this.effectiveHours,
          remainingHours: this.remainingHours,
          totalHours: this.totalHoursSpent,
          isOverdue: this.isOverdue(),
          daysRemaining: this.getDaysRemaining()
        };
      }
    };
  }

  private getStateDisplay(state: string): string {
    const stateMap: { [key: string]: string } = {
      'draft': 'Brouillon',
      'open': 'Ouverte',
      'pending': 'En attente',
      'in_progress': 'En cours',
      'done': 'Terminée',
      'cancelled': 'Annulée',
      'closed': 'Fermée'
    };
    return stateMap[state] || state;
  }

  private isOverdue(deadline?: string): boolean {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  }

  private getDaysRemaining(deadline?: string): number {
    if (!deadline) return 0;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

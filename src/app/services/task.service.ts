import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
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
      // Utiliser l'UID 7 par défaut comme découvert dans le test
      this.uid = 7;
      console.log('⚠️ Pas d\'UID trouvé, utilisation de l\'UID par défaut:', this.uid);
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
    console.log('🔍 getTasksByProject appelé avec projectId:', projectId);
    if (!this.uid || !projectId) {
      console.log('❌ UID ou projectId manquant - UID:', this.uid, 'projectId:', projectId);
      return of([]);
    }

    return this.getTasksFromOdooByProject(projectId).pipe(
      map(tasksData => {
        console.log('📊 TaskService - Données brutes reçues pour le projet:', projectId, ':', tasksData);
        if (tasksData && tasksData.length > 0) {
          const hydratedTasks = this.hydrateTasksFromOdoo(tasksData);
          console.log('✅ TaskService - Tâches hydratées pour le projet:', projectId, ':', hydratedTasks.length);
          return hydratedTasks;
        }
        console.log('❌ TaskService - Aucune tâche trouvée pour le projet:', projectId);
        return [];
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des tâches du projet:', error);
        return of([]);
      })
    );
  }

  /**
   * Récupère les détails d'une tâche spécifique par son ID
   * @param taskId ID de la tâche
   * @returns Observable avec les détails de la tâche
   */
  getTaskDetails(taskId: number): Observable<ITask> {
    console.log('🔍 TaskService - getTaskDetails() appelé avec taskId:', taskId);
    console.log('🔍 TaskService - UID actuel:', this.uid);

    if (!this.uid) {
      console.error('❌ TaskService - UID non disponible pour récupérer les détails de la tâche');
      return throwError(() => new Error('UID non disponible'));
    }

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
            fields: [
              'id', 'name', 'description', 'state', 'priority', 'date_deadline',
              'progress', 'project_id', 'remaining_hours',
              'effective_hours', 'total_hours_spent', 'create_date', 'write_date',
              'stage_id', 'display_name',
              'parent_id', 'child_ids'
            ],
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
      connectTimeout: 30000,
      readTimeout: 30000
    };

    console.log('📤 TaskService - Requête détails tâche envoyée:', JSON.stringify(requestBody, null, 2));

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📦 TaskService - Réponse API détails tâche reçue');
        console.log('📦 TaskService - Status de la réponse:', response.status);
        console.log('📦 TaskService - Data de la réponse:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 200 && response.data?.result && response.data.result.length > 0) {
          const rawTask = response.data.result[0];
          console.log('📋 TaskService - Données brutes de la tâche:', rawTask);
          
          const task = this.hydrateTaskFromOdoo(rawTask);
          console.log('✅ TaskService - Tâche hydratée avec succès:', task);
          return task;
        } else {
          console.error('❌ TaskService - Tâche non trouvée ou réponse invalide');
          throw new Error('Tâche non trouvée');
        }
      }),
      catchError(error => {
        console.error('❌ TaskService - Erreur lors de la récupération des détails de la tâche:', error);
        return throwError(() => new Error('Impossible de récupérer les détails de la tâche'));
      })
    );
  }

  // ===== REQUÊTES API ODOO =====

  private getTasksFromOdoo(): Observable<ITaskOdoo[]> {
    if (!this.uid) {
      return of([]);
    }

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
          [[["active", "=", true]]],
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
              'stage_id', 
              'priority', 
              'create_date', 
              'write_date',
              'parent_id',
              'child_ids'
            ],
            limit: 100
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
      connectTimeout: 30000,
      readTimeout: 30000
    };

    console.log('📤 Requête API envoyée avec UID:', this.uid);
    console.log('📤 Options:', JSON.stringify(requestBody, null, 2));

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📥 Réponse API reçue:', response);
        console.log('📥 Status de la réponse:', response.status);
        console.log('📥 Data de la réponse:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 200 && response.data?.result) {
          console.log('✅ Résultat API trouvé:', response.data.result);
          return response.data.result;
        }
        if (response.data && response.data.error) {
          console.error('❌ Erreur API:', JSON.stringify(response.data.error, null, 2));
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

    console.log('📤 TaskService - getTasksFromOdooByProject() appelé avec projectId:', projectId);

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
          [[["active", "=", true], ["project_id", "=", projectId]]],
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
              'stage_id', 
              'priority', 
              'create_date', 
              'write_date',
              'material_plan_ids',
              'expense_ids',
              'timesheet_ids',
              'parent_id',
              'child_ids'
            ],
            limit: 100
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
      connectTimeout: 30000,
      readTimeout: 30000
    };

    console.log('📤 TaskService - Requête API tâches par projet envoyée:', JSON.stringify(requestBody, null, 2));

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📦 TaskService - Réponse API tâches par projet reçue:', response);
        console.log('📦 TaskService - Status de la réponse:', response.status);
        console.log('📦 TaskService - Data de la réponse:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 200 && response.data?.result) {
          console.log('✅ TaskService - Résultat API tâches par projet trouvé:', response.data.result);
          return response.data.result;
        }
        if (response.data && response.data.error) {
          console.error('❌ TaskService - Erreur API tâches par projet:', JSON.stringify(response.data.error, null, 2));
        }
        console.log('❌ TaskService - Aucun résultat API tâches par projet');
        return [];
      }),
      catchError(error => {
        console.error('❌ TaskService - Erreur HTTP tâches par projet:', error);
        return of([]);
      })
    );
  }

  // ===== HYDATATION DES DONNÉES =====

  private hydrateTasksFromOdoo(tasksData: ITaskOdoo[]): ITask[] {
    return tasksData.map(taskData => this.hydrateTaskFromOdoo(taskData));
  }

  private hydrateTaskFromOdoo(taskData: ITaskOdoo): ITask {
    console.log('🔄 TaskService - hydrateTaskFromOdoo() appelé avec taskData:', taskData);
    
    // Nettoyer la description HTML
    let cleanDescription = '';
    if (taskData.description && typeof taskData.description === 'string') {
      // Supprimer les balises HTML et les attributs
      cleanDescription = taskData.description
        .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
        .replace(/&nbsp;/g, ' ') // Remplacer les espaces insécables
        .trim();
    }
    console.log('📝 TaskService - Description nettoyée:', cleanDescription);

    // Extraire les informations des relations
    const projectInfo = taskData.project_id && Array.isArray(taskData.project_id) 
      ? { id: taskData.project_id[0], name: taskData.project_id[1] } 
      : { id: undefined, name: undefined };

    const stageInfo = taskData.stage_id && Array.isArray(taskData.stage_id) 
      ? { id: taskData.stage_id[0], name: taskData.stage_id[1] } 
      : { id: undefined, name: undefined };

    // user_id n'existe pas dans le modèle project.task, on utilise des valeurs par défaut
    const userInfo = { id: undefined, name: undefined };

    // Traiter les dates
    const deadline = taskData.date_deadline && typeof taskData.date_deadline === 'string'
      ? new Date(taskData.date_deadline) 
      : undefined;

    const createDate = taskData.create_date ? new Date(taskData.create_date) : new Date();
    const writeDate = taskData.write_date ? new Date(taskData.write_date) : new Date();

    // Nettoyer l'état (enlever le préfixe numérique)
    const cleanState = taskData.state && typeof taskData.state === 'string' 
      ? taskData.state.replace(/^\d+_/, '') 
      : 'draft';

    const hydratedTask = {
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
      
      // Relations pour les onglets
      materialPlanIds: taskData.material_plan_ids || [],
      expenseIds: taskData.expense_ids || [],
      timesheetIds: taskData.timesheet_ids || [],
      
      // Relations de hiérarchie
      parentId: taskData.parent_id && Array.isArray(taskData.parent_id) ? taskData.parent_id[0] : undefined,
      parentName: taskData.parent_id && Array.isArray(taskData.parent_id) ? taskData.parent_id[1] : undefined,
      childIds: taskData.child_ids || [],
      
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
          writeDate: this.writeDate,
          materialPlanIds: this.materialPlanIds,
          expenseIds: this.expenseIds,
          timesheetIds: this.timesheetIds,
          parentId: this.parentId,
          parentName: this.parentName,
          childIds: this.childIds
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
    
    console.log('✅ TaskService - Tâche hydratée créée avec succès:', hydratedTask);
    return hydratedTask;
  }

  /**
   * Récupère les valeurs possibles pour le champ state des tâches
   * @returns Observable avec la liste des valeurs de statut
   */
  getTaskStates(): Observable<any[]> {
    console.log('🔍 Récupération des valeurs de statut des tâches');
    if (!this.uid) {
      console.error('❌ UID non disponible pour récupérer les statuts');
      return of([]);
    }

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
          "fields_get",
          [["state"]],
          { attributes: ["selection"] }
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
      connectTimeout: 30000,
      readTimeout: 30000
    };

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📦 Réponse API statuts:', response);
        if (response.status === 200 && response.data?.result?.state?.selection) {
          const states = response.data.result.state.selection;
          console.log('✅ Statuts récupérés:', states);
          return states;
        } else {
          console.log('❌ Aucun statut trouvé');
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des statuts:', error);
        return of([]);
      })
    );
  }

  /**
   * Crée une nouvelle tâche
   * @param taskData Données de la tâche à créer
   * @returns Observable avec la tâche créée
   */
  createTask(taskData: {
    name: string;
    description?: string;
    projectId?: number;
    userId?: number;
    dateDeadline?: string;
    priority?: string;
    progress?: number;
  }): Observable<ITask> {
    // Convertir le format de date si nécessaire
    let formattedDateDeadline = taskData.dateDeadline;
    if (formattedDateDeadline && formattedDateDeadline.includes('T')) {
      formattedDateDeadline = formattedDateDeadline.replace('T', ' ');
    }
    console.log('🔍 TaskService - createTask() appelé avec:', taskData);

    if (!this.uid) {
      console.error('❌ TaskService - UID non disponible pour créer la tâche');
      return throwError(() => new Error('UID non disponible'));
    }

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
          "create",
          [{
            name: taskData.name,
            description: taskData.description || '',
            project_id: taskData.projectId || false,
            user_id: taskData.userId || false,
            date_deadline: formattedDateDeadline || false,
            priority: taskData.priority || '0',
            progress: taskData.progress || 0
          }]
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
      connectTimeout: 30000,
      readTimeout: 30000
    };

    console.log('📤 TaskService - Requête création tâche envoyée:', JSON.stringify(requestBody, null, 2));

    return from(CapacitorHttp.post(options)).pipe(
      switchMap(response => {
        console.log('📦 TaskService - Réponse API création tâche reçue');
        console.log('📦 TaskService - Status de la réponse:', response.status);
        console.log('📦 TaskService - Data de la réponse:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 200 && response.data?.result) {
          const taskId = response.data.result;
          console.log('✅ TaskService - Tâche créée avec ID:', taskId);
          
          // Récupérer les détails de la tâche créée
          return this.getTaskDetails(taskId);
        } else {
          console.error('❌ TaskService - Erreur lors de la création de la tâche');
          throw new Error('Erreur lors de la création de la tâche');
        }
      }),
      catchError(error => {
        console.error('❌ TaskService - Erreur lors de la création de la tâche:', error);
        return throwError(() => new Error('Impossible de créer la tâche'));
      })
    );
  }

  /**
   * Récupère les sous-tâches d'une tâche parent
   * @param parentTaskId ID de la tâche parent
   * @returns Observable avec la liste des sous-tâches
   */
  getSubTasks(parentTaskId: number): Observable<ITask[]> {
    console.log('🔍 Récupération des sous-tâches pour la tâche:', parentTaskId);

    if (!this.uid) {
      console.error('❌ UID non disponible pour récupérer les sous-tâches');
      return of([]);
    }

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
          [[["parent_id", "=", parentTaskId]]],
          {
            fields: [
              'id', 'name', 'description', 'state', 'priority', 'date_deadline',
              'progress', 'project_id', 'remaining_hours',
              'effective_hours', 'total_hours_spent', 'create_date', 'write_date',
              'stage_id', 'display_name'
            ],
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
      connectTimeout: 30000,
      readTimeout: 30000
    };

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📦 Réponse API sous-tâches:', response);
        
        if (response.status === 200 && response.data?.result) {
          const tasks = response.data.result.map((rawTask: ITaskOdoo) => this.hydrateTaskFromOdoo(rawTask));
          console.log('✅ Sous-tâches hydratées:', tasks);
          return tasks;
        } else {
          console.log('❌ Aucune sous-tâche trouvée');
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des sous-tâches:', error);
        return of([]);
      })
    );
  }

  /**
   * Récupère les tâches dépendantes d'une tâche
   * @param taskId ID de la tâche
   * @returns Observable avec la liste des tâches dépendantes
   */
  getDependentTasks(taskId: number): Observable<ITask[]> {
    console.log('🔍 Récupération des tâches dépendantes pour la tâche:', taskId);

    if (!this.uid) {
      console.error('❌ UID non disponible pour récupérer les tâches dépendantes');
      return of([]);
    }

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
          [[["depend_on_ids", "in", [taskId]]]],
          {
            fields: [
              'id', 'name', 'description', 'state', 'priority', 'date_deadline',
              'progress', 'project_id', 'remaining_hours',
              'effective_hours', 'total_hours_spent', 'create_date', 'write_date',
              'stage_id', 'display_name'
            ],
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
      connectTimeout: 30000,
      readTimeout: 30000
    };

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📦 Réponse API tâches dépendantes:', response);
        
        if (response.status === 200 && response.data?.result) {
          const tasks = response.data.result.map((rawTask: ITaskOdoo) => this.hydrateTaskFromOdoo(rawTask));
          console.log('✅ Tâches dépendantes hydratées:', tasks);
          return tasks;
        } else {
          console.log('❌ Aucune tâche dépendante trouvée');
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des tâches dépendantes:', error);
        return of([]);
      })
    );
  }

  /**
   * Met à jour une tâche existante
   * @param taskId ID de la tâche
   * @param taskData Données de mise à jour
   * @returns Observable avec la tâche mise à jour
   */
  updateTask(taskId: number, taskData: {
    name?: string;
    description?: string;
    projectId?: number;
    userId?: number;
    dateDeadline?: string;
    priority?: string;
    progress?: number;
    state?: string;
  }): Observable<ITask> {
    console.log('🔧 TaskService - updateTask() appelé avec taskId:', taskId, 'et données:', taskData);

    if (!this.uid) {
      console.error('❌ TaskService - UID non disponible pour mettre à jour la tâche');
      return throwError(() => new Error('UID non disponible'));
    }

    // Convertir le format de date si nécessaire
    let formattedDateDeadline = taskData.dateDeadline;
    if (formattedDateDeadline && formattedDateDeadline.includes('T')) {
      formattedDateDeadline = formattedDateDeadline.replace('T', ' ');
    }

    // Préparer les données de mise à jour
    const updateFields: any = {};
    if (taskData.name !== undefined) updateFields.name = taskData.name;
    if (taskData.description !== undefined) updateFields.description = taskData.description || false;
    if (taskData.projectId !== undefined) updateFields.project_id = taskData.projectId || false;
    if (taskData.userId !== undefined) updateFields.user_id = taskData.userId || false;
    if (formattedDateDeadline !== undefined) updateFields.date_deadline = formattedDateDeadline || false;
    if (taskData.priority !== undefined) updateFields.priority = taskData.priority || '0';
    if (taskData.progress !== undefined) updateFields.progress = taskData.progress || 0;
    if (taskData.state !== undefined) updateFields.state = taskData.state;

    const requestBody = {
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
          'write',
          [
            [taskId],
            updateFields
          ]
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
      connectTimeout: 30000,
      readTimeout: 30000
    };

    console.log('📤 TaskService - Requête mise à jour tâche envoyée:', JSON.stringify(requestBody, null, 2));

    return from(CapacitorHttp.post(options)).pipe(
      switchMap(response => {
        console.log('📦 TaskService - Réponse API mise à jour tâche reçue');
        console.log('📦 TaskService - Status de la réponse:', response.status);
        console.log('📦 TaskService - Data de la réponse:', response.data);
        
        if (response.status === 200 && response.data?.result === true) {
          console.log('✅ TaskService - Tâche mise à jour avec succès');
          // Récupérer la tâche mise à jour
          return this.getTaskDetails(taskId);
        } else {
          console.error('❌ TaskService - Erreur lors de la mise à jour de la tâche');
          throw new Error('Erreur lors de la mise à jour de la tâche');
        }
      }),
      catchError(error => {
        console.error('❌ TaskService - Erreur lors de la mise à jour de la tâche:', error);
        return throwError(() => new Error('Erreur lors de la mise à jour de la tâche'));
      })
    );
  }
}

import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CachedUser {
  uid: number;
  email: string;
  name: string;
  lastLogin: Date;
}

export interface CachedProject {
  id: number;
  name: string;
  state: string;
  user_id: number;
  partner_id: number;
  date_start: string;
  date: string;
  project_type: string;
  progressbar: number;
  task_ids: number[];
  priority: string;
  location: string;
  progress: number;
  partner_name: string;
  responsible_name: string;
  lastSync: Date;
}

export interface CachedTask {
  id: number;
  name: string;
  description: string;
  projectId?: number;
  projectName?: string;
  userId?: number;
  userName?: string;
  state: string;
  progress: number;
  priority: string;
  deadline?: string;
  effectiveHours: number;
  remainingHours: number;
  totalHoursSpent: number;
  createDate?: string;
  writeDate?: string;
  lastSync: Date;
}

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'PROJECT' | 'TASK' | 'USER';
  data: any;
  timestamp: Date;
  synced: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {
  private storage: Storage | null = null;
  private isOnline = new BehaviorSubject<boolean>(navigator.onLine);
  private syncQueue = new BehaviorSubject<OfflineAction[]>([]);

  constructor(private storageService: Storage) {
    this.init();
    this.setupOnlineStatusListener();
  }

  async init() {
    this.storage = await this.storageService.create();
  }

  // ===== GESTION CONNEXION =====
  private setupOnlineStatusListener() {
    window.addEventListener('online', () => {
      this.isOnline.next(true);
      this.syncPendingActions();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline.next(false);
    });
  }

  getOnlineStatus(): Observable<boolean> {
    return this.isOnline.asObservable();
  }

  isCurrentlyOnline(): boolean {
    return navigator.onLine;
  }

  // ===== VÉRIFICATION RAPIDE DE CONNECTIVITÉ =====
  async checkConnectivity(): Promise<boolean> {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // Test rapide de connectivité avec un timeout très court
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 secondes max

      const response = await fetch('https://btp.onaerp.com/jsonrpc', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('🔍 Test de connectivité échoué:', error);
      return false;
    }
  }

  // ===== CACHE UTILISATEUR =====
  async cacheUser(user: CachedUser): Promise<void> {
    if (this.storage) {
      await this.storage.set('cached_user', user);
      await this.storage.set('last_login', new Date().toISOString());
    }
  }

  async getCachedUser(): Promise<CachedUser | null> {
    if (this.storage) {
      return await this.storage.get('cached_user');
    }
    return null;
  }

  async clearUserCache(): Promise<void> {
    if (this.storage) {
      await this.storage.remove('cached_user');
      await this.storage.remove('last_login');
    }
  }

  // ===== CACHE PROJETS =====
  async cacheProjects(projects: CachedProject[]): Promise<void> {
    if (this.storage) {
      await this.storage.set('cached_projects', projects);
      await this.storage.set('projects_last_sync', new Date().toISOString());
    }
  }

  async getCachedProjects(): Promise<CachedProject[]> {
    if (this.storage) {
      return await this.storage.get('cached_projects') || [];
    }
    return [];
  }

  async getProjectById(id: number): Promise<CachedProject | null> {
    const projects = await this.getCachedProjects();
    return projects.find(p => p.id === id) || null;
  }

  // ===== CACHE TÂCHES =====
  async cacheTasks(tasks: CachedTask[]): Promise<void> {
    if (this.storage) {
      await this.storage.set('cached_tasks', tasks);
      await this.storage.set('tasks_last_sync', new Date().toISOString());
    }
  }

  async getCachedTasks(): Promise<CachedTask[]> {
    if (this.storage) {
      return await this.storage.get('cached_tasks') || [];
    }
    return [];
  }

  async getTaskById(id: number): Promise<CachedTask | null> {
    const tasks = await this.getCachedTasks();
    return tasks.find(t => t.id === id) || null;
  }

  async getTasksByProject(projectId: number): Promise<CachedTask[]> {
    const tasks = await this.getCachedTasks();
    return tasks.filter(t => t.projectId === projectId);
  }

  // ===== QUEUE DE SYNCHRONISATION =====
  async addToSyncQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced'>): Promise<void> {
    const newAction: OfflineAction = {
      ...action,
      id: this.generateActionId(),
      timestamp: new Date(),
      synced: false
    };

    const currentQueue = this.syncQueue.value;
    const updatedQueue = [...currentQueue, newAction];
    this.syncQueue.next(updatedQueue);

    if (this.storage) {
      await this.storage.set('sync_queue', updatedQueue);
    }
  }

  getSyncQueue(): Observable<OfflineAction[]> {
    return this.syncQueue.asObservable();
  }

  async loadSyncQueue(): Promise<void> {
    if (this.storage) {
      const queue = await this.storage.get('sync_queue') || [];
      this.syncQueue.next(queue);
    }
  }

  // ===== SYNCHRONISATION =====
  async syncPendingActions(): Promise<void> {
    if (!this.isCurrentlyOnline()) {
      console.log('Pas de connexion internet, synchronisation différée');
      return;
    }

    const queue = this.syncQueue.value;
    const pendingActions = queue.filter(action => !action.synced);

    if (pendingActions.length === 0) {
      console.log('Aucune action en attente de synchronisation');
      return;
    }

    console.log(`Synchronisation de ${pendingActions.length} actions...`);

    for (const action of pendingActions) {
      try {
        await this.syncAction(action);
        action.synced = true;
      } catch (error) {
        console.error(`Erreur lors de la synchronisation de l'action ${action.id}:`, error);
      }
    }

    // Mettre à jour la queue
    const updatedQueue = queue.map(action => 
      pendingActions.find(pa => pa.id === action.id) || action
    );
    this.syncQueue.next(updatedQueue);

    if (this.storage) {
      await this.storage.set('sync_queue', updatedQueue);
    }
  }

  private async syncAction(action: OfflineAction): Promise<void> {
    console.log(`🔄 Synchronisation de l'action ${action.type} pour ${action.entity}:`, action.data);
    
    try {
      switch (action.entity) {
        case 'TASK':
          await this.syncTaskAction(action);
          break;
        case 'PROJECT':
          await this.syncProjectAction(action);
          break;
        case 'USER':
          await this.syncUserAction(action);
          break;
        default:
          console.warn(`⚠️ Type d'entité non supporté: ${action.entity}`);
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la synchronisation de l'action ${action.id}:`, error);
      throw error;
    }
  }

  private async syncTaskAction(action: OfflineAction): Promise<void> {
    // Import dynamique pour éviter les dépendances circulaires
    const { TaskService } = await import('./task.service');
    const { HydrationService } = await import('./hydration.service');
    const hydrationService = new HydrationService();
    const taskService = new TaskService(hydrationService);
    
    switch (action.type) {
      case 'CREATE':
        await taskService.createTask(action.data).toPromise();
        break;
      case 'UPDATE':
        await taskService.updateTask(action.data.id, action.data).toPromise();
        break;
      case 'DELETE':
        // Implémenter la suppression si nécessaire
        console.log('🗑️ Suppression de tâche non implémentée');
        break;
    }
  }

  private async syncProjectAction(action: OfflineAction): Promise<void> {
    // Import dynamique pour éviter les dépendances circulaires
    const { ProjectService } = await import('./project.service');
    const { HydrationService } = await import('./hydration.service');
    const hydrationService = new HydrationService();
    const projectService = new ProjectService(hydrationService, this);
    
    switch (action.type) {
      case 'CREATE':
        // Implémenter la création de projet si nécessaire
        console.log('📁 Création de projet non implémentée');
        break;
      case 'UPDATE':
        // Implémenter la mise à jour de projet si nécessaire
        console.log('📁 Mise à jour de projet non implémentée');
        break;
      case 'DELETE':
        // Implémenter la suppression de projet si nécessaire
        console.log('🗑️ Suppression de projet non implémentée');
        break;
    }
  }

  private async syncUserAction(action: OfflineAction): Promise<void> {
    // Import dynamique pour éviter les dépendances circulaires
    const { UserService } = await import('./user.service');
    const { HydrationService } = await import('./hydration.service');
    const hydrationService = new HydrationService();
    const userService = new UserService(hydrationService, this);
    
    switch (action.type) {
      case 'CREATE':
        // Implémenter la création d'utilisateur si nécessaire
        console.log('👤 Création d\'utilisateur non implémentée');
        break;
      case 'UPDATE':
        // Implémenter la mise à jour d'utilisateur si nécessaire
        console.log('👤 Mise à jour d\'utilisateur non implémentée');
        break;
      case 'DELETE':
        // Implémenter la suppression d'utilisateur si nécessaire
        console.log('🗑️ Suppression d\'utilisateur non implémentée');
        break;
    }
  }

  // ===== UTILITAIRES =====
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async clearAllCache(): Promise<void> {
    if (this.storage) {
      await this.storage.clear();
      this.syncQueue.next([]);
    }
  }

  // ===== STATISTIQUES =====
  async getCacheStats(): Promise<{
    userCached: boolean;
    projectsCount: number;
    tasksCount: number;
    pendingActions: number;
    lastSync: string | null;
  }> {
    const user = await this.getCachedUser();
    const projects = await this.getCachedProjects();
    const tasks = await this.getCachedTasks();
    const queue = this.syncQueue.value;
    const lastSync = this.storage ? await this.storage.get('projects_last_sync') : null;

    return {
      userCached: !!user,
      projectsCount: projects.length,
      tasksCount: tasks.length,
      pendingActions: queue.filter(a => !a.synced).length,
      lastSync
    };
  }
}

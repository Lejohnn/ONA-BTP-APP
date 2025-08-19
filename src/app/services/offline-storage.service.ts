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
  private readyPromise: Promise<void> | null = null;
  private isOnline = new BehaviorSubject<boolean>(navigator.onLine);
  private syncQueue = new BehaviorSubject<OfflineAction[]>([]);

  constructor(private storageService: Storage) {
    this.readyPromise = this.init();
    this.setupOnlineStatusListener();
  }

  async init() {
    this.storage = await this.storageService.create();
  }

  private async ensureReady(): Promise<void> {
    if (this.storage) return;
    if (this.readyPromise) {
      await this.readyPromise;
      return;
    }
    this.readyPromise = this.init();
    await this.readyPromise;
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
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 secondes max

      // Utiliser une requête GET simple au lieu de HEAD pour éviter les problèmes CORS
      const response = await fetch('https://btp.onaerp.com', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
        mode: 'no-cors' // Permet de contourner les problèmes CORS
      });

      clearTimeout(timeoutId);
      return true; // Si on arrive ici, la connexion fonctionne
    } catch (error) {
      console.log('🔍 Test de connectivité échoué:', error);
      // En cas d'erreur, on considère quand même qu'on est en ligne si navigator.onLine est true
      return navigator.onLine;
    }
  }

  // ===== CACHE UTILISATEUR =====
  async cacheUser(user: CachedUser): Promise<void> {
    await this.ensureReady();
    if (!this.storage) return;
    await this.storage.set('cached_user', user);
    await this.storage.set('last_login', new Date().toISOString());
  }

  async getCachedUser(): Promise<CachedUser | null> {
    await this.ensureReady();
    if (!this.storage) return null;
    return await this.storage.get('cached_user');
  }

  /**
   * Stocke le profil utilisateur complet (données brutes Odoo) pour l'usage hors-ligne
   */
  async cacheUserProfileRaw(userProfileRaw: any): Promise<void> {
    await this.ensureReady();
    if (!this.storage) return;
    await this.storage.set('cached_user_profile_raw', userProfileRaw);
    await this.storage.set('cached_user_profile_last_sync', new Date().toISOString());
    console.log('✅ cacheUserProfileRaw() - Données mises en cache');
  }

  /**
   * Récupère le profil utilisateur complet (données brutes Odoo) depuis le cache
   */
  async getCachedUserProfileRaw(): Promise<any | null> {
    await this.ensureReady();
    if (!this.storage) return null;
    const data = await this.storage.get('cached_user_profile_raw');
    console.log('🔍 getCachedUserProfileRaw() - Données trouvées:', !!data);
    return data || null;
  }

  // ===== CACHE PROJETS BRUTS =====
  
  /**
   * Stocke les projets bruts (données Odoo) pour l'usage hors-ligne
   */
  async cacheProjectsRaw(projectsRaw: any[]): Promise<void> {
    await this.ensureReady();
    if (!this.storage) return;
    await this.storage.set('cached_projects_raw', projectsRaw);
    await this.storage.set('projects_raw_last_sync', new Date().toISOString());
    console.log('✅ cacheProjectsRaw() - Données mises en cache:', projectsRaw.length);
  }

  /**
   * Récupère les projets bruts depuis le cache
   */
  async getCachedProjectsRaw(): Promise<any[] | null> {
    await this.ensureReady();
    if (!this.storage) return null;
    const data = await this.storage.get('cached_projects_raw');
    console.log('🔍 getCachedProjectsRaw() - Données trouvées:', data ? data.length : 0);
    return data || null;
  }

  // ===== CACHE TÂCHES BRUTES =====
  
  /**
   * Stocke les tâches brutes (données Odoo) pour l'usage hors-ligne
   */
  async cacheTasksRaw(tasksRaw: any[]): Promise<void> {
    await this.ensureReady();
    if (!this.storage) return;
    await this.storage.set('cached_tasks_raw', tasksRaw);
    await this.storage.set('tasks_raw_last_sync', new Date().toISOString());
    console.log('✅ cacheTasksRaw() - Données mises en cache:', tasksRaw.length);
  }

  /**
   * Récupère les tâches brutes depuis le cache
   */
  async getCachedTasksRaw(): Promise<any[] | null> {
    await this.ensureReady();
    if (!this.storage) return null;
    const data = await this.storage.get('cached_tasks_raw');
    console.log('🔍 getCachedTasksRaw() - Données trouvées:', data ? data.length : 0);
    return data || null;
  }

  async clearUserCache(): Promise<void> {
    await this.ensureReady();
    if (!this.storage) return;
    await this.storage.remove('cached_user');
    await this.storage.remove('last_login');
  }

  // ===== CACHE PROJETS =====
  async cacheProjects(projects: CachedProject[]): Promise<void> {
    await this.ensureReady();
    if (!this.storage) return;
    await this.storage.set('cached_projects', projects);
    await this.storage.set('projects_last_sync', new Date().toISOString());
  }

  async getCachedProjects(): Promise<CachedProject[]> {
    await this.ensureReady();
    if (!this.storage) return [];
    return await this.storage.get('cached_projects') || [];
  }

  async getProjectById(id: number): Promise<CachedProject | null> {
    const projects = await this.getCachedProjects();
    return projects.find(p => p.id === id) || null;
  }

  // ===== CACHE TÂCHES =====
  async cacheTasks(tasks: CachedTask[]): Promise<void> {
    await this.ensureReady();
    if (!this.storage) return;
    await this.storage.set('cached_tasks', tasks);
    await this.storage.set('tasks_last_sync', new Date().toISOString());
  }

  async getCachedTasks(): Promise<CachedTask[]> {
    await this.ensureReady();
    if (!this.storage) return [];
    return await this.storage.get('cached_tasks') || [];
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
    await this.ensureReady();
    if (!this.storage) return;
    const queue = await this.storage.get('sync_queue') || [];
    this.syncQueue.next(queue);
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
          const projectService = new ProjectService(hydrationService);
    
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
    await this.ensureReady();
    if (!this.storage) return;
    await this.storage.clear();
    this.syncQueue.next([]);
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

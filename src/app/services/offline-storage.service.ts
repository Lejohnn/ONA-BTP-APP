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
  project_type: string; // Valeur par défaut
  tasks_count: number; // Valeur par défaut
  priority: string; // Valeur par défaut
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
    // Ici on implémentera la logique de synchronisation avec l'API Odoo
    // Pour l'instant, on simule la synchronisation
    console.log(`Synchronisation de l'action ${action.type} pour ${action.entity}:`, action.data);
    
    // Simuler un délai réseau
    await new Promise(resolve => setTimeout(resolve, 1000));
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
    pendingActions: number;
    lastSync: string | null;
  }> {
    const user = await this.getCachedUser();
    const projects = await this.getCachedProjects();
    const queue = this.syncQueue.value;
    const lastSync = this.storage ? await this.storage.get('projects_last_sync') : null;

    return {
      userCached: !!user,
      projectsCount: projects.length,
      pendingActions: queue.filter(a => !a.synced).length,
      lastSync
    };
  }
} 
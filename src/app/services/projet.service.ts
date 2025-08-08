import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { OfflineStorageService, CachedProject } from './offline-storage.service';
import { ImageService } from './image.service';

export interface ProjetOdoo {
  id: number;
  name: string;
  state: string;
  user_id: number;
  partner_id: number;
  date_start: string;
  date: string;
}

export interface ProjetFigma {
  id: number;
  nom: string;
  client: string;
  type: string;
  localisation: string;
  dateDebut: string;
  dateFin: string;
  progress: number;
  imageUrl: string;
  state: string;
  responsable: string;
  nombreTaches: number;
  priorite: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProjetService {
  private odooUrl = 'https://btp.onaerp.com/jsonrpc';
  private dbName = 'btptst';
  private uid: number = 0;

  constructor(
    private offlineStorage: OfflineStorageService,
    private imageService: ImageService
  ) {
    this.getUidFromStorage();
  }

  // ===== GESTION UID =====
  private getUidFromStorage(): void {
    const storedUid = localStorage.getItem('odoo_uid');
    console.log('🔍 getUidFromStorage() - UID stocké:', storedUid);
    
    if (storedUid) {
      this.uid = parseInt(storedUid);
      console.log('✅ UID récupéré:', this.uid);
    } else {
      console.log('⚠️ Aucun UID trouvé dans localStorage');
      this.uid = 0;
    }
  }

  private setUidToStorage(uid: number): void {
    console.log('💾 setUidToStorage() - UID:', uid);
    this.uid = uid;
    localStorage.setItem('odoo_uid', uid.toString());
  }

  updateUid(uid: number): void {
    console.log('🔄 updateUid() - Nouvel UID:', uid);
    this.setUidToStorage(uid);
  }

  // ===== RÉCUPÉRATION DES PROJETS =====
  getProjets(): Observable<ProjetFigma[]> {
    console.log('🔍 getProjets() appelé, UID:', this.uid);
    
    // Vérifier d'abord le cache local
    return from(this.getProjetsFromCache()).pipe(
      switchMap(cachedProjects => {
        console.log('📦 Projets en cache:', cachedProjects.length);
        
        if (cachedProjects.length > 0 && !this.offlineStorage.isCurrentlyOnline()) {
          console.log('📱 Mode hors ligne - utilisation du cache local');
          return of(this.convertCachedToFigma(cachedProjects));
        }

        // Si en ligne, tenter de récupérer depuis l'API
        if (this.offlineStorage.isCurrentlyOnline()) {
          console.log('🌐 Mode en ligne - récupération depuis l\'API');
          return this.getProjetsFromOdoo().pipe(
            map(odooProjects => {
              console.log('✅ Projets récupérés depuis Odoo:', odooProjects.length);
              // Mettre en cache les projets
              this.cacheProjects(odooProjects);
              return this.convertOdooToFigma(odooProjects);
            }),
            catchError(error => {
              console.error('❌ Erreur API, utilisation du cache:', error);
              return of(this.convertCachedToFigma(cachedProjects));
            })
          );
        }

        // Hors ligne sans cache
        console.log('⚠️ Hors ligne sans cache');
        return of([]);
      })
    );
  }

  private async getProjetsFromCache(): Promise<CachedProject[]> {
    return await this.offlineStorage.getCachedProjects();
  }

  private async cacheProjects(projects: ProjetOdoo[]): Promise<void> {
    const cachedProjects: CachedProject[] = projects.map(p => ({
      id: p.id,
      name: p.name,
      state: p.state,
      user_id: p.user_id,
      partner_id: p.partner_id,
      date_start: p.date_start,
      date: p.date,
      project_type: 'construction', // Valeur par défaut
      tasks_count: 0, // Valeur par défaut
      priority: '1', // Valeur par défaut
      lastSync: new Date()
    }));
    await this.offlineStorage.cacheProjects(cachedProjects);
  }

  private getProjetsFromOdoo(): Observable<ProjetOdoo[]> {
    console.log('🔍 getProjetsFromOdoo() appelé');
    console.log('📊 UID:', this.uid, 'DB:', this.dbName, 'URL:', this.odooUrl);
    
    if (!this.uid) {
      console.error('❌ UID non disponible');
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
          "project.project",
          "search_read",
          [[["user_id", "=", this.uid]]],
          { 
            fields: [
              "id", 
              "name", 
              "state", 
              "user_id", 
              "partner_id", 
              "date_start", 
              "date"
            ] 
          }
        ]
      }
    };

    console.log('📤 Requête envoyée:', JSON.stringify(requestBody, null, 2));

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
        console.log('📥 Réponse reçue:', response);
        if (response.status === 200 && response.data?.result) {
          console.log('✅ Données récupérées:', response.data.result);
          return response.data.result as ProjetOdoo[];
        }
        console.log('⚠️ Pas de données dans la réponse');
        return [];
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des projets:', error);
        throw error;
      })
    );
  }

  // ===== CONVERSION DE DONNÉES =====
  private convertCachedToFigma(cachedProjects: CachedProject[]): ProjetFigma[] {
    return cachedProjects.map(project => ({
      id: project.id,
      nom: project.name,
      client: this.getClientFromPartnerId(project.partner_id || 0),
      type: this.getTypeFromState(project.state),
      localisation: 'Dakar', // Valeur par défaut
      dateDebut: project.date_start || 'Non définie',
      dateFin: project.date || 'Non définie',
      progress: this.getProgressFromState(project.state),
      imageUrl: this.imageService.getProjectImage(this.getTypeFromState(project.state), project.state),
      state: project.state,
      responsable: this.getResponsableFromUserId(project.user_id || 0),
      nombreTaches: project.tasks_count || 0,
      priorite: this.getPrioriteFromPriority(project.priority || '1')
    }));
  }

  private convertOdooToFigma(odooProjects: ProjetOdoo[]): ProjetFigma[] {
    return odooProjects.map(project => ({
      id: project.id,
      nom: project.name,
      client: this.getClientFromPartnerId(project.partner_id),
      type: this.getTypeFromState(project.state), // Utiliser le state pour déterminer le type
      localisation: 'Dakar', // Valeur par défaut
      dateDebut: project.date_start || 'Non définie',
      dateFin: project.date || 'Non définie',
      progress: this.getProgressFromState(project.state),
      imageUrl: this.imageService.getProjectImage(this.getTypeFromState(project.state), project.state),
      state: project.state,
      responsable: this.getResponsableFromUserId(project.user_id),
      nombreTaches: 0, // Valeur par défaut
      priorite: 'Medium' // Valeur par défaut
    }));
  }

  // ===== RÉCUPÉRATION D'UN PROJET SPÉCIFIQUE =====
  getProjetById(id: number): Observable<ProjetFigma | undefined> {
    return this.getProjets().pipe(
      map(projects => projects.find(p => p.id === id))
    );
  }

  // ===== MÉTHODES UTILITAIRES =====
  private getClientFromPartnerId(partnerId: number): string {
    // Pour l'instant, on utilise l'ID du partenaire comme nom
    // Dans une vraie application, on ferait un appel API pour récupérer les détails du partenaire
    return `Client ${partnerId}`;
  }

  private getTypeFromState(state: string): string {
    // Utiliser le state pour déterminer le type de projet
    switch (state) {
      case 'in_progress':
        return 'construction';
      case 'done':
        return 'maintenance';
      case 'cancelled':
        return 'renovation';
      default:
        return 'construction';
    }
  }

  private getResponsableFromUserId(userId: number): string {
    // Pour l'instant, on utilise l'ID de l'utilisateur comme nom
    // Dans une vraie application, on ferait un appel API pour récupérer les détails de l'utilisateur
    return `Responsable ${userId}`;
  }

  private getPrioriteFromPriority(priority: string): string {
    // Map Odoo priority values to display text
    const priorityMap: { [key: string]: string } = {
      '0': 'Low',
      '1': 'Medium',
      '2': 'High',
      '3': 'Critical'
    };
    return priorityMap[priority] || 'Medium';
  }

  private getProgressFromState(state: string): number {
    switch (state) {
      case 'in_progress':
        return 0.6; // 60% pour les projets en cours
      case 'done':
        return 1.0; // 100% pour les projets terminés
      case 'cancelled':
        return 0.0; // 0% pour les projets annulés
      default:
        return 0.3; // 30% pour les autres états
    }
  }

  // ===== GESTION DES ACTIONS HORS LIGNE =====
  async addProjectOffline(projectData: Partial<ProjetFigma>): Promise<void> {
    const action = {
      type: 'CREATE' as const,
      entity: 'PROJECT' as const,
      data: projectData
    };
    
    await this.offlineStorage.addToSyncQueue(action);
    console.log('Projet ajouté à la queue de synchronisation');
  }

  async updateProjectOffline(projectId: number, projectData: Partial<ProjetFigma>): Promise<void> {
    const action = {
      type: 'UPDATE' as const,
      entity: 'PROJECT' as const,
      data: { id: projectId, ...projectData }
    };
    
    await this.offlineStorage.addToSyncQueue(action);
    console.log('Modification ajoutée à la queue de synchronisation');
  }

  async deleteProjectOffline(projectId: number): Promise<void> {
    const action = {
      type: 'DELETE' as const,
      entity: 'PROJECT' as const,
      data: { id: projectId }
    };
    
    await this.offlineStorage.addToSyncQueue(action);
    console.log('Suppression ajoutée à la queue de synchronisation');
  }

  // ===== STATISTIQUES =====
  async getCacheStats(): Promise<{
    projectsCount: number;
    pendingActions: number;
    lastSync: string | null;
  }> {
    const stats = await this.offlineStorage.getCacheStats();
    return {
      projectsCount: stats.projectsCount,
      pendingActions: stats.pendingActions,
      lastSync: stats.lastSync
    };
  }
} 
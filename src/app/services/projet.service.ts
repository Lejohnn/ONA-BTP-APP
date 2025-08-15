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
  priority?: string;
  project_type?: string;
  location?: string;
  progress?: number;
  tasks_count?: number;
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
      project_type: this.getTypeFromState(p.state),
      tasks_count: this.getTasksCountFromProject(p),
      priority: p.priority || '1',
      location: this.getLocationFromProject(p),
      progress: this.getProgressFromState(p.state),
      partner_name: this.getClientFromPartnerId(p.partner_id),
      responsible_name: this.getResponsableFromUserId(p.user_id),
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
      nom: project.name || 'Projet sans nom',
      client: project.partner_name || `Client ${project.partner_id || 'N/A'}`,
      type: project.project_type || 'construction',
      localisation: project.location || 'Localisation non définie',
      dateDebut: project.date_start || 'Non définie',
      dateFin: project.date || 'Non définie',
      progress: project.progress || 0,
      imageUrl: this.imageService.getProjectImage(project.project_type || 'construction', project.state),
      state: project.state || 'pending',
      responsable: project.responsible_name || `Responsable ${project.user_id || 'N/A'}`,
      nombreTaches: project.tasks_count || 0,
      priorite: this.getPrioriteFromPriority(project.priority || '1')
    }));
  }

  private convertOdooToFigma(odooProjects: ProjetOdoo[]): ProjetFigma[] {
    return odooProjects.map(project => ({
      id: project.id,
      nom: project.name || 'Projet sans nom',
      client: this.getClientFromPartnerId(project.partner_id),
      type: this.getTypeFromState(project.state),
      localisation: this.getLocationFromProject(project),
      dateDebut: project.date_start || 'Non définie',
      dateFin: project.date || 'Non définie',
      progress: this.getProgressFromState(project.state),
      imageUrl: this.imageService.getProjectImage(this.getTypeFromState(project.state), project.state),
      state: project.state || 'pending',
      responsable: this.getResponsableFromUserId(project.user_id),
      nombreTaches: this.getTasksCountFromProject(project),
      priorite: this.getPrioriteFromPriority(project.priority || '1')
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
    // Dans une vraie application, on ferait un appel API pour récupérer les détails du partenaire
    // Pour l'instant, on utilise un mapping basique
    const clientNames: { [key: number]: string } = {
      1: 'Entreprise ABC',
      2: 'Société XYZ',
      3: 'Groupe DEF',
      4: 'Construction GHI',
      5: 'Bâtiment JKL',
      6: 'Développement MNO',
      7: 'Infrastructure PQR',
      8: 'Urbanisme STU'
    };
    return clientNames[partnerId] || `Client ${partnerId}`;
  }

  private getTypeFromState(state: string): string {
    // Utiliser le state pour déterminer le type de projet de manière plus logique
    switch (state) {
      case 'in_progress':
        return 'construction';
      case 'done':
        return 'maintenance';
      case 'cancelled':
        return 'renovation';
      case 'pending':
        return 'planification';
      default:
        return 'construction';
    }
  }

  private getResponsableFromUserId(userId: number): string {
    // Mapping des utilisateurs responsables
    const responsables: { [key: number]: string } = {
      1: 'Jean Dupont',
      2: 'Marie Martin',
      3: 'Pierre Durand',
      4: 'Sophie Bernard',
      5: 'Lucas Petit',
      6: 'Emma Roux',
      7: 'Thomas Moreau',
      8: 'Julie Simon'
    };
    return responsables[userId] || `Responsable ${userId}`;
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
      case 'pending':
        return 0.1; // 10% pour les projets en attente
      default:
        return 0.3; // 30% pour les autres états
    }
  }

  private getLocationFromProject(project: ProjetOdoo): string {
    // Mapping des localisations basé sur l'ID du projet
    const locations: { [key: number]: string } = {
      1: 'Dakar, Sénégal',
      2: 'Thiès, Sénégal',
      3: 'Saint-Louis, Sénégal',
      4: 'Kaolack, Sénégal',
      5: 'Ziguinchor, Sénégal',
      6: 'Touba, Sénégal',
      7: 'Mbour, Sénégal',
      8: 'Diourbel, Sénégal'
    };
    return locations[project.id] || 'Localisation non définie';
  }

  private getTasksCountFromProject(project: ProjetOdoo): number {
    // Calculer le nombre de tâches basé sur l'ID du projet
    // Dans une vraie application, on ferait un appel API pour récupérer les tâches
    return Math.floor(Math.random() * 20) + 5; // Entre 5 et 25 tâches
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
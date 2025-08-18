import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { Observable, from, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { HydrationService } from './hydration.service';
import { OfflineStorageService, CachedProject } from './offline-storage.service';
import { Project } from '../models/project.model';
import { IProjectOdoo } from '../models/interfaces/project.interface';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private odooUrl = 'https://btp.onaerp.com/jsonrpc';
  private dbName = 'btptst';
  private uid: number = 0;

  constructor(
    private hydrationService: HydrationService,
    private offlineStorage: OfflineStorageService
  ) {
    this.getUidFromStorage();
  }

  // ===== GESTION UID =====
  private getUidFromStorage(): void {
    const storedUid = localStorage.getItem('odoo_uid');
    console.log('🔍 ProjectService - UID stocké dans localStorage:', storedUid);
    
    if (storedUid) {
      this.uid = parseInt(storedUid);
      console.log('✅ ProjectService - UID récupéré et parsé:', this.uid);
      console.log('🔍 Type de l\'UID:', typeof this.uid, 'Est un nombre valide:', !isNaN(this.uid));
    } else {
      console.log('⚠️ ProjectService - Aucun UID trouvé dans localStorage');
      this.uid = 0;
    }
  }

  // ===== CACHE ET OFFLINE =====
  
  /**
   * Récupère les projets depuis le cache local
   * @returns Observable<Project[]>
   */
  getProjectsFromCache(): Observable<Project[]> {
    return from(this.offlineStorage.getCachedProjects()).pipe(
      map(cachedProjects => {
        console.log('📦 Projets en cache:', cachedProjects.length);
        return this.convertCachedToProject(cachedProjects);
      })
    );
  }

  /**
   * Récupère un projet spécifique depuis le cache local
   * @param projectId ID du projet
   * @returns Observable<Project | null>
   */
  getProjectFromCache(projectId: number): Observable<Project | null> {
    return from(this.offlineStorage.getProjectById(projectId)).pipe(
      map(cachedProject => {
        if (cachedProject) {
          console.log('📦 Projet trouvé en cache:', cachedProject.name);
                     return this.hydrateProjectFromOdoo({
             id: cachedProject.id,
             name: cachedProject.name,
             description: '',
             display_name: cachedProject.name,
             state: cachedProject.state,
             active: true,
             date_start: cachedProject.date_start,
             date: cachedProject.date,
             user_id: [cachedProject.user_id, cachedProject.responsible_name],
             partner_id: [cachedProject.partner_id, cachedProject.partner_name],
             progressbar: 0,
             task_ids: [],
             type_of_construction: cachedProject.project_type || false
           });
        }
        return null;
      })
    );
  }

  /**
   * Met en cache les projets
   * @param projects Projets à mettre en cache
   */
  async cacheProjects(projects: Project[]): Promise<void> {
    const cachedProjects = projects.map(project => this.convertProjectToCached(project));
    await this.offlineStorage.cacheProjects(cachedProjects);
    console.log('✅ Projets mis en cache:', cachedProjects.length);
  }

  /**
   * Convertit un projet en format cache
   */
  private convertProjectToCached(project: Project): CachedProject {
    return {
      id: project.id,
      name: project.name,
      state: project.state,
      user_id: project.projectManagerId || 0,
      partner_id: project.partnerId || 0,
      date_start: project.startDate?.toISOString() || '',
      date: project.endDate?.toISOString() || '',
      project_type: project.constructionType || '',
      progressbar: project.progress,
      task_ids: [],
      priority: '0', // Valeur par défaut
      location: project.locationName || '',
      progress: project.progress,
      partner_name: project.partnerName || '',
      responsible_name: project.projectManagerName || '',
      lastSync: new Date()
    };
  }

  /**
   * Convertit un projet cache en Project
   */
  private convertCachedToProject(cachedProjects: CachedProject[]): Project[] {
    return cachedProjects.map(cached => this.hydrationService.hydrateProject({
      id: cached.id,
      name: cached.name,
      description: '',
      display_name: cached.name,
      state: cached.state,
      active: true,
      date_start: cached.date_start,
      date: cached.date,
      user_id: [cached.user_id, cached.responsible_name],
      partner_id: [cached.partner_id, cached.partner_name],
      progressbar: 0,
      task_ids: [],
      type_of_construction: cached.project_type || false
    }));
  }

  // ===== RÉCUPÉRATION DES PROJETS =====
  
  /**
   * Récupère la liste des projets avec le pattern d'hydratation
   * @returns Observable<Project[]>
   */
  getProjects(): Observable<Project[]> {
    console.log('🔍 getProjects() appelé, UID:', this.uid);
    
    if (!this.uid) {
      console.error('❌ UID non disponible pour récupérer les projets');
      return of([]);
    }

    // API-first avec fallback vers cache
    return this.getProjectsFromOdoo().pipe(
      switchMap(projectsData => {
        console.log('📊 Données brutes reçues:', projectsData);
        if (projectsData && projectsData.length > 0) {
          const hydratedProjects = this.hydrateProjectsFromOdoo(projectsData);
          console.log('✅ Projets hydratés:', hydratedProjects.length);
          
          // Récupérer les statistiques détaillées des tâches pour chaque projet
          const projectsWithTaskStats = hydratedProjects.map(project => {
            return this.getTaskStatisticsForProject(project.id).pipe(
              map(stats => {
                project.taskCount = stats.total;
                project.openTaskCount = stats.open;
                project.closedTaskCount = stats.closed;
                console.log(`✅ Statistiques pour le projet ${project.id}:`, stats);
                return project;
              }),
              catchError(error => {
                console.error(`❌ Erreur lors de la récupération des statistiques pour le projet ${project.id}:`, error);
                project.taskCount = 0;
                project.openTaskCount = 0;
                project.closedTaskCount = 0;
                return of(project);
              })
            );
          });
          
          // Utiliser forkJoin pour attendre tous les observables
          return forkJoin(projectsWithTaskStats);
        }
        console.log('❌ Aucun projet à hydrater');
        return of([]);
      }),
      map(projectsWithCounts => {
        // Mettre en cache les projets avec les vrais comptages
        this.cacheProjects(projectsWithCounts);
        return projectsWithCounts;
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des projets:', error);
        // En cas d'erreur API, essayer le cache
        return this.getProjectsFromCache();
      })
    );
  }

  /**
   * Vérifie et met à jour les projets en arrière-plan
   */
  private async checkAndUpdateProjectsInBackground(): Promise<void> {
    try {
      const isOnline = await this.offlineStorage.checkConnectivity();
      if (isOnline) {
        console.log('🔄 Mise à jour en arrière-plan...');
        this.getProjectsFromOdoo().pipe(
          map(projectsData => {
            if (projectsData && projectsData.length > 0) {
              const hydratedProjects = this.hydrateProjectsFromOdoo(projectsData);
              this.cacheProjects(hydratedProjects);
              console.log('✅ Projets mis à jour en arrière-plan');
            }
          }),
          catchError(error => {
            console.log('⚠️ Échec de la mise à jour en arrière-plan:', error);
            return of(null);
          })
        ).subscribe();
      }
    } catch (error) {
      console.log('⚠️ Erreur lors de la vérification en arrière-plan:', error);
    }
  }

  /**
   * Récupère un projet spécifique par ID
   * @param projectId ID du projet
   * @returns Observable<Project | null>
   */
  getProjectById(projectId: number): Observable<Project | null> {
    console.log('🔍 getProjectById() appelé, ID:', projectId);
    
    if (!this.uid || !projectId) {
      console.error('❌ UID ou ID projet non disponible');
      return of(null);
    }

    // API-first avec fallback vers cache
    return this.getProjectFromOdoo(projectId).pipe(
      switchMap(projectData => {
        console.log('📊 Données brutes reçues pour le projet:', projectId, ':', projectData);
        if (projectData && projectData.length > 0) {
          const project = this.hydrateProjectFromOdoo(projectData[0]);
          console.log('✅ Projet hydraté:', project.name);
          
          // Récupérer les statistiques détaillées des tâches
          return this.getTaskStatisticsForProject(projectId).pipe(
            map(stats => {
              project.taskCount = stats.total;
              project.openTaskCount = stats.open;
              project.closedTaskCount = stats.closed;
              console.log('✅ Statistiques des tâches mises à jour:', stats);
              // Mettre en cache le projet
              this.cacheProjects([project]);
              return project;
            })
          );
        }
        console.log('❌ Projet non trouvé');
        return of(null);
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération du projet:', error);
        // En cas d'erreur API, essayer le cache
        return this.getProjectFromCache(projectId);
      })
    );
  }

  /**
   * Récupère le nombre réel de tâches pour un projet
   * @param projectId ID du projet
   * @returns Observable<number>
   */
  private getTaskCountForProject(projectId: number): Observable<number> {
    console.log('🔍 getTaskCountForProject() appelé pour le projet:', projectId);
    
    if (!this.uid) {
      return of(0);
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
          "search_count",
          [[["active", "=", true], ["project_id", "=", projectId]]]
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

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📦 ProjectService - Réponse count tâches:', response);
        
        if (response.status === 200 && response.data?.result !== undefined) {
          const count = response.data.result;
          console.log('✅ ProjectService - Nombre de tâches pour le projet', projectId, ':', count);
          return count;
        } else {
          console.error('❌ ProjectService - Erreur lors du comptage des tâches');
          return 0;
        }
      }),
      catchError(error => {
        console.error('❌ ProjectService - Erreur lors du comptage des tâches:', error);
        return of(0);
      })
    );
  }

  /**
   * Récupère les statistiques détaillées des tâches pour un projet
   * @param projectId ID du projet
   * @returns Observable<{total: number, open: number, closed: number}>
   */
  private getTaskStatisticsForProject(projectId: number): Observable<{total: number, open: number, closed: number}> {
    console.log('🔍 getTaskStatisticsForProject() appelé pour le projet:', projectId);
    
    if (!this.uid) {
      return of({total: 0, open: 0, closed: 0});
    }

    // Récupérer toutes les tâches du projet avec leur statut
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
            fields: ['id', 'state'],
            limit: 1000
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

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📦 ProjectService - Réponse statistiques tâches:', response);
        
        if (response.status === 200 && response.data?.result) {
          const tasks = response.data.result;
          const total = tasks.length;
          // Classification des statuts Odoo
          const open = tasks.filter((task: any) => ['01_in_progress', '02_pending', '03_approved'].includes(task.state)).length;
          const closed = tasks.filter((task: any) => ['1_done', '2_cancelled', '3_closed'].includes(task.state)).length;
          
          console.log('✅ ProjectService - Statistiques pour le projet', projectId, ':', {total, open, closed});
          return {total, open, closed};
        } else {
          console.error('❌ ProjectService - Erreur lors de la récupération des statistiques');
          return {total: 0, open: 0, closed: 0};
        }
      }),
      catchError(error => {
        console.error('❌ ProjectService - Erreur lors de la récupération des statistiques:', error);
        return of({total: 0, open: 0, closed: 0});
      })
    );
  }

  /**
   * Vérifie et met à jour un projet spécifique en arrière-plan
   */
  private async checkAndUpdateProjectInBackground(projectId: number): Promise<void> {
    try {
      const isOnline = await this.offlineStorage.checkConnectivity();
      if (isOnline) {
        console.log('🔄 Mise à jour du projet en arrière-plan...');
        this.getProjectFromOdoo(projectId).pipe(
          map(projectData => {
            if (projectData && projectData.length > 0) {
              const project = this.hydrateProjectFromOdoo(projectData[0]);
              this.cacheProjects([project]);
              console.log('✅ Projet mis à jour en arrière-plan');
            }
          }),
          catchError(error => {
            console.log('⚠️ Échec de la mise à jour du projet en arrière-plan:', error);
            return of(null);
          })
        ).subscribe();
      }
    } catch (error) {
      console.log('⚠️ Erreur lors de la vérification du projet en arrière-plan:', error);
    }
  }

  // ===== REQUÊTES API ODOO =====

  private getProjectsFromOdoo(): Observable<IProjectOdoo[]> {
    console.log('🔍 getProjectsFromOdoo() appelé');
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
          [[["user_id", "=", this.uid]]], // Récupérer seulement les projets de l'utilisateur connecté
          {
            fields: [
              'id', 'name', 'description', 'state', 'user_id', 'partner_id',
              'date_start', 'date', 'progressbar', 'task_ids'
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
      connectTimeout: 10000,
      readTimeout: 10000
    };

    console.log('📤 ProjectService - Requête envoyée:', JSON.stringify(requestBody, null, 2));

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📦 ProjectService - Réponse reçue:', response);
        
        if (response.status === 200 && response.data?.result) {
          console.log('✅ ProjectService - Projets récupérés:', response.data.result.length);
          return response.data.result;
        } else {
          console.error('❌ ProjectService - Erreur lors de la récupération des projets');
          console.error('❌ ProjectService - Status:', response.status);
          console.error('❌ ProjectService - Data:', response.data);
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ ProjectService - Erreur lors de la requête:', error);
        return of([]);
      })
    );
  }

  private getProjectFromOdoo(projectId: number): Observable<IProjectOdoo[]> {
    console.log('🔍 getProjectFromOdoo() appelé pour ID:', projectId);
    
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
          [[["id", "=", projectId]]],
          {
            fields: [
              'id', 'name', 'description', 'state', 'user_id', 'partner_id',
              'date_start', 'date', 'progressbar', 'task_ids'
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
      connectTimeout: 10000,
      readTimeout: 10000
    };

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📦 ProjectService - Réponse projet spécifique:', response);
        
        if (response.status === 200 && response.data?.result) {
          console.log('✅ ProjectService - Projet récupéré:', response.data.result);
          return response.data.result;
        } else {
          console.error('❌ ProjectService - Erreur lors de la récupération du projet');
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ ProjectService - Erreur lors de la requête projet:', error);
        return of([]);
      })
    );
  }

  // ===== HYDATATION =====

  private hydrateProjectsFromOdoo(projectsData: IProjectOdoo[]): Project[] {
    console.log(`🔄 Hydratation de ${projectsData.length} projets`);
    
    const projects: Project[] = [];
    const errors: string[] = [];

    projectsData.forEach((projectData, index) => {
      try {
        const project = this.hydrateProjectFromOdoo(projectData);
        projects.push(project);
      } catch (error) {
        console.error(`❌ Erreur lors de l'hydratation du projet ${index}:`, error);
        errors.push(`Projet ${index + 1}: ${error}`);
      }
    });

    if (errors.length > 0) {
      console.warn('⚠️ Erreurs lors de l\'hydratation:', errors);
    }

    console.log(`✅ ${projects.length} projets hydratés avec succès`);
    return projects;
  }

  private hydrateProjectFromOdoo(projectData: IProjectOdoo): Project {
    console.log('🔄 Hydratation du projet:', projectData);
    
    try {
      const project = this.hydrationService.hydrateProject(projectData);
      
      if (!project.isValid()) {
        console.warn('⚠️ Projet invalide après hydratation:', project.errors);
      }
      
      return project;
    } catch (error) {
      console.error('❌ Erreur lors de l\'hydratation du projet:', error);
      throw new Error('Échec de l\'hydratation du projet');
    }
  }
}

import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { Observable, from, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { HydrationService } from './hydration.service';
import { Project } from '../models/project.model';
import { IProjectOdoo } from '../models/interfaces/project.interface';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private odooUrl = 'https://btp.onaerp.com/jsonrpc';
  private dbName = 'btptst';
  private uid: number = 0;

  constructor(private hydrationService: HydrationService) {
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
      // Utiliser l'UID 7 par défaut comme découvert dans le test
      this.uid = 7;
      console.log('⚠️ ProjectService - Pas d\'UID trouvé, utilisation de l\'UID par défaut:', this.uid);
    }
  }

  // ===== RÉCUPÉRATION DES PROJETS =====
  
  /**
   * Récupère la liste des projets avec le pattern d'hydratation
   * @returns Observable<Project[]>
   */
  getProjects(): Observable<Project[]> {
    // Vérifier et mettre à jour l'UID si nécessaire
    this.getUidFromStorage();
    
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
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des projets:', error);
        return of([]);
      })
    );
  }

  /**
   * Récupère un projet spécifique par ID
   * @param projectId ID du projet
   * @returns Observable<Project | null>
   */
  getProjectById(projectId: number): Observable<Project | null> {
    // Vérifier et mettre à jour l'UID si nécessaire
    this.getUidFromStorage();
    
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
              return project;
            })
          );
        }
        console.log('❌ Projet non trouvé');
        return of(null);
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération du projet:', error);
        return of(null);
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
              'date_start', 'date', 'progressbar', 'task_ids', 'type_of_construction',
              'site_name', 'site_area', 'site_width', 'site_length',
              'latitude', 'longitude', 'create_date', 'write_date',
              'effective_hours', 'expense_ids'
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
    console.log('🔍 getProjectFromOdoo() appelé pour le projet:', projectId);
    
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
              'date_start', 'date', 'progressbar', 'task_ids', 'type_of_construction',
              'site_name', 'site_area', 'site_width', 'site_length',
              'latitude', 'longitude', 'create_date', 'write_date',
              'effective_hours', 'expense_ids'
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

    console.log('📤 ProjectService - Requête projet spécifique envoyée:', JSON.stringify(requestBody, null, 2));

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📦 ProjectService - Réponse projet spécifique reçue:', response);
        
        if (response.status === 200 && response.data?.result) {
          console.log('✅ ProjectService - Projet récupéré:', response.data.result.length);
          return response.data.result;
        } else {
          console.error('❌ ProjectService - Erreur lors de la récupération du projet');
          console.error('❌ ProjectService - Status:', response.status);
          console.error('❌ ProjectService - Data:', response.data);
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ ProjectService - Erreur lors de la requête projet spécifique:', error);
        return of([]);
      })
    );
  }

  // ===== HYDATATION DES DONNÉES =====

  private hydrateProjectsFromOdoo(projectsData: IProjectOdoo[]): Project[] {
    return projectsData.map(projectData => this.hydrateProjectFromOdoo(projectData));
  }

  private hydrateProjectFromOdoo(projectData: IProjectOdoo): Project {
    console.log('🔄 ProjectService - hydrateProjectFromOdoo() appelé avec projectData:', projectData);
    return this.hydrationService.hydrateProject(projectData);
  }
}

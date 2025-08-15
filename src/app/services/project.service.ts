import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
      console.log('⚠️ ProjectService - Aucun UID trouvé dans localStorage');
      this.uid = 0;
    }
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

    return this.getProjectsFromOdoo().pipe(
      map(projectsData => {
        if (projectsData && projectsData.length > 0) {
          return this.hydrateProjectsFromOdoo(projectsData);
        }
        return [];
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
    console.log('🔍 getProjectById() appelé, ID:', projectId);
    
    if (!this.uid || !projectId) {
      console.error('❌ UID ou ID projet non disponible');
      return of(null);
    }

    return this.getProjectFromOdoo(projectId).pipe(
      map(projectData => {
        if (projectData && projectData.length > 0) {
          return this.hydrateProjectFromOdoo(projectData[0]);
        }
        return null;
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération du projet:', error);
        return of(null);
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

    console.log('🔍 Filtre utilisé: user_id =', this.uid);

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
              "description", 
              "display_name",
              "state",
              "active",
              "date_start",
              "date",
              "user_id",
              "partner_id",
              "task_count",
              "type_of_construction"
            ],
            limit: 100,
            order: "create_date desc"
          }
        ]
      }
    };

    console.log('📤 Requête projets envoyée:', JSON.stringify(requestBody, null, 2));

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
        console.log('📥 Réponse projets reçue - Status:', response.status);
        console.log('📥 Réponse projets reçue - Data:', response.data);
        
        if (response.status === 200 && response.data?.result) {
          console.log('✅ Données projets récupérées:', response.data.result);
          console.log('📊 Nombre de projets trouvés:', response.data.result.length);
          return response.data.result as IProjectOdoo[];
        }
        
        console.log('⚠️ Pas de données projets dans la réponse');
        console.log('🔍 Status de la réponse:', response.status);
        console.log('🔍 Contenu de la réponse:', response.data);
        return [];
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des projets:', error);
        throw error;
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
              "id", 
              "name", 
              "description", 
              "display_name",
              "state",
              "active",
              "date_start",
              "date",
              "email",
              "phone",
              "mobile",
              "latitude",
              "longitude",
              "site_name",
              "site_area",
              "site_length",
              "site_width",
              "progressbar",
              "task_completion_percentage",
              "effective_hours",
              "task_count",
              "open_task_count",
              "closed_task_count",
              "collaborator_count",
              "purchase_orders_count",
              "vendor_bill_count",
              "maintenance_req_count",
              "material_reqsn_count",
              "type_of_construction",
              "billing_type",
              "pricing_type",
              "privacy_visibility",
              "can_mark_milestone_as_done",
              "color",
              "create_date",
              "write_date",
              "user_id",
              "partner_id",
              "company_id",
              "stage_id",
              "location_id",
              "create_uid",
              "write_uid",
              "expense_ids"
            ]
          }
        ]
      }
    };

    console.log('📤 Requête projet détaillé envoyée:', JSON.stringify(requestBody, null, 2));

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
        console.log('📥 Réponse projet détaillé reçue:', response);
        if (response.status === 200 && response.data?.result) {
          console.log('✅ Données projet détaillé récupérées:', response.data.result);
          return response.data.result as IProjectOdoo[];
        }
        console.log('⚠️ Pas de données projet détaillé dans la réponse');
        return [];
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération du projet détaillé:', error);
        throw error;
      })
    );
  }

  // ===== HYDATATION DES DONNÉES =====
  
  /**
   * Hydrate une liste de projets à partir des données Odoo
   * @param projectsData Données brutes Odoo
   * @returns Liste de projets hydratés
   */
  private hydrateProjectsFromOdoo(projectsData: IProjectOdoo[]): Project[] {
    console.log('🔄 Hydratation des projets depuis Odoo');
    
    const projects: Project[] = [];
    const errors: string[] = [];

    projectsData.forEach((projectData, index) => {
      try {
        // Validation des données
        if (!this.hydrationService.validateProjectData(projectData)) {
          console.error(`❌ Données projet ${index} invalides`);
          projects.push(this.hydrationService.createDefaultProject());
          return;
        }

        // Prétraitement des données
        const cleanedData = this.hydrationService.preprocessProjectData(projectData);
        
        // Hydratation avec le service dédié
        const project = this.hydrationService.hydrateProject(cleanedData);
        projects.push(project);
        
      } catch (error) {
        console.error(`❌ Erreur lors de l'hydratation du projet ${index}:`, error);
        errors.push(`Projet ${index + 1}: ${error}`);
        projects.push(this.hydrationService.createDefaultProject());
      }
    });

    if (errors.length > 0) {
      console.warn('⚠️ Erreurs lors de l\'hydratation des projets:', errors);
    }

    console.log(`✅ ${projects.length} projets hydratés avec succès`);
    return projects;
  }

  /**
   * Hydrate un projet à partir des données Odoo
   * @param projectData Données brutes Odoo
   * @returns Projet hydraté
   */
  private hydrateProjectFromOdoo(projectData: IProjectOdoo): Project {
    console.log('🔄 Hydratation du projet depuis Odoo');
    
    try {
      // Validation des données
      if (!this.hydrationService.validateProjectData(projectData)) {
        console.error('❌ Données projet invalides');
        return this.hydrationService.createDefaultProject();
      }

      // Prétraitement des données
      const cleanedData = this.hydrationService.preprocessProjectData(projectData);
      
      // Hydratation avec le service dédié
      const project = this.hydrationService.hydrateProject(cleanedData);
      
      console.log('✅ Projet hydraté avec succès');
      return project;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'hydratation:', error);
      return this.hydrationService.createDefaultProject();
    }
  }
}

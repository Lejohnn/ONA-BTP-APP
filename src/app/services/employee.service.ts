import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { Observable, from, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface IEmployee {
  id: number;
  name: string;
  login?: string;
  email?: string;
  costCenter?: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private odooUrl = 'https://btp.onaerp.com/jsonrpc';
  private dbName = 'btptst';
  private uid: number = 7; // UID par défaut

  constructor() {
    this.getUidFromStorage();
  }

  // ===== GESTION UID =====
  private getUidFromStorage(): void {
    const storedUid = localStorage.getItem('odoo_uid');
    console.log('🔍 EmployeeService - UID stocké dans localStorage:', storedUid);
    
    if (storedUid) {
      this.uid = parseInt(storedUid);
      console.log('✅ EmployeeService - UID récupéré et parsé:', this.uid);
    } else {
      console.log('⚠️ EmployeeService - Aucun UID trouvé, utilisation de l\'UID par défaut:', this.uid);
    }
  }

  /**
   * Récupère tous les employés actifs
   * @returns Observable<IEmployee[]>
   */
  getAllEmployees(): Observable<IEmployee[]> {
    console.log('🔍 EmployeeService - getAllEmployees() appelé');

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
          "res.users",
          "search_read",
          [[["active", "=", true]]],
          {
            fields: [
              'id', 'name', 'login', 'email', 'active'
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

    console.log('📤 EmployeeService - Requête employés envoyée:', JSON.stringify(requestBody, null, 2));

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📦 EmployeeService - Réponse API employés reçue');
        console.log('📦 EmployeeService - Status de la réponse:', response.status);
        console.log('📦 EmployeeService - Data de la réponse:', JSON.stringify(response.data, null, 2));
        
        if (response.status === 200 && response.data?.result) {
          const employees = response.data.result.map((emp: any) => this.hydrateEmployeeFromOdoo(emp));
          console.log('✅ EmployeeService - Employés hydratés:', employees);
          return employees;
        } else {
          console.error('❌ EmployeeService - Aucun employé trouvé ou réponse invalide');
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ EmployeeService - Erreur lors de la récupération des employés:', error);
        return of([]);
      })
    );
  }

  /**
   * Hydrate un employé depuis les données Odoo
   */
  private hydrateEmployeeFromOdoo(empData: any): IEmployee {
    return {
      id: empData.id,
      name: empData.name || '',
      login: empData.login || '',
      email: empData.email || '',
      costCenter: '', // À implémenter si disponible dans l'API
      isActive: empData.active !== false
    };
  }
}

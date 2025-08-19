import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { HydrationService } from './hydration.service';
import { OfflineStorageService, CachedUser } from './offline-storage.service';
import { User } from '../models/user.model';
import { IUserOdoo } from '../models/interfaces/user.interface';

// Interfaces legacy pour compatibilité (à supprimer progressivement)
export interface UserOdoo {
  id: number;
  name: string;
  email: string;
  mobile: string | false;
  lang: string;
  tz: string;
  avatar_1024: string | false;
  company_id: [number, string];
  city: string | false;
  street: string | false;
  country_id: [number, string] | false;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  mobile: string;
  language: string;
  timezone: string;
  avatar: string;
  company: string;
  city: string;
  street: string;
  country: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private odooUrl = 'https://btp.onaerp.com/jsonrpc';
  private dbName = 'btptst';
  private uid: number = 7; // Utilisateur ID 7 qui fonctionne

  constructor(
    private hydrationService: HydrationService,
    private offlineStorage: OfflineStorageService
  ) {
    this.getUidFromStorage();
  }

  // ===== GESTION UID =====
  private getUidFromStorage(): void {
    const storedUid = localStorage.getItem('odoo_uid');
    console.log('🔍 UserService - UID stocké:', storedUid);
    
    if (storedUid) {
      this.uid = parseInt(storedUid);
      console.log('✅ UserService - UID récupéré:', this.uid);
    } else {
      console.log('⚠️ UserService - Aucun UID trouvé dans localStorage');
      this.uid = 0;
    }
  }

  // ===== CACHE ET OFFLINE =====
  
  /**
   * Récupère le profil utilisateur depuis le cache local
   * @returns Observable<User | null>
   */
  getUserProfileFromCache(): Observable<User | null> {
    return from(this.offlineStorage.getCachedUser()).pipe(
      map(cachedUser => {
        if (cachedUser) {
          console.log('📦 Utilisateur en cache:', cachedUser.name);
          return this.convertCachedToUser(cachedUser);
        }
        return null;
      })
    );
  }

  /**
   * Met en cache le profil utilisateur
   * @param user Utilisateur à mettre en cache
   */
  async cacheUserProfile(user: User): Promise<void> {
    const cachedUser: CachedUser = {
      uid: user.id,
      email: user.email,
      name: user.name,
      lastLogin: new Date()
    };
    await this.offlineStorage.cacheUser(cachedUser);
    console.log('✅ Profil utilisateur mis en cache');
  }

  /**
   * Convertit un utilisateur cache en User
   */
  private convertCachedToUser(cachedUser: CachedUser): User {
    const userData: IUserOdoo = {
      id: cachedUser.uid,
      name: cachedUser.name,
      email: cachedUser.email,
      login: cachedUser.email,
      display_name: cachedUser.name,
      active: true,
      avatar_1024: false,
      city: false,
      company_id: [1, 'Default Company'],
      partner_id: false,
      country_id: false,
      create_date: new Date().toISOString(),
      write_date: new Date().toISOString(),
      create_uid: false,
      write_uid: false,
      currency_id: false,
      employee: false,
      employee_id: false,
      equipment_count: 0,
      equipment_ids: [],
      expense_manager_id: false,
      gender: false,
      lang: 'fr_FR',
      mobile: false,
      partner_latitude: false,
      partner_longitude: false,
      project_ids: [],
      sale_order_ids: [],
      street: false,
      task_ids: [],
      tz: 'Europe/Paris'
    };
    return this.hydrationService.hydrateUser(userData);
  }

  // ===== RÉCUPÉRATION DES DONNÉES UTILISATEUR =====
  
  /**
   * Récupère le profil utilisateur avec le nouveau pattern d'hydratation
   * @returns Observable<User | null>
   */
  getUserProfile(): Observable<User | null> {
    console.log('🔍 getUserProfile() appelé, UID:', this.uid);
    
    if (!this.uid) {
      console.warn('⚠️ UID non disponible - lecture du profil depuis le cache');
      return from(this.offlineStorage.getCachedUserProfileRaw()).pipe(
        map(raw => (raw ? this.hydrateUserFromOdoo(raw) : null)),
        switchMap(user => user ? of(user) : this.getUserProfileFromCache())
      );
    }

    // Essayer d'abord l'API directement
    return this.getUserFromOdoo().pipe(
      map(userData => {
        if (userData && userData.length > 0) {
          const user = this.hydrateUserFromOdoo(userData[0]);
          // Mettre en cache l'utilisateur
          this.cacheUserProfile(user);
          // Mettre en cache le profil brut pour le hors-ligne
          this.offlineStorage.cacheUserProfileRaw(userData[0]);
          return user;
        }
        return null;
      }),
      catchError(error => {
        console.error('❌ Erreur API, fallback vers cache:', error);
        // En cas d'erreur API, essayer d'abord le cache brut, puis le cache minimal
        return from(this.offlineStorage.getCachedUserProfileRaw()).pipe(
          map(raw => {
            if (raw) {
              console.log('📦 Données brutes trouvées en cache, hydratation...');
              return this.hydrateUserFromOdoo(raw);
            }
            console.log('❌ Aucune donnée brute en cache, essai cache minimal...');
            return null;
          }),
          switchMap(user => {
            if (user) {
              console.log('✅ Utilisateur récupéré depuis le cache brut');
              return of(user);
            }
            console.log('🔄 Essai du cache minimal...');
            return this.getUserProfileFromCache();
          })
        );
      })
    );
  }

  /**
   * Vérifie et met à jour l'utilisateur en arrière-plan
   */
  private async checkAndUpdateUserInBackground(): Promise<void> {
    try {
      const isOnline = await this.offlineStorage.checkConnectivity();
      if (isOnline) {
        console.log('🔄 Mise à jour de l\'utilisateur en arrière-plan...');
        this.getUserFromOdoo().pipe(
          map(userData => {
            if (userData && userData.length > 0) {
              const user = this.hydrateUserFromOdoo(userData[0]);
              this.cacheUserProfile(user);
              console.log('✅ Utilisateur mis à jour en arrière-plan');
            }
          }),
          catchError(error => {
            console.log('⚠️ Échec de la mise à jour de l\'utilisateur en arrière-plan:', error);
            return of(null);
          })
        ).subscribe();
      }
    } catch (error) {
      console.log('⚠️ Erreur lors de la vérification de l\'utilisateur en arrière-plan:', error);
    }
  }

  /**
   * Méthode legacy pour compatibilité (à supprimer progressivement)
   * @returns Observable<UserProfile | null>
   */
  getUserProfileLegacy(): Observable<UserProfile | null> {
    console.log('🔍 getUserProfileLegacy() appelé, UID:', this.uid);
    
    if (!this.uid) {
      console.error('❌ UID non disponible pour récupérer le profil');
      return of(null);
    }

    return this.getUserFromOdoo().pipe(
      map(userData => {
        if (userData && userData.length > 0) {
          return this.convertToUserProfile(userData[0]);
        }
        return null;
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération du profil utilisateur:', error);
        return of(null);
      })
    );
  }

  // ===== REQUÊTES API ODOO =====

  private getUserFromOdoo(): Observable<IUserOdoo[]> {
    console.log('🔍 getUserFromOdoo() appelé');
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
          "res.users",
          "read",
          [[this.uid]],
          {
            fields: [
              'id', 'name', 'email', 'login', 'display_name', 'active',
              'avatar_1024', 'city', 'company_id', 'partner_id', 'country_id',
              'create_date', 'write_date', 'create_uid', 'write_uid',
              'currency_id', 'employee', 'employee_id', 'equipment_count',
              'equipment_ids', 'expense_manager_id', 'gender', 'lang',
              'mobile', 'partner_latitude', 'partner_longitude', 'project_ids',
              'sale_order_ids', 'street', 'task_ids', 'tz'
            ]
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

    console.log('📤 UserService - Requête envoyée:', JSON.stringify(requestBody, null, 2));

    return from(CapacitorHttp.post(options)).pipe(
      map(response => {
        console.log('📦 UserService - Réponse reçue:', response);
        
        if (response.status === 200 && response.data?.result) {
          console.log('✅ UserService - Utilisateur récupéré:', response.data.result.length);
          return response.data.result;
        } else {
          console.error('❌ UserService - Erreur lors de la récupération de l\'utilisateur');
          console.error('❌ UserService - Status:', response.status);
          console.error('❌ UserService - Data:', response.data);
          return [];
        }
      }),
      catchError(error => {
        console.error('❌ UserService - Erreur lors de la requête:', error);
        return of([]);
      })
    );
  }

  // ===== HYDATATION =====

  private hydrateUserFromOdoo(userData: IUserOdoo): User {
    console.log('🔄 Hydratation de l\'utilisateur:', userData);
    
    try {
      const user = this.hydrationService.hydrateUser(userData);
      
      if (!user.isValid()) {
        console.warn('⚠️ Utilisateur invalide après hydratation:', user.errors);
      }
      
      return user;
    } catch (error) {
      console.error('❌ Erreur lors de l\'hydratation de l\'utilisateur:', error);
      throw new Error('Échec de l\'hydratation de l\'utilisateur');
    }
  }

  // ===== CONVERSION LEGACY =====

  private convertToUserProfile(userData: IUserOdoo): UserProfile {
    console.log('🔄 Conversion vers UserProfile:', userData);
    
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      mobile: userData.mobile || '',
      language: userData.lang,
      timezone: userData.tz || 'Europe/Paris',
      avatar: userData.avatar_1024 || '',
      company: userData.company_id ? userData.company_id[1] : 'Default Company',
      city: userData.city || '',
      street: userData.street || '',
      country: userData.country_id ? userData.country_id[1] : ''
    };
  }
}

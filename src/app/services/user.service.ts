import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HydrationService } from './hydration.service';
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
  private uid: number = 0;

  constructor(private hydrationService: HydrationService) {
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

  // ===== RÉCUPÉRATION DES DONNÉES UTILISATEUR =====
  
  /**
   * Récupère le profil utilisateur avec le nouveau pattern d'hydratation
   * @returns Observable<User | null>
   */
  getUserProfile(): Observable<User | null> {
    console.log('🔍 getUserProfile() appelé, UID:', this.uid);
    
    if (!this.uid) {
      console.error('❌ UID non disponible pour récupérer le profil');
      return of(null);
    }

    return this.getUserFromOdoo().pipe(
      map(userData => {
        if (userData && userData.length > 0) {
          return this.hydrateUserFromOdoo(userData[0]);
        }
        return null;
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération du profil utilisateur:', error);
        return of(null);
      })
    );
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
          // Conversion de IUserOdoo vers UserOdoo pour la compatibilité legacy
          const legacyUserData: UserOdoo = {
            id: userData[0].id,
            name: userData[0].name,
            email: userData[0].email,
            mobile: userData[0].mobile,
            lang: userData[0].lang,
            tz: userData[0].tz || 'Europe/Paris',
            avatar_1024: userData[0].avatar_1024,
            company_id: userData[0].company_id || [0, ''],
            city: userData[0].city,
            street: userData[0].street,
            country_id: userData[0].country_id
          };
          return this.convertOdooToProfile(legacyUserData);
        }
        return null;
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération du profil utilisateur:', error);
        return of(null);
      })
    );
  }

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
          "search_read",
          [[["id", "=", this.uid]]],
          { 
            fields: [
              "id", 
              "name", 
              "email", 
              "mobile", 
              "lang", 
              "tz", 
              "avatar_1024", 
              "company_id",
              "city",
              "street",
              "country_id",
              "active",
              "display_name",
              "login",
              "partner_id",
              "employee",
              "employee_id",
              "equipment_count",
              "equipment_ids",
              "expense_manager_id",
              "gender",
              "currency_id",
              "create_date",
              "write_date",
              "create_uid",
              "write_uid",
              "partner_latitude",
              "partner_longitude",
              "project_ids",
              "sale_order_ids",
              "task_ids"
            ] 
          }
        ]
      }
    };

    console.log('📤 Requête utilisateur envoyée:', JSON.stringify(requestBody, null, 2));

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
        console.log('📥 Réponse utilisateur reçue:', response);
        if (response.status === 200 && response.data?.result) {
          console.log('✅ Données utilisateur récupérées:', response.data.result);
          return response.data.result as IUserOdoo[];
        }
        console.log('⚠️ Pas de données utilisateur dans la réponse');
        return [];
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération des données utilisateur:', error);
        throw error;
      })
    );
  }

  // ===== HYDATATION ET CONVERSION DE DONNÉES =====
  
  /**
   * Hydrate un utilisateur à partir des données Odoo
   * @param userData Données brutes Odoo
   * @returns User hydraté
   */
  private hydrateUserFromOdoo(userData: IUserOdoo): User {
    console.log('🔄 Hydratation de l\'utilisateur depuis Odoo');
    
    try {
      // Validation des données
      if (!this.hydrationService.validateUserData(userData)) {
        console.error('❌ Données utilisateur invalides');
        return this.hydrationService.createDefaultUser();
      }

      // Prétraitement des données
      const cleanedData = this.hydrationService.preprocessUserData(userData);
      
      // Hydratation avec le service dédié
      const user = this.hydrationService.hydrateUser(cleanedData);
      
      console.log('✅ Utilisateur hydraté avec succès');
      return user;
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'hydratation:', error);
      return this.hydrationService.createDefaultUser();
    }
  }

  /**
   * Méthode legacy pour compatibilité (à supprimer progressivement)
   * @param userData Données brutes Odoo
   * @returns UserProfile
   */
  private convertOdooToProfile(userData: UserOdoo): UserProfile {
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      mobile: this.formatPhone(userData.mobile),
      language: this.formatLanguage(userData.lang),
      timezone: this.formatTimezone(userData.tz),
      avatar: this.formatAvatar(userData.avatar_1024),
      company: this.formatCompany(userData.company_id),
      city: this.formatText(userData.city),
      street: this.formatText(userData.street),
      country: this.formatCountry(userData.country_id)
    };
  }

  // ===== MÉTHODES UTILITAIRES =====
  private formatPhone(phone: string | false): string {
    if (phone && typeof phone === 'string' && phone.trim() !== '') {
      return phone;
    }
    return 'Non renseigné';
  }

  private formatText(text: string | false): string {
    if (text && typeof text === 'string' && text.trim() !== '') {
      return text;
    }
    return 'Non renseigné';
  }

  private formatLanguage(lang: string): string {
    const languageMap: { [key: string]: string } = {
      'fr_FR': 'Français',
      'en_US': 'English',
      'es_ES': 'Español',
      'de_DE': 'Deutsch'
    };
    return languageMap[lang] || lang;
  }

  private formatTimezone(tz: string): string {
    const timezoneMap: { [key: string]: string } = {
      'Europe/Paris': 'Paris (UTC+1)',
      'Europe/London': 'Londres (UTC+0)',
      'America/New_York': 'New York (UTC-5)',
      'Africa/Dakar': 'Dakar (UTC+0)'
    };
    return timezoneMap[tz] || tz;
  }

  private formatAvatar(imageData: string | false): string {
    if (imageData && typeof imageData === 'string' && imageData.trim() !== '') {
      return `data:image/png;base64,${imageData}`;
    }
    return 'person-circle';
  }

  private formatCompany(companyData: [number, string]): string {
    if (companyData && Array.isArray(companyData) && companyData.length > 1) {
      return companyData[1];
    }
    return 'Non renseigné';
  }

  private formatCountry(countryData: [number, string] | false): string {
    if (countryData && Array.isArray(countryData) && countryData.length > 1) {
      return countryData[1];
    }
    return 'Non renseigné';
  }
} 
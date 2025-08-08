import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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

  constructor() {
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
  getUserProfile(): Observable<UserProfile | null> {
    console.log('🔍 getUserProfile() appelé, UID:', this.uid);
    
    if (!this.uid) {
      console.error('❌ UID non disponible pour récupérer le profil');
      return of(null);
    }

    return this.getUserFromOdoo().pipe(
      map(userData => {
        if (userData && userData.length > 0) {
          return this.convertOdooToProfile(userData[0]);
        }
        return null;
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la récupération du profil utilisateur:', error);
        return of(null);
      })
    );
  }

  private getUserFromOdoo(): Observable<UserOdoo[]> {
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
              "country_id"
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
          return response.data.result as UserOdoo[];
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

  // ===== CONVERSION DE DONNÉES =====
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
    return 'assets/images/profile-avatar.png';
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
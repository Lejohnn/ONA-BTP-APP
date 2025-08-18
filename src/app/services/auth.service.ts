import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { Observable, from, throwError } from 'rxjs';
import { retry, catchError, timeout, map } from 'rxjs/operators';
import { OfflineStorageService, CachedUser } from './offline-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private odooUrl = 'https://btp.onaerp.com/jsonrpc';
  private dbName = 'btptst';
  private maxRetries = 3;
  private retryDelay = 2000;

  constructor(private offlineStorage: OfflineStorageService) {
    this.testUrlConfiguration();
  }

  // ===== AUTHENTIFICATION AVEC CACHE =====
  async userLogin(codeclient: string, password: string): Promise<{ success: boolean; uid?: number; message?: string }> {
    console.log('=== DÉBUT LOGIN ===');
    console.log('Form data:', { codeclient, password: password ? '***' : 'undefined' });
    console.log('Form valid:', codeclient && password);

    // Vérifier d'abord le cache local
    const cachedUser = await this.offlineStorage.getCachedUser();
    if (cachedUser && cachedUser.email === codeclient) {
      console.log('Utilisateur trouvé en cache local');
      
      // Connexion immédiate avec le cache
      localStorage.setItem('odoo_uid', cachedUser.uid.toString());
      
      // En arrière-plan, vérifier la connectivité et mettre à jour si possible
      this.checkAndUpdateAuthInBackground(codeclient, password);
      
      return { success: true, uid: cachedUser.uid };
    }

    // Si pas de cache, tenter directement l'authentification API
    // La vérification de connectivité sera faite par l'API elle-même
    try {
      const result = await this.authenticateWithAPI(codeclient, password);
      
      if (result.success && result.uid) {
        // Mettre en cache l'utilisateur
        const userToCache: CachedUser = {
          uid: result.uid,
          email: codeclient,
          name: codeclient.split('@')[0], // Nom basé sur l'email
          lastLogin: new Date()
        };
        await this.offlineStorage.cacheUser(userToCache);
        
        localStorage.setItem('odoo_uid', result.uid.toString());
        return result;
      }
      
      return result;
    } catch (error) {
      console.error('Erreur lors de l\'authentification API:', error);
      
      // Si l'erreur est liée à la connectivité, donner un message plus spécifique
      if (error instanceof Error && error.message.includes('Network')) {
        return { success: false, message: 'Connexion internet requise pour la première authentification' };
      }
      
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  /**
   * Vérifie et met à jour l'authentification en arrière-plan
   */
  private async checkAndUpdateAuthInBackground(codeclient: string, password: string): Promise<void> {
    try {
      // Tenter la mise à jour en arrière-plan sans vérification préalable de connectivité
      console.log('🔄 Vérification d\'authentification en arrière-plan...');
      const result = await this.authenticateWithAPI(codeclient, password);
      if (result.success && result.uid) {
        const userToCache: CachedUser = {
          uid: result.uid,
          email: codeclient,
          name: codeclient.split('@')[0],
          lastLogin: new Date()
        };
        await this.offlineStorage.cacheUser(userToCache);
        console.log('✅ Authentification mise à jour en arrière-plan');
      }
    } catch (error) {
      console.log('⚠️ Échec de la vérification en arrière-plan:', error);
    }
  }

  private async authenticateWithAPI(codeclient: string, password: string): Promise<{ success: boolean; uid?: number; message?: string }> {
    console.log('=== AUTHENTIFICATION DÉBUT ===');
    console.log('Login attempt with:', { codeclient, password: password ? '***' : 'undefined' });
    console.log('Form valid:', codeclient && password);

    const requestBody = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "login",
        args: [this.dbName, codeclient, password]
      }
    };

    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('URL:', this.odooUrl);
    console.log('=== TENTATIVE 1/3 ===');

    return this.retryWithBackoff(async (attempt: number) => {
      console.log(`=== TENTATIVE ${attempt}/${this.maxRetries} ===`);
      
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

      console.log('CapacitorHttp options:', JSON.stringify(options, null, 2));
      console.log('=== ENVOI REQUÊTE CAPACITORHTTP ===');

      try {
        const response = await CapacitorHttp.post(options);
        console.log('=== RÉPONSE CAPACITORHTTP ===');
        console.log('Response:', response);

        if (response.status === 200 && response.data) {
          const data = response.data;
          
          if (data.result && typeof data.result === 'number') {
            const uid = data.result;
            console.log('=== RÉSULTAT AUTHENTIFICATION ===');
            console.log('Success: true');
            console.log('UID:', uid);
            console.log('✅ Authentification réussie');
            
            return { success: true, uid };
          } else if (data.error) {
            console.log('=== ERREUR AUTHENTIFICATION ===');
            console.log('Error data:', data.error);
            console.log('❌ Authentification échouée');
            
            return { success: false, message: 'Identifiants incorrects' };
          }
        }
        
        console.log('=== ERREUR CAPACITORHTTP ===');
        console.log('Status:', response.status);
        console.log('❌ Authentification échouée');
        
        return { success: false, message: 'Erreur de connexion au serveur' };
      } catch (error) {
        console.log('=== ERREUR CAPACITORHTTP ===');
        console.error('Erreur de connexion à Odoo :', error);
        
        const diagnosis = this.diagnoseConnectionError(error);
        console.log('=== DIAGNOSTIC ERREUR ===');
        console.log('Error type:', typeof error);
        console.log('Error message:', error instanceof Error ? error.message : 'Unknown error');
        console.log('Error status:', (error as any)?.status);
        console.log('Error code:', (error as any)?.code);
        console.log('Diagnostic:', diagnosis);
        
        console.log('=== RÉSULTAT AUTHENTIFICATION ===');
        console.log('Success: false');
        console.log('❌ Authentification échouée');
        
        throw error;
      }
    });
  }

  // ===== VÉRIFICATION AUTHENTIFICATION =====
  async isAuthenticated(): Promise<boolean> {
    const uid = localStorage.getItem('odoo_uid');
    if (!uid) return false;

    // Si hors ligne, vérifier le cache local
    if (!this.offlineStorage.isCurrentlyOnline()) {
      const cachedUser = await this.offlineStorage.getCachedUser();
      return cachedUser?.uid === parseInt(uid);
    }

    // Si en ligne, vérifier avec l'API
    try {
      const result = await this.testConnection();
      return result;
    } catch (error) {
      console.log('Erreur lors de la vérification d\'authentification:', error);
      // En cas d'erreur, utiliser le cache local
      const cachedUser = await this.offlineStorage.getCachedUser();
      return cachedUser?.uid === parseInt(uid);
    }
  }

  // ===== DÉCONNEXION =====
  async logout(): Promise<void> {
    localStorage.removeItem('odoo_uid');
    await this.offlineStorage.clearUserCache();
    console.log('Déconnexion effectuée');
  }

  // ===== GESTION DU CACHE =====
  async getCurrentUser(): Promise<CachedUser | null> {
    return await this.offlineStorage.getCachedUser();
  }

  async clearCache(): Promise<void> {
    await this.offlineStorage.clearAllCache();
  }

  // ===== MÉTHODES EXISTANTES (conservées) =====
  private async retryWithBackoff<T>(operation: (attempt: number) => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation(attempt);
      } catch (error) {
        console.log(`❌ Tentative ${attempt} échouée:`, error instanceof Error ? error.message : 'Unknown error');
        
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`);
        await this.delay(delay);
      }
    }
    throw new Error('Nombre maximum de tentatives atteint');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private diagnoseConnectionError(error: any): string {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const status = (error as any)?.status;
    const code = (error as any)?.code;

    if (status === 0 || code === 'NETWORK_ERROR') {
      return 'Erreur de réseau. Vérifiez votre connexion internet.';
    } else if (status === 404) {
      return 'Serveur non trouvé. Vérifiez l\'URL de l\'API.';
    } else if (status === 403) {
      return 'Accès refusé. Vérifiez vos permissions.';
    } else if (status === 500) {
      return 'Erreur serveur. Réessayez plus tard.';
    } else if (errorMessage.includes('CORS')) {
      return 'Erreur CORS. Le serveur ne permet pas les requêtes depuis cette origine.';
    } else if (errorMessage.includes('timeout')) {
      return 'Délai d\'attente dépassé. Vérifiez votre connexion.';
    } else if (errorMessage.includes('Unable to resolve host')) {
      return 'Impossible de résoudre l\'hôte. Vérifiez l\'URL.';
    } else {
      return 'Erreur de connexion inconnue. Vérifiez votre réseau et réessayez.';
    }
  }

  async testConnection(): Promise<boolean> {
    console.log('=== TEST DE CONNEXION AMÉLIORÉ ===');
    
    const testBody = {
      jsonrpc: "2.0",
      method: "call",
      params: {
        service: "common",
        method: "version"
      }
    };

    const options: HttpOptions = {
      url: this.odooUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ONA-BTP-Mobile/1.0'
      },
      data: testBody,
      connectTimeout: 15000,
      readTimeout: 15000
    };

    try {
      const response = await CapacitorHttp.post(options);
      console.log('Test de connexion réussi:', response.data);
      return true;
    } catch (error) {
      console.error('Test de connexion échoué:', error);
      return false;
    }
  }

  private testUrlConfiguration(): void {
    console.log('=== TEST CONFIGURATION URL ===');
    console.log('URL configurée:', this.odooUrl);
    console.log('Base de données:', this.dbName);
  }
} 
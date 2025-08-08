import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OdooTestService {

  constructor() { }

  // Test exact avec les identifiants de votre requête cURL
  testExactCurlRequest(): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      console.log('=== TEST EXACT CURL REQUEST ===');
      
      // Reproduction exacte de votre requête cURL qui fonctionne
      const testBody = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'login',
          args: ['btptst', 'ingineer.btp@gmail.com', 'demo']
        }
      };

      const options = {
        url: 'https://btp.onaerp.com/jsonrpc',
        headers: { 
          'Content-Type': 'application/json'
        },
        data: testBody,
        connectTimeout: 15000,
        readTimeout: 15000
      };

      console.log('Test body:', JSON.stringify(testBody, null, 2));
      console.log('Options:', JSON.stringify(options, null, 2));

      CapacitorHttp.post(options).then((response: HttpResponse) => {
        console.log('✅ Test exact cURL réussi');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        observer.next(true);
        observer.complete();
      }).catch((error) => {
        console.log('❌ Test exact cURL échoué:', error);
        observer.next(false);
        observer.complete();
      });
    });
  }

  // Test avec les identifiants dynamiques du formulaire
  testDynamicLogin(codeclient: string, password: string): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      console.log('=== TEST LOGIN DYNAMIQUE ===');
      console.log('Codeclient:', codeclient);
      console.log('Password:', password ? '***' : 'undefined');
      
      const testBody = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'login',
          args: ['btptst', codeclient, password]
        }
      };

      const options = {
        url: 'https://btp.onaerp.com/jsonrpc',
        headers: { 
          'Content-Type': 'application/json'
        },
        data: testBody,
        connectTimeout: 15000,
        readTimeout: 15000
      };

      console.log('Test body:', JSON.stringify(testBody, null, 2));

      CapacitorHttp.post(options).then((response: HttpResponse) => {
        console.log('✅ Test login dynamique réussi');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
        
        const uid = response.data?.result;
        if (typeof uid === 'number' && uid > 0) {
          console.log('✅ UID valide:', uid);
          observer.next(true);
        } else {
          console.log('❌ UID invalide:', uid);
          observer.next(false);
        }
        observer.complete();
      }).catch((error) => {
        console.log('❌ Test login dynamique échoué:', error);
        observer.next(false);
        observer.complete();
      });
    });
  }

  // Test de version Odoo
  testOdooVersion(): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      console.log('=== TEST VERSION ODOO ===');
      
      const testBody = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'common',
          method: 'version',
          args: []
        }
      };

      const options = {
        url: 'https://btp.onaerp.com/jsonrpc',
        headers: { 
          'Content-Type': 'application/json'
        },
        data: testBody,
        connectTimeout: 15000,
        readTimeout: 15000
      };

      CapacitorHttp.post(options).then((response: HttpResponse) => {
        console.log('✅ Test version Odoo réussi');
        console.log('Status:', response.status);
        console.log('Version:', response.data?.result);
        observer.next(true);
        observer.complete();
      }).catch((error) => {
        console.log('❌ Test version Odoo échoué:', error);
        observer.next(false);
        observer.complete();
      });
    });
  }

  // Test complet avec diagnostic détaillé
  performCompleteTest(): Observable<any> {
    return new Observable<any>((observer) => {
      console.log('=== TEST COMPLET ODOO ===');
      
      const results: {
        curlTest: boolean;
        versionTest: boolean;
        dynamicLoginTest: boolean;
        errors: string[];
      } = {
        curlTest: false,
        versionTest: false,
        dynamicLoginTest: false,
        errors: []
      };

      // Test 1: Requête exacte cURL
      this.testExactCurlRequest().subscribe({
        next: (success) => {
          results.curlTest = success;
          console.log('Curl test result:', success);

          // Test 2: Version Odoo
          this.testOdooVersion().subscribe({
            next: (versionSuccess) => {
              results.versionTest = versionSuccess;
              console.log('Version test result:', versionSuccess);

              // Test 3: Login dynamique avec identifiants de test
              this.testDynamicLogin('ingineer.btp@gmail.com', 'demo').subscribe({
                next: (loginSuccess) => {
                  results.dynamicLoginTest = loginSuccess;
                  console.log('Dynamic login test result:', loginSuccess);
                  
                  console.log('=== RÉSULTATS COMPLETS ===');
                  console.log(results);
                  observer.next(results);
                  observer.complete();
                },
                error: (error) => {
                  results.errors.push('Dynamic login error: ' + error.message);
                  observer.next(results);
                  observer.complete();
                }
              });
            },
            error: (error) => {
              results.errors.push('Version test error: ' + error.message);
              observer.next(results);
              observer.complete();
            }
          });
        },
        error: (error) => {
          results.errors.push('Curl test error: ' + error.message);
          observer.next(results);
          observer.complete();
        }
      });
    });
  }
} 
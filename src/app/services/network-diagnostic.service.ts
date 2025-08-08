import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface NetworkDiagnostic {
  timestamp: Date;
  networkType: string;
  isConnected: boolean;
  odooReachable: boolean;
  internetReachable: boolean;
  responseTime: number;
  errorDetails?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkDiagnosticService {

  constructor() { }

  // Test de connectivité internet générale
  testInternetConnectivity(): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      const startTime = Date.now();
      
      const options = {
        url: 'https://httpbin.org/get',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        connectTimeout: 10000,
        readTimeout: 10000
      };

      CapacitorHttp.get(options).then((response: HttpResponse) => {
        const responseTime = Date.now() - startTime;
        console.log('✅ Internet connectivity test successful');
        console.log('Response time:', responseTime, 'ms');
        observer.next(true);
        observer.complete();
      }).catch((error) => {
        console.log('❌ Internet connectivity test failed:', error);
        observer.next(false);
        observer.complete();
      });
    });
  }

  // Test spécifique de l'API Odoo avec la structure corrigée
  testOdooConnectivity(): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      const startTime = Date.now();
      
      // Structure corrigée selon la documentation Odoo
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
        url: environment.odooUrl,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'ONA-BTP-Mobile/1.0'
        },
        data: testBody,
        connectTimeout: 15000,
        readTimeout: 15000
      };

      CapacitorHttp.post(options).then((response: HttpResponse) => {
        const responseTime = Date.now() - startTime;
        console.log('✅ Odoo connectivity test successful');
        console.log('Response time:', responseTime, 'ms');
        console.log('Odoo version:', response.data?.result);
        observer.next(true);
        observer.complete();
      }).catch((error) => {
        console.log('❌ Odoo connectivity test failed:', error);
        observer.next(false);
        observer.complete();
      });
    });
  }

  // Test de latence réseau
  testNetworkLatency(): Observable<number> {
    return new Observable<number>((observer) => {
      const startTime = Date.now();
      
      const options = {
        url: 'https://httpbin.org/delay/1',
        headers: { 
          'Content-Type': 'application/json'
        },
        connectTimeout: 15000,
        readTimeout: 15000
      };

      CapacitorHttp.get(options).then((response: HttpResponse) => {
        const latency = Date.now() - startTime;
        console.log('Network latency test:', latency, 'ms');
        observer.next(latency);
        observer.complete();
      }).catch((error) => {
        console.log('Latency test failed:', error);
        observer.next(-1);
        observer.complete();
      });
    });
  }

  // Diagnostic complet du réseau
  performFullDiagnostic(): Observable<NetworkDiagnostic> {
    return new Observable<NetworkDiagnostic>((observer) => {
      const diagnostic: NetworkDiagnostic = {
        timestamp: new Date(),
        networkType: 'unknown',
        isConnected: false,
        odooReachable: false,
        internetReachable: false,
        responseTime: 0
      };

      console.log('=== DÉBUT DIAGNOSTIC RÉSEAU COMPLET ===');

      // Test 1: Connectivité internet
      this.testInternetConnectivity().subscribe({
        next: (internetOk) => {
          diagnostic.internetReachable = internetOk;
          console.log('Internet connectivity:', internetOk);

          // Test 2: Connectivité Odoo
          this.testOdooConnectivity().subscribe({
            next: (odooOk) => {
              diagnostic.odooReachable = odooOk;
              console.log('Odoo connectivity:', odooOk);

              // Test 3: Latence réseau
              this.testNetworkLatency().subscribe({
                next: (latency) => {
                  diagnostic.responseTime = latency;
                  diagnostic.isConnected = diagnostic.internetReachable || diagnostic.odooReachable;
                  
                  console.log('=== DIAGNOSTIC TERMINÉ ===');
                  console.log('Diagnostic result:', diagnostic);
                  
                  observer.next(diagnostic);
                  observer.complete();
                },
                error: (error) => {
                  diagnostic.responseTime = -1;
                  diagnostic.errorDetails = error instanceof Error ? error.message : 'Unknown error';
                  observer.next(diagnostic);
                  observer.complete();
                }
              });
            },
            error: (error) => {
              diagnostic.errorDetails = error instanceof Error ? error.message : 'Unknown error';
              observer.next(diagnostic);
              observer.complete();
            }
          });
        },
        error: (error) => {
          diagnostic.errorDetails = error instanceof Error ? error.message : 'Unknown error';
          observer.next(diagnostic);
          observer.complete();
        }
      });
    });
  }

  // Génération d'un rapport de diagnostic
  generateDiagnosticReport(diagnostic: NetworkDiagnostic): string {
    let report = `
🔍 RAPPORT DE DIAGNOSTIC RÉSEAU
📅 Date: ${diagnostic.timestamp.toLocaleString()}

📊 RÉSULTATS:
• Connectivité Internet: ${diagnostic.internetReachable ? '✅ OK' : '❌ ÉCHEC'}
• Connectivité Odoo: ${diagnostic.odooReachable ? '✅ OK' : '❌ ÉCHEC'}
• Latence réseau: ${diagnostic.responseTime > 0 ? diagnostic.responseTime + 'ms' : '❌ ÉCHEC'}

🌐 CONFIGURATION:
• URL Odoo: ${environment.odooUrl}
• Base de données: ${environment.odooDb}

💡 RECOMMANDATIONS:
`;

    if (!diagnostic.internetReachable) {
      report += `• Vérifiez votre connexion WiFi/mobile
• Redémarrez votre appareil
• Vérifiez les paramètres réseau
`;
    }

    if (!diagnostic.odooReachable && diagnostic.internetReachable) {
      report += `• Le serveur Odoo n'est pas accessible
• Vérifiez l'URL de l'API
• Contactez l'administrateur système
`;
    }

    if (diagnostic.responseTime > 5000) {
      report += `• La connexion est lente (${diagnostic.responseTime}ms)
• Vérifiez votre connexion réseau
• Essayez un réseau plus rapide
`;
    }

    if (diagnostic.errorDetails) {
      report += `\n❌ ERREUR DÉTAILLÉE:
${diagnostic.errorDetails}
`;
    }

    return report;
  }
} 
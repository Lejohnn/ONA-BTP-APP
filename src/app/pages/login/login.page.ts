import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AlertController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { OfflineStorageService } from '../../services/offline-storage.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  formData: FormGroup;
  isLoading: boolean = false;
  isOnline: boolean = true;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private offlineStorage: OfflineStorageService,
    private toastService: ToastService,
    private alertController: AlertController
  ) {
    this.formData = this.formBuilder.group({
      codeclient: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit() {
    this.checkOnlineStatus();
    this.checkCachedUser();
  }

  // ===== GESTION STATUT CONNEXION =====
  private checkOnlineStatus(): void {
    this.offlineStorage.getOnlineStatus().subscribe(isOnline => {
      this.isOnline = isOnline;
      console.log('Statut connexion:', isOnline ? 'En ligne' : 'Hors ligne');
    });
  }

  private async checkCachedUser(): Promise<void> {
    const cachedUser = await this.offlineStorage.getCachedUser();
    if (cachedUser && !this.isOnline) {
      console.log('Utilisateur en cache trouvé en mode hors ligne');
      this.showOfflineLoginAlert(cachedUser);
    }
  }

  private async showOfflineLoginAlert(cachedUser: any): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Mode Hors Ligne',
      message: `Utilisateur "${cachedUser.email}" trouvé en cache. Voulez-vous vous connecter en mode hors ligne ?`,
      buttons: [
        {
          text: 'Non',
          role: 'cancel'
        },
        {
          text: 'Oui',
          handler: () => {
            this.connectWithCachedUser(cachedUser);
          }
        }
      ]
    });
    await alert.present();
  }

  private async connectWithCachedUser(cachedUser: any): Promise<void> {
    try {
      const result = await this.authService.userLogin(cachedUser.email, 'demo');
      if (result.success) {
        this.showToast('Connexion en mode hors ligne réussie', 'success');
        this.router.navigate(['/tabs/projets']);
      } else {
        this.showToast('Erreur lors de la connexion en mode hors ligne', 'danger');
      }
    } catch (error) {
      console.error('Erreur lors de la connexion avec cache:', error);
      this.showToast('Erreur lors de la connexion en mode hors ligne', 'danger');
    }
  }

  // ===== VALIDATION DES CHAMPS =====
  validateFields(): boolean {
    if (this.formData.invalid) {
      const errors = this.formData.errors;
      console.log('Form errors:', errors);
      
      if (this.formData.get('codeclient')?.hasError('required')) {
        this.showToast('Email requis', 'warning');
        return false;
      }
      
      if (this.formData.get('codeclient')?.hasError('email')) {
        this.showToast('Format d\'email invalide', 'warning');
        return false;
      }
      
      if (this.formData.get('password')?.hasError('required')) {
        this.showToast('Mot de passe requis', 'warning');
        return false;
      }
      
      if (this.formData.get('password')?.hasError('minlength')) {
        this.showToast('Mot de passe trop court', 'warning');
        return false;
      }
      
      return false;
    }
    
    return true;
  }

  // ===== AUTHENTIFICATION =====
  async userLogin(): Promise<void> {
    if (!this.validateFields()) {
      return;
    }

    this.isLoading = true;
    const codeclient = this.formData.get('codeclient')?.value;
    const password = this.formData.get('password')?.value;

    console.log('=== DÉBUT LOGIN ===');
    console.log('Form data:', { codeclient, password: password ? '***' : 'undefined' });
    console.log('Form valid:', this.formData.valid);

    try {
      const result = await this.authService.userLogin(codeclient, password);
      
      console.log('=== RÉSULTAT AUTHENTIFICATION ===');
      console.log('Success:', result.success);
      
      if (result.success) {
        console.log('✅ Authentification réussie');
        
        // Extraire le nom de l'utilisateur à partir de l'email
        const userName = this.extractUserName(codeclient);
        
        // Afficher le toast de bienvenue personnalisé
        await this.toastService.showWelcomeToast(userName);
        
        // Redirection vers la liste des projets
        this.router.navigate(['/tabs/projets']);
      } else {
        console.log('❌ Authentification échouée');
        this.showToast(result.message || 'Échec de l\'authentification', 'danger');
      }
    } catch (error) {
      console.error('Erreur lors de l\'authentification:', error);
      this.showToast('Erreur de connexion', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Extrait le nom de l'utilisateur à partir de l'email
   * @param email L'email de l'utilisateur
   * @returns Le nom formaté de l'utilisateur
   */
  private extractUserName(email: string): string {
    if (!email) return 'Utilisateur';
    
    // Extraire la partie avant @ de l'email
    const namePart = email.split('@')[0];
    
    // Capitaliser la première lettre et remplacer les points par des espaces
    const formattedName = namePart
      .replace(/\./g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return formattedName || 'Utilisateur';
  }

  // ===== NOTIFICATIONS =====
  async showToast(message: string, color: string): Promise<void> {
    switch (color) {
      case 'success':
        await this.toastService.showSuccess(message);
        break;
      case 'danger':
        await this.toastService.showError(message);
        break;
      case 'warning':
        await this.toastService.showWarning(message);
        break;
      default:
        await this.toastService.showInfo(message);
        break;
    }
  }

  // ===== GESTION DU CACHE =====
  async clearCache(): Promise<void> {
    try {
      await this.authService.clearCache();
      this.showToast('Cache effacé avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'effacement du cache:', error);
      this.showToast('Erreur lors de l\'effacement du cache', 'danger');
    }
  }

  async getCacheStats(): Promise<void> {
    try {
      const stats = await this.offlineStorage.getCacheStats();
      console.log('Statistiques cache:', stats);
      
      let message = `Cache: ${stats.userCached ? 'Utilisateur' : 'Aucun utilisateur'}`;
      if (stats.pendingActions > 0) {
        message += `, ${stats.pendingActions} action(s) en attente`;
      }
      
      this.showToast(message, 'info');
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      this.showToast('Erreur lors de la récupération des statistiques', 'danger');
    }
  }

  // ===== UTILITAIRES =====
  getOnlineStatusText(): string {
    return this.isOnline ? 'En ligne' : 'Hors ligne';
  }

  getOnlineStatusColor(): string {
    return this.isOnline ? 'success' : 'warning';
  }
}

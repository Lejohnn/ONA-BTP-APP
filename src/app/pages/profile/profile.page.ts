import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../services/user.service';
import { ToastController, AlertController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OfflineStorageService } from '../../services/offline-storage.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage implements OnInit {
  userProfile: UserProfile | null = null;
  isLoading: boolean = true;
  isLoggingOut: boolean = false;
  errorMessage: string = '';

  constructor(
    private userService: UserService,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router,
    private authService: AuthService,
    private offlineStorage: OfflineStorageService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getUserProfile().subscribe({
      next: (profile) => {
        console.log('Profil utilisateur chargé:', profile);
        this.userProfile = profile;
        this.isLoading = false;
        
        if (profile) {
          this.showToast('Profil chargé avec succès', 'success');
        } else {
          this.errorMessage = 'Impossible de charger le profil utilisateur';
          this.showToast('Erreur lors du chargement du profil', 'danger');
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement du profil:', error);
        this.errorMessage = 'Erreur lors du chargement du profil';
        this.isLoading = false;
        this.showToast('Erreur de connexion à l\'API', 'danger');
      }
    });
  }

  refreshProfile(): void {
    this.loadUserProfile();
  }

  /**
   * Déconnexion de l'utilisateur
   */
  async logout(): Promise<void> {
    // Confirmation avant déconnexion
    const alert = await this.alertController.create({
      header: 'Confirmation de déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      cssClass: 'logout-alert',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Se déconnecter',
          role: 'destructive',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.performLogout();
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Effectue la déconnexion
   */
  private async performLogout(): Promise<void> {
    try {
      this.isLoggingOut = true;
      console.log('=== DÉBUT DÉCONNEXION ===');

      // Récupérer les informations de l'utilisateur actuel
      const currentUser = await this.authService.getCurrentUser();
      const userName = currentUser?.name || 'Utilisateur';

      // Supprimer l'UID du localStorage (déconnexion de la session)
      localStorage.removeItem('odoo_uid');
      
      console.log('✅ UID supprimé du localStorage');
      console.log('✅ Utilisateur déconnecté de la session');

      // Afficher un toast de confirmation
      await this.toastService.showSuccess(`Au revoir ${userName} ! 👋`);

      // Redirection vers la page de login
      console.log('🔄 Redirection vers la page de login');
      this.router.navigate(['/login'], { replaceUrl: true });

    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      this.toastService.showError('Erreur lors de la déconnexion');
    } finally {
      this.isLoggingOut = false;
    }
  }

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
} 
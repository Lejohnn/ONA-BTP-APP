import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { OfflineStorageService } from '../../services/offline-storage.service';
import { ToastService } from '../../services/toast.service';
import { HeaderTitleService } from '../../services/header-title.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage implements OnInit {
  userProfile: User | null = null;
  isLoading = false;
  errorMessage = '';
  isLoggingOut = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private offlineStorage: OfflineStorageService,
    private toastService: ToastService,
    private headerTitleService: HeaderTitleService
  ) {
    this.headerTitleService.setTitle('Profil');
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    console.log('🔄 Chargement du profil utilisateur');
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getUserProfile().subscribe({
      next: (user: User | null) => {
        this.isLoading = false;
        
        if (user) {
          console.log('✅ Profil utilisateur chargé:', user.toDisplay());
          
          // Validation du profil
          if (!user.isValid()) {
            console.warn('⚠️ Profil utilisateur invalide:', user.errors);
            this.errorMessage = 'Données de profil incomplètes';
            this.toastService.showWarning('Certaines informations du profil sont manquantes');
          }
          
          this.userProfile = user;
        } else {
          console.error('❌ Aucun profil utilisateur trouvé');
          this.errorMessage = 'Impossible de charger le profil utilisateur';
          this.toastService.showError('Erreur lors du chargement du profil');
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement du profil:', error);
        this.isLoading = false;
        this.errorMessage = 'Erreur de connexion au serveur';
        this.toastService.showError('Erreur de connexion');
      }
    });
  }

  refreshProfile() {
    this.loadUserProfile();
  }

  async logout() {
    console.log('🔄 Déconnexion en cours...');
    this.isLoggingOut = true;

    try {
      await this.authService.logout();
      console.log('✅ Déconnexion réussie');
      this.isLoggingOut = false;
      this.router.navigate(['/login']);
      this.toastService.showSuccess('Déconnexion réussie');
    } catch (error: any) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      this.isLoggingOut = false;
      this.toastService.showError('Erreur lors de la déconnexion');
    }
  }
} 
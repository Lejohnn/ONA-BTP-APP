import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { OfflineStorageService } from '../../services/offline-storage.service';
import { ToastService } from '../../services/toast.service';
import { HeaderTitleService } from '../../services/header-title.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage implements OnInit {
  userProfile: any = null;
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
    // Implémentation du chargement du profil
  }

  refreshProfile() {
    this.loadUserProfile();
  }

  logout() {
    // Implémentation de la déconnexion
  }
} 
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ProjetService, ProjetFigma } from '../../services/projet.service';
import { OfflineStorageService } from '../../services/offline-storage.service';
import { ImageService } from '../../services/image.service';
import { ToastController } from '@ionic/angular/standalone';

@Component({
  selector: 'app-liste-projets',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './liste-projets.page.html',
  styleUrls: ['./liste-projets.page.scss']
})
export class ListeProjetsPage implements OnInit {
  projets: ProjetFigma[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  isOnline: boolean = true;

  constructor(
    private router: Router,
    private projetService: ProjetService,
    private offlineStorage: OfflineStorageService,
    private imageService: ImageService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.checkOnlineStatus();
    this.loadProjets();
  }

  // ===== GESTION STATUT CONNEXION =====
  private checkOnlineStatus(): void {
    this.offlineStorage.getOnlineStatus().subscribe(isOnline => {
      this.isOnline = isOnline;
      console.log('Statut connexion:', isOnline ? 'En ligne' : 'Hors ligne');
    });
  }

  // ===== CHARGEMENT DES PROJETS =====
  loadProjets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.projetService.getProjets().subscribe({
      next: (projets) => {
        console.log('Projets chargés:', projets);
        this.projets = projets;
        this.isLoading = false;
        
        if (projets.length === 0) {
          this.showToast('Aucun projet trouvé', 'warning');
        } else {
          this.showToast(`${projets.length} projet(s) chargé(s)`, 'success');
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des projets:', error);
        this.errorMessage = 'Erreur lors du chargement des projets';
        this.isLoading = false;
        this.showToast('Erreur de connexion à l\'API', 'danger');
      }
    });
  }

  refreshProjets(): void {
    this.loadProjets();
  }

  // ===== GESTION DES IMAGES =====
  onImageError(event: any, projet: ProjetFigma): void {
    console.log('Erreur de chargement image pour le projet:', projet.id);
    // Utiliser une image de fallback
    event.target.src = this.imageService.getPlaceholderImage('medium');
  }

  getImageAltText(type: string, state: string): string {
    return this.imageService.getImageAltText(type, state);
  }

  // ===== GESTION DES CLASSES CSS =====
  getProgressClass(type: string): string {
    const classMap: { [key: string]: string } = {
      'construction': 'progress-construction',
      'renovation': 'progress-renovation',
      'maintenance': 'progress-maintenance',
      'default': 'progress-default'
    };
    return classMap[type] || classMap['default'];
  }

  getTypeClass(type: string): string {
    const classMap: { [key: string]: string } = {
      'construction': 'type-construction',
      'renovation': 'type-renovation',
      'maintenance': 'type-maintenance',
      'default': 'type-default'
    };
    return classMap[type] || classMap['default'];
  }

  getStatusClass(state: string): string {
    const classMap: { [key: string]: string } = {
      'in_progress': 'status-in-progress',
      'done': 'status-done',
      'cancelled': 'status-cancelled',
      'pending': 'status-pending',
      'default': 'status-default'
    };
    return classMap[state] || classMap['default'];
  }

  // ===== GESTION DES TEXTES =====
  getTypeText(type: string): string {
    const textMap: { [key: string]: string } = {
      'construction': 'Construction',
      'renovation': 'Rénovation',
      'maintenance': 'Maintenance',
      'default': 'Projet'
    };
    return textMap[type] || textMap['default'];
  }

  getStatusText(state: string): string {
    const textMap: { [key: string]: string } = {
      'in_progress': 'En cours',
      'done': 'Terminé',
      'cancelled': 'Annulé',
      'pending': 'En attente',
      'default': 'Non défini'
    };
    return textMap[state] || textMap['default'];
  }

  // ===== NAVIGATION =====
  voirDetails(projectId: number): void {
    console.log('Navigation vers les détails du projet:', projectId);
    this.router.navigate(['/detail-projet', projectId]);
  }

  // ===== NOTIFICATIONS =====
  async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    toast.present();
  }

  // ===== STATISTIQUES CACHE =====
  async getCacheStats(): Promise<void> {
    try {
      const stats = await this.projetService.getCacheStats();
      console.log('Statistiques cache:', stats);
      
      if (stats.pendingActions > 0) {
        this.showToast(`${stats.pendingActions} action(s) en attente de synchronisation`, 'warning');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  }
} 
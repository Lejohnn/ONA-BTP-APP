import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
// import { OfflineStorageService } from '../../services/offline-storage.service';
import { ImageService } from '../../services/image.service';
import { ToastController } from '@ionic/angular/standalone';
import { HeaderTitleService } from '../../services/header-title.service';
import { FormsModule } from '@angular/forms';
import { NetworkDiagnosticService } from '../../services/network-diagnostic.service';

@Component({
  selector: 'app-liste-projets',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './liste-projets.page.html',
  styleUrls: ['./liste-projets.page.scss']
})
export class ListeProjetsPage implements OnInit {
  projets: Project[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  isOnline: boolean = true;

  constructor(
    private router: Router,
    private projectService: ProjectService,
    // private offlineStorage: OfflineStorageService,
    private imageService: ImageService,
    private toastController: ToastController,
    private headerTitleService: HeaderTitleService
  ) {}

  ngOnInit() {
    this.checkOnlineStatus();
    this.loadProjets();
    this.headerTitleService.setTitle('Liste des Projets');
  }

  // ===== GESTION STATUT CONNEXION =====
  private checkOnlineStatus(): void {
    this.isOnline = navigator.onLine;
    console.log('Statut connexion:', this.isOnline ? 'En ligne' : 'Hors ligne');
  }

  // ===== CHARGEMENT DES PROJETS =====
  loadProjets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.getProjects().subscribe({
      next: (projets: Project[]) => {
        console.log('Projets chargés:', projets);
        this.projets = projets;
        this.isLoading = false;
        
        if (projets.length === 0) {
          this.showToast('Aucun projet trouvé', 'warning');
        } else {
          this.showToast(`${projets.length} projet(s) chargé(s)`, 'success');
        }
      },
      error: (error: any) => {
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
  onImageError(event: any, projet: Project): void {
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
      'planification': 'progress-planning',
      'default': 'progress-default'
    };
    return classMap[type] || classMap['default'];
  }

  getTypeClass(type: string): string {
    const classMap: { [key: string]: string } = {
      'construction': 'type-construction',
      'renovation': 'type-renovation',
      'maintenance': 'type-maintenance',
      'planification': 'type-planning',
      'default': 'type-default'
    };
    return classMap[type] || classMap['default'];
  }

  getStatusClass(state: string): string {
    const classMap: { [key: string]: string } = {
      'in_progress': 'status-in-progress',
      'ready_to_possession': 'status-in-progress',
      'open': 'status-in-progress',
      'done': 'status-done',
      'closed': 'status-done',
      'cancelled': 'status-cancelled',
      'pending': 'status-pending',
      'default': 'status-default'
    };
    return classMap[state] || classMap['default'];
  }

  getPriorityClass(priority: string): string {
    const classMap: { [key: string]: string } = {
      'Low': 'priority-low',
      'Medium': 'priority-medium',
      'High': 'priority-high',
      'Critical': 'priority-critical',
      'default': 'priority-medium'
    };
    return classMap[priority] || classMap['default'];
  }

  // ===== GESTION DES TEXTES =====
  getTypeText(type: string): string {
    const textMap: { [key: string]: string } = {
      'construction': 'Construction',
      'renovation': 'Rénovation',
      'maintenance': 'Maintenance',
      'planification': 'Planification',
      'default': 'Projet'
    };
    return textMap[type] || textMap['default'];
  }

  getStatusText(state: string): string {
    const textMap: { [key: string]: string } = {
      'in_progress': 'En cours',
      'ready_to_possession': 'Prêt à livrer',
      'open': 'Ouvert',
      'done': 'Terminé',
      'closed': 'Fermé',
      'cancelled': 'Annulé',
      'pending': 'En attente',
      'default': 'Non défini'
    };
    return textMap[state] || textMap['default'];
  }

  getPriorityText(priority: string): string {
    const textMap: { [key: string]: string } = {
      'Low': 'Basse',
      'Medium': 'Moyenne',
      'High': 'Haute',
      'Critical': 'Critique',
      'default': 'Moyenne'
    };
    return textMap[priority] || textMap['default'];
  }

  // ===== STATISTIQUES =====
  getProjetsEnCours(): number {
    // Utiliser les vrais statuts Odoo pour les projets en cours
    return this.projets.filter(p => ['in_progress', 'open'].includes(p.state)).length;
  }

  getProjetsTermines(): number {
    // Utiliser les vrais statuts Odoo pour les projets terminés
    // "Prêt à livrer" est considéré comme terminé du point de vue métier
    return this.projets.filter(p => ['ready_to_possession', 'done', 'closed', 'cancelled'].includes(p.state)).length;
  }

  // ===== FORMATAGE DES DATES =====
  formatDate(dateString: string): string {
    if (!dateString || dateString === 'Non définie') {
      return 'Non définie';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Retourner la chaîne originale si pas une date valide
      }
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
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
      // Note: Cette méthode n'existe pas encore dans le nouveau service
      // Elle sera implémentée plus tard si nécessaire
      console.log('Statistiques cache: Non implémenté dans le nouveau service');
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  }
} 
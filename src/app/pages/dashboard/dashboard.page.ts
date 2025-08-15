import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderTitleService } from '../../services/header-title.service';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonContent, 
  IonProgressBar,
  IonMenuButton
} from '@ionic/angular/standalone';

interface DashboardStats {
  totalProjets: number;
  projetsEnCours: number;
  totalHeures: number;
  heuresCetteSemaine: number;
  totalTaches: number;
  tachesCompletees: number;
  pourcentageTaches: number;
  progressionGlobale: number;
}

interface ProjetRecent {
  id: number;
  nom: string;
  client: string;
  localisation: string;
  statut: string;
  progression: number;
  dateFin: string;
}

interface TacheUrgente {
  id: number;
  nom: string;
  projet: string;
  priorite: 'haute' | 'moyenne' | 'basse';
  statut: string;
  deadline: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonButtons, 
    IonButton, 
    IonIcon, 
    IonContent, 
    IonProgressBar,

  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  userName: string = 'Utilisateur';
  currentDate: string = '';
  isLoading: boolean = false;

  stats: DashboardStats = {
    totalProjets: 0,
    projetsEnCours: 0,
    totalHeures: 0,
    heuresCetteSemaine: 0,
    totalTaches: 0,
    tachesCompletees: 0,
    pourcentageTaches: 0,
    progressionGlobale: 0
  };

  projetsRecents: ProjetRecent[] = [];
  tachesUrgentes: TacheUrgente[] = [];

  constructor(
    private router: Router,
    private headerTitleService: HeaderTitleService
  ) {
    this.headerTitleService.setTitle('Tableau de Bord');
  }

  ngOnInit() {
    this.setCurrentDate();
    this.loadDashboardData();
  }

  private setCurrentDate(): void {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    this.currentDate = now.toLocaleDateString('fr-FR', options);
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    // Simuler un chargement de données
    setTimeout(() => {
      this.loadStats();
      this.loadProjetsRecents();
      this.loadTachesUrgentes();
      this.isLoading = false;
    }, 1000);
  }

  private loadStats(): void {
    // Données simulées - à remplacer par des appels API réels
    this.stats = {
      totalProjets: 12,
      projetsEnCours: 8,
      totalHeures: 1247,
      heuresCetteSemaine: 45,
      totalTaches: 156,
      tachesCompletees: 89,
      pourcentageTaches: 89 / 156,
      progressionGlobale: 0.72
    };
  }

  private loadProjetsRecents(): void {
    this.projetsRecents = [
      {
        id: 1,
        nom: 'Résidence Les Jardins',
        client: 'Promoteur ABC',
        localisation: 'Lyon, France',
        statut: 'En cours',
        progression: 0.75,
        dateFin: '2024-12-15'
      },
      {
        id: 2,
        nom: 'Centre Commercial Central',
        client: 'Groupe XYZ',
        localisation: 'Marseille, France',
        statut: 'En cours',
        progression: 0.45,
        dateFin: '2025-03-20'
      },
      {
        id: 3,
        nom: 'Pont de la Rivière',
        client: 'Ville de Nice',
        localisation: 'Nice, France',
        statut: 'Planification',
        progression: 0.15,
        dateFin: '2025-06-10'
      }
    ];
  }

  private loadTachesUrgentes(): void {
    this.tachesUrgentes = [
      {
        id: 1,
        nom: 'Validation plans structure',
        projet: 'Résidence Les Jardins',
        priorite: 'haute',
        statut: 'En cours',
        deadline: '2024-11-30'
      },
      {
        id: 2,
        nom: 'Commande matériaux',
        projet: 'Centre Commercial Central',
        priorite: 'haute',
        statut: 'En attente',
        deadline: '2024-12-05'
      },
      {
        id: 3,
        nom: 'Réunion équipe',
        projet: 'Pont de la Rivière',
        priorite: 'moyenne',
        statut: 'Planifié',
        deadline: '2024-12-10'
      }
    ];
  }

  // Méthodes de navigation
  refreshDashboard(): void {
    this.loadDashboardData();
  }

  voirTousProjets(): void {
    this.router.navigate(['/liste-projets']);
  }

  voirToutesTaches(): void {
    this.router.navigate(['/liste-taches']);
  }

  voirProjet(projetId: number): void {
    this.router.navigate(['/detail-projet', projetId]);
  }

  voirTache(tacheId: number): void {
    this.router.navigate(['/detail-tache', tacheId]);
  }

  creerProjet(): void {
    // Navigation vers la création de projet (à implémenter)
    console.log('Créer un nouveau projet');
  }

  creerTache(): void {
    this.router.navigate(['/creer-tache']);
  }

  voirRapports(): void {
    // Navigation vers les rapports (à implémenter)
    console.log('Voir les rapports');
    // Pour l'instant, on peut rediriger vers une page de paramètres ou afficher un toast
    this.showToast('Fonctionnalité des rapports à venir', 'info');
  }

  // Méthode utilitaire pour afficher des toasts (à implémenter avec ToastService)
  private showToast(message: string, type: string): void {
    console.log(`${type.toUpperCase()}: ${message}`);
    // TODO: Implémenter avec ToastService
  }

  // Méthodes utilitaires pour les classes CSS
  getStatusClass(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'en cours':
        return 'status-active';
      case 'terminé':
        return 'status-completed';
      case 'planification':
        return 'status-planning';
      case 'en pause':
        return 'status-paused';
      default:
        return 'status-default';
    }
  }

  getProgressColor(progression: number): string {
    if (progression >= 0.8) return 'success';
    if (progression >= 0.5) return 'warning';
    return 'danger';
  }

  getPriorityClass(priorite: string): string {
    switch (priorite) {
      case 'haute':
        return 'priority-high';
      case 'moyenne':
        return 'priority-medium';
      case 'basse':
        return 'priority-low';
      default:
        return 'priority-default';
    }
  }

  getTaskStatusClass(statut: string): string {
    switch (statut.toLowerCase()) {
      case 'en cours':
        return 'task-status-active';
      case 'terminé':
        return 'task-status-completed';
      case 'en attente':
        return 'task-status-waiting';
      case 'planifié':
        return 'task-status-planned';
      default:
        return 'task-status-default';
    }
  }
}

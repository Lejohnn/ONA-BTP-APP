import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HeaderTitleService } from '../../services/header-title.service';
import { ProjectService } from '../../services/project.service';
import { TaskService } from '../../services/task.service';
import { Project } from '../../models/project.model';
import { ITask } from '../../models/interfaces/task.interface';
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
    private headerTitleService: HeaderTitleService,
    private projectService: ProjectService,
    private taskService: TaskService
  ) {
    this.headerTitleService.setTitle('Tableau de Bord');
  }

  ngOnInit() {
    this.setCurrentDate();
    this.loadUserName();
    this.loadDashboardData();
  }

  private loadUserName(): void {
    // Récupérer le nom d'utilisateur depuis le localStorage ou les données de session
    const userName = localStorage.getItem('user_name') || 'Utilisateur';
    this.userName = userName;
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
    
    // Charger les projets
    this.projectService.getProjects().subscribe({
      next: (projects: Project[]) => {
        console.log('✅ Projets chargés pour le dashboard:', projects.length);
        this.loadStatsFromProjects(projects);
        this.loadProjetsRecentsFromData(projects);
        this.loadTachesUrgentesFromProjects(projects);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des projets pour le dashboard:', error);
        this.isLoading = false;
      }
    });
  }

  private loadStatsFromProjects(projects: Project[]): void {
    const totalProjets = projects.length;
    const projetsEnCours = projects.filter(p => ['in_progress', 'open'].includes(p.state)).length;
    
    // Calculer les statistiques des tâches
    let totalTaches = 0;
    let tachesCompletees = 0;
    let progressionGlobale = 0;
    
    projects.forEach(project => {
      totalTaches += project.taskCount || 0;
      tachesCompletees += project.closedTaskCount || 0;
      progressionGlobale += project.progress || 0;
    });
    
    const pourcentageTaches = totalTaches > 0 ? tachesCompletees / totalTaches : 0;
    const progressionMoyenne = totalProjets > 0 ? progressionGlobale / totalProjets : 0;
    
    this.stats = {
      totalProjets,
      projetsEnCours,
      totalHeures: this.calculateTotalHours(projects),
      heuresCetteSemaine: this.calculateWeeklyHours(projects),
      totalTaches,
      tachesCompletees,
      pourcentageTaches,
      progressionGlobale: progressionMoyenne
    };
    
    console.log('📊 Statistiques calculées:', this.stats);
  }

  private loadProjetsRecentsFromData(projects: Project[]): void {
    // Prendre les 3 projets les plus récents ou les plus actifs
    const projetsRecents = projects
      .sort((a, b) => {
        // Prioriser les projets en cours, puis par date de modification
        if (a.state === 'in_progress' && b.state !== 'in_progress') return -1;
        if (b.state === 'in_progress' && a.state !== 'in_progress') return 1;
        return 0;
      })
      .slice(0, 3);
    
    this.projetsRecents = projetsRecents.map(project => ({
      id: project.id,
      nom: project.name,
      client: project.partnerName || 'Client non défini',
      localisation: project.locationName || 'Localisation non définie',
      statut: this.getStatusText(project.state),
      progression: project.progress || 0,
      dateFin: project.getFormattedEndDate() || 'Date non définie'
    }));
    
    console.log('📋 Projets récents chargés:', this.projetsRecents);
  }

  private loadTachesUrgentesFromProjects(projects: Project[]): void {
    // Récupérer les tâches de tous les projets pour trouver les urgentes
    const allTasksPromises = projects.map(project => 
      this.taskService.getTasksByProject(project.id).toPromise()
    );
    
    Promise.all(allTasksPromises).then(results => {
      const allTasks: ITask[] = [];
      results.forEach((tasks, index) => {
        if (tasks) {
          allTasks.push(...tasks);
        }
      });
      
      // Filtrer les tâches urgentes (en retard ou haute priorité)
      const tachesUrgentes = allTasks
        .filter(task => task.isOverdue() || task.priority === 'high')
        .sort((a, b) => {
          // Prioriser les tâches en retard
          if (a.isOverdue() && !b.isOverdue()) return -1;
          if (!a.isOverdue() && b.isOverdue()) return 1;
          return 0;
        })
        .slice(0, 3);
      
      this.tachesUrgentes = tachesUrgentes.map(task => ({
        id: task.id,
        nom: task.name,
        projet: task.projectName || 'Projet non défini',
        priorite: this.getPriorityText(task.priority),
        statut: this.getTaskStatusText(task.state),
        deadline: task.getFormattedDeadline() || 'Date non définie'
      }));
      
      console.log('🚨 Tâches urgentes chargées:', this.tachesUrgentes);
    }).catch(error => {
      console.error('❌ Erreur lors du chargement des tâches urgentes:', error);
    });
  }

  private calculateTotalHours(projects: Project[]): number {
    // Calculer les heures totales basées sur les heures effectives des projets
    return projects.reduce((total, project) => {
      return total + (project.effectiveHours || 0);
    }, 0);
  }

  private calculateWeeklyHours(projects: Project[]): number {
    // Simulation des heures de cette semaine (à améliorer avec de vraies données)
    const totalHours = this.calculateTotalHours(projects);
    return Math.floor(totalHours * 0.1); // 10% des heures totales pour cette semaine
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
      case 'in_progress':
        return 'status-active';
      case 'terminé':
      case 'done':
        return 'status-completed';
      case 'planification':
      case 'planning':
        return 'status-planning';
      case 'en pause':
      case 'paused':
        return 'status-paused';
      case 'prêt à livrer':
      case 'ready_to_possession':
        return 'status-ready';
      default:
        return 'status-default';
    }
  }

  getStatusText(state: string): string {
    const statusMap: { [key: string]: string } = {
      'in_progress': 'En cours',
      'ready_to_possession': 'Prêt à livrer',
      'open': 'Ouvert',
      'done': 'Terminé',
      'closed': 'Fermé',
      'cancelled': 'Annulé',
      'pending': 'En attente'
    };
    return statusMap[state] || 'Non défini';
  }

  getTaskStatusText(state: string): string {
    const statusMap: { [key: string]: string } = {
      '01_in_progress': 'En cours',
      '02_pending': 'En attente',
      '03_approved': 'Approuvée',
      '1_done': 'Terminée',
      '2_cancelled': 'Annulée',
      '3_closed': 'Fermée'
    };
    return statusMap[state] || 'Non défini';
  }

  getPriorityText(priority: string): 'haute' | 'moyenne' | 'basse' {
    const priorityMap: { [key: string]: 'haute' | 'moyenne' | 'basse' } = {
      'high': 'haute',
      'medium': 'moyenne',
      'low': 'basse'
    };
    return priorityMap[priority] || 'moyenne';
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

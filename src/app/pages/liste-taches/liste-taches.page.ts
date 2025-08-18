import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { HeaderTitleService } from '../../services/header-title.service';
import { TaskService } from '../../services/task.service';
import { ITask } from '../../models/interfaces/task.interface';

@Component({
  selector: 'app-liste-taches',
  templateUrl: './liste-taches.page.html',
  styleUrls: ['./liste-taches.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ListeTachesPage implements OnInit, OnDestroy {
  // Données
  tasks: ITask[] = [];
  filteredTasks: ITask[] = [];
  
  // États
  isLoading = false;
  isOnline = true;
  errorMessage = '';
  
  // Filtres et recherche
  searchTerm = '';
  activeFilter = 'all';
  
  // Filtres disponibles - Basés sur les vrais statuts Odoo
  availableFilters = [
    { value: 'all', label: 'Toutes', icon: 'list-outline' },
    { value: '01_in_progress', label: 'En cours', icon: 'construct-outline' },
    { value: '03_approved', label: 'Approuvées', icon: 'checkmark-outline' },
    { value: '1_done', label: 'Terminées', icon: 'checkmark-circle-outline' },
    { value: 'overdue', label: 'En retard', icon: 'warning-outline' }
  ];
  
  // Souscriptions
  private tasksSubscription?: Subscription;
  private routeSubscription?: Subscription;
  
  // Navigation
  private currentProjectId?: number;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private headerTitleService: HeaderTitleService,
    private taskService: TaskService
  ) {
    this.headerTitleService.setTitle('Liste des Tâches');
  }

  ngOnInit() {
    this.loadTasks();
    this.checkProjectFilter();
  }

  ionViewWillEnter() {
    // Recharger les tâches quand on entre dans la page
    console.log('🔄 ionViewWillEnter - Rechargement des tâches');
    this.loadTasks();
    this.checkProjectFilter();
  }

  ngOnDestroy() {
    if (this.tasksSubscription) {
      this.tasksSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  // ===== CHARGEMENT DES DONNÉES =====

  loadTasks() {
    this.isLoading = true;
    this.errorMessage = '';

    this.tasksSubscription = this.taskService.getAllTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.filteredTasks = [...tasks];
        this.isLoading = false;
        console.log('✅ Tâches chargées:', tasks.length);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des tâches:', error);
        this.errorMessage = 'Impossible de charger les tâches. Vérifiez votre connexion.';
        this.isLoading = false;
      }
    });
  }

  checkProjectFilter() {
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      const projectId = params['projectId'];
      if (projectId) {
        this.currentProjectId = parseInt(projectId);
        this.loadTasksByProject(this.currentProjectId);
      }
    });
  }

  loadTasksByProject(projectId: number) {
    this.isLoading = true;
    this.errorMessage = '';
    console.log('🔍 loadTasksByProject appelé pour le projet:', projectId);

    // Annuler la souscription précédente si elle existe
    if (this.tasksSubscription) {
      this.tasksSubscription.unsubscribe();
    }

    this.tasksSubscription = this.taskService.getTasksByProject(projectId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.filteredTasks = [...tasks];
        this.isLoading = false;
        console.log('✅ Tâches du projet chargées:', tasks.length);
        console.log('📋 Tâches:', tasks.map(t => `${t.id}: ${t.name}`));
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des tâches du projet:', error);
        this.errorMessage = 'Impossible de charger les tâches du projet.';
        this.isLoading = false;
      }
    });
  }

  refreshTasks() {
    console.log('🔄 refreshTasks() appelé');
    if (this.currentProjectId) {
      console.log('🔄 Rechargement des tâches pour le projet:', this.currentProjectId);
      this.loadTasksByProject(this.currentProjectId);
    } else {
      console.log('🔄 Rechargement de toutes les tâches');
      this.loadTasks();
    }
  }

  // ===== FILTRES ET RECHERCHE =====

  filterTasks() {
    let filtered = [...this.tasks];

    // Filtre par statut
    if (this.activeFilter !== 'all') {
      if (this.activeFilter === 'overdue') {
        filtered = filtered.filter(task => task.isOverdue());
      } else {
        filtered = filtered.filter(task => task.state === this.activeFilter);
      }
    }

    // Filtre par recherche
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower)) ||
        (task.projectName && task.projectName.toLowerCase().includes(searchLower))
      );
    }

    this.filteredTasks = filtered;
  }

  setFilter(filterValue: string) {
    this.activeFilter = filterValue;
    this.filterTasks();
  }

  // ===== MÉTHODES UTILITAIRES =====

  getTasksByState(state: string): ITask[] {
    return this.tasks.filter(task => task.state === state);
  }

  getOverdueTasks(): ITask[] {
    return this.tasks.filter(task => task.isOverdue());
  }

  getStatusClass(state: string): string {
    const statusMap: { [key: string]: string } = {
      '01_in_progress': 'status-in-progress',
      '02_pending': 'status-pending',
      '03_approved': 'status-approved',
      '1_done': 'status-done',
      '2_cancelled': 'status-cancelled',
      '3_closed': 'status-closed'
    };
    return statusMap[state] || 'status-default';
  }

  getStatusIcon(state: string): string {
    const iconMap: { [key: string]: string } = {
      '01_in_progress': 'construct-outline',
      '02_pending': 'time-outline',
      '03_approved': 'checkmark-outline',
      '1_done': 'checkmark-circle-outline',
      '2_cancelled': 'close-circle-outline',
      '3_closed': 'lock-closed-outline'
    };
    return iconMap[state] || 'help-outline';
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'primary';
  }

  getTaskImage(task: ITask): string {
    // Logique pour déterminer l'image de la tâche
    const taskType = this.getTaskType(task);
    const imageMap: { [key: string]: string } = {
      'construction': 'assets/images/taches/1.webp',
      'planning': 'assets/images/taches/2.webp',
      'maintenance': 'assets/images/taches/3.webp',
      'inspection': 'assets/images/taches/4.webp'
    };
    return imageMap[taskType] || 'assets/images/taches/1.webp';
  }

  getTaskType(task: ITask): string {
    // Logique simple pour déterminer le type de tâche
    const name = task.name.toLowerCase();
    if (name.includes('construction') || name.includes('bâtiment') || name.includes('terrassement')) return 'construction';
    if (name.includes('planning') || name.includes('plan') || name.includes('préparation')) return 'planning';
    if (name.includes('maintenance') || name.includes('réparation') || name.includes('déboisement')) return 'maintenance';
    if (name.includes('inspection') || name.includes('contrôle') || name.includes('applanissement')) return 'inspection';
    return 'construction';
  }

  onImageError(event: any, task: ITask) {
    event.target.src = 'assets/images/taches/1.webp';
  }

  trackByTaskId(index: number, task: ITask): number {
    return task.id;
  }

  // ===== NAVIGATION =====

  ajouterTache() {
    this.router.navigate(['/creer-tache']);
  }

  voirDetailTache(taskId: number) {
    this.router.navigate(['/detail-tache', taskId]);
  }

  modifierTache(taskId: number) {
    this.router.navigate(['/modifier-tache'], { queryParams: { taskId } });
  }

  // ===== NAVIGATION RETOUR =====

  getBackButtonHref(): string {
    if (this.currentProjectId) {
      return `/detail-projet/${this.currentProjectId}`;
    }
    return '/tabs/dashboard';
  }
} 
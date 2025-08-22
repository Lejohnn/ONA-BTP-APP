import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TaskService } from '../../services/task.service';
import { TaskDetailsService } from '../../services/task-details.service';
import { ITask } from '../../models/interfaces/task.interface';
import { ITaskTabData } from '../../models/interfaces/task-details.interface';

@Component({
  selector: 'app-detail-tache',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './detail-tache.page.html',
  styleUrls: ['./detail-tache.page.scss']
})
export class DetailTachePage implements OnInit, OnDestroy {
  // Données de la tâche
  task: ITask | null = null;
  
  // États de l'interface
  isLoading: boolean = true;
  errorMessage: string = '';
  
  // Sous-tâches et tâches dépendantes
  subTasks: ITask[] = [];
  dependentTasks: ITask[] = [];
  
  // Données des onglets
  tabData: ITaskTabData | null = null;
  selectedTab: string = 'materials';
  
  // Souscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private taskDetailsService: TaskDetailsService
  ) {}

  ngOnInit() {
    console.log('🚀 DetailTachePage - ngOnInit() appelé');
    this.loadTaskDetails();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Charge les détails de la tâche
   */
  private loadTaskDetails() {
    console.log('📋 DetailTachePage - loadTaskDetails() appelé');
    
    const taskId = this.route.snapshot.paramMap.get('id');
    console.log('🔍 DetailTachePage - taskId depuis route:', taskId);
    
    if (!taskId) {
      console.error('❌ DetailTachePage - ID de tâche manquant');
      this.errorMessage = 'ID de tâche manquant';
      this.isLoading = false;
      return;
    }

    const taskIdNumber = parseInt(taskId);
    console.log('🔍 DetailTachePage - Chargement des détails de la tâche ID:', taskIdNumber);

    this.isLoading = true;
    this.errorMessage = '';
    console.log('⏳ DetailTachePage - État de chargement activé');

    // Récupération des détails de la tâche
    console.log('📞 DetailTachePage - Appel à taskService.getTaskDetails()');
    const taskSubscription = this.taskService.getTaskDetails(taskIdNumber).subscribe({
      next: (task: any) => {
        console.log('✅ DetailTachePage - Détails de la tâche récupérés avec succès:', task);
        console.log('📊 DetailTachePage - Type de task:', typeof task);
        console.log('📊 DetailTachePage - Task est null?', task === null);
        console.log('📊 DetailTachePage - Task est undefined?', task === undefined);
        
        this.task = task;
        this.isLoading = false;
        console.log('✅ DetailTachePage - Task assignée, chargement terminé');
        
        // Chargement des sous-tâches et tâches dépendantes
        this.loadRelatedTasks(taskIdNumber);
        
        // Chargement des données des onglets
        this.loadTabData(taskIdNumber);
      },
      error: (error: any) => {
        console.error('❌ DetailTachePage - Erreur lors du chargement des détails:', error);
        console.error('❌ DetailTachePage - Type d\'erreur:', typeof error);
        console.error('❌ DetailTachePage - Message d\'erreur:', error.message);
        this.errorMessage = 'Impossible de charger les détails de la tâche';
        this.isLoading = false;
        console.log('❌ DetailTachePage - État d\'erreur activé');
      }
    });

    this.subscriptions.add(taskSubscription);
  }

  /**
   * Charge les données des onglets
   */
  private loadTabData(taskId: number) {
    console.log('📋 DetailTachePage - Chargement des données d\'onglets pour la tâche:', taskId);
    
    const tabDataSubscription = this.taskDetailsService.getTaskTabData(taskId).subscribe({
      next: (data: ITaskTabData) => {
        console.log('✅ DetailTachePage - Données d\'onglets récupérées:', data);
        this.tabData = data;
      },
      error: (error: any) => {
        console.error('❌ DetailTachePage - Erreur lors du chargement des données d\'onglets:', error);
      }
    });

    this.subscriptions.add(tabDataSubscription);
  }

  /**
   * Charge les tâches liées (sous-tâches et dépendances)
   */
  private loadRelatedTasks(taskId: number) {
    console.log('🔗 DetailTachePage - loadRelatedTasks() appelé pour taskId:', taskId);
    
    // Chargement des sous-tâches
    console.log('📞 DetailTachePage - Appel à taskService.getSubTasks()');
    const subTasksSubscription = this.taskService.getSubTasks(taskId).subscribe({
      next: (tasks: any) => {
        console.log('✅ DetailTachePage - Sous-tâches récupérées:', tasks);
        this.subTasks = tasks;
      },
      error: (error: any) => {
        console.error('❌ DetailTachePage - Erreur lors du chargement des sous-tâches:', error);
      }
    });

    // Chargement des tâches dépendantes
    const dependentTasksSubscription = this.taskService.getDependentTasks(taskId).subscribe({
      next: (tasks: any) => {
        console.log('✅ Tâches dépendantes récupérées:', tasks);
        this.dependentTasks = tasks;
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des tâches dépendantes:', error);
      }
    });

    this.subscriptions.add(subTasksSubscription);
    this.subscriptions.add(dependentTasksSubscription);
  }

  /**
   * Rafraîchit les données de la tâche
   */
  refreshTask() {
    this.loadTaskDetails();
  }

  /**
   * Retourne à la liste des tâches
   */
  goBack() {
    this.router.navigate(['/tabs/liste-taches']);
  }

  /**
   * Modifie la tâche
   */
  editTask() {
    console.log('🔧 DetailTachePage - editTask() appelé');
    console.log('🔧 DetailTachePage - Task:', this.task);
    console.log('🔧 DetailTachePage - Task ID:', this.task?.id);
    
    if (this.task) {
      const url = `/modifier-tache?taskId=${this.task.id}`;
      console.log('🔧 DetailTachePage - Navigation vers:', url);
      this.router.navigate(['/modifier-tache'], { queryParams: { taskId: this.task.id } });
    } else {
      console.error('❌ DetailTachePage - Pas de tâche disponible pour la modification');
    }
  }

  /**
   * Ajoute une photo à la tâche
   */
  addPhoto() {
    console.log('📸 Ajouter une photo à la tâche:', this.task?.id);
    // TODO: Implémenter la logique d'ajout de photo
  }

  /**
   * Édite les ressources humaines
   */
  editHumanResources() {
    console.log('👥 Éditer les ressources humaines de la tâche:', this.task?.id);
    // TODO: Implémenter la logique d'édition des ressources humaines
  }

  /**
   * Édite les ressources matérielles
   */
  editMaterialResources() {
    console.log('🔧 Éditer les ressources matérielles de la tâche:', this.task?.id);
    // TODO: Implémenter la logique d'édition des ressources matérielles
  }

  /**
   * Met à jour la tâche
   */
  updateTask() {
    console.log('🔄 Mettre à jour la tâche:', this.task?.id);
    // TODO: Implémenter la logique de mise à jour
  }

  /**
   * Retourne la tâche
   */
  returnTask() {
    console.log('↩️ Retourner la tâche:', this.task?.id);
    // TODO: Implémenter la logique de retour
  }

  /**
   * Obtient l'URL de l'image de la tâche
   */
  getTaskImage(task: ITask): string {
    // TODO: Implémenter la logique de récupération d'image
    return 'assets/images/taches/default-task.webp';
  }

  /**
   * Gère les erreurs d'image
   */
  onImageError(event: any, task: ITask) {
    event.target.src = 'assets/images/taches/default-task.webp';
  }

  /**
   * Obtient la classe CSS pour le statut
   */
  getStatusClass(status: string): string {
    return status.toLowerCase().replace(' ', '-');
  }

  /**
   * Obtient la classe CSS pour la priorité
   */
  getPriorityClass(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      '0': 'low',
      '1': 'normal',
      '2': 'high',
      '3': 'urgent'
    };
    return priorityMap[priority] || 'normal';
  }

  /**
   * Détermine si la tâche est une tâche mère (a des sous-tâches)
   */
  isParentTask(): boolean {
    return this.task ? (this.task.childIds && this.task.childIds.length > 0) : false;
  }

  /**
   * Détermine si la tâche est une tâche enfant (a des dépendances)
   */
  isChildTask(): boolean {
    return this.task ? (this.task.parentId !== undefined && this.task.parentId !== null) : false;
  }

  /**
   * Obtient le type de tâche (mère, enfant, ou normale)
   */
  getTaskType(): 'parent' | 'child' | 'normal' {
    if (this.isParentTask()) return 'parent';
    if (this.isChildTask()) return 'child';
    return 'normal';
  }

  /**
   * Obtient l'icône pour le type de tâche
   */
  getTaskTypeIcon(): string {
    switch (this.getTaskType()) {
      case 'parent':
        return 'folder-outline';
      case 'child':
        return 'document-outline';
      default:
        return 'checkmark-circle-outline';
    }
  }

  /**
   * Obtient le label pour le type de tâche
   */
  getTaskTypeLabel(): string {
    switch (this.getTaskType()) {
      case 'parent':
        return 'Tâche mère';
      case 'child':
        return 'Sous-tâche';
      default:
        return 'Tâche simple';
    }
  }

  /**
   * Obtient la classe CSS pour le type de tâche
   */
  getTaskTypeClass(): string {
    switch (this.getTaskType()) {
      case 'parent':
        return 'task-type-parent';
      case 'child':
        return 'task-type-child';
      default:
        return 'task-type-normal';
    }
  }

  /**
   * Change l'onglet sélectionné
   */
  selectTab(tabName: string) {
    this.selectedTab = tabName;
  }

  /**
   * Vérifie si un onglet est sélectionné
   */
  isTabSelected(tabName: string): boolean {
    return this.selectedTab === tabName;
  }

  /**
   * Obtient le nombre d'éléments dans un onglet
   */
  getTabCount(tabName: string): number {
    if (!this.tabData) return 0;
    
    switch (tabName) {
      case 'materials':
        return this.tabData.materialPlans?.length || 0;
      case 'consumed':
        return this.tabData.consumedMaterials?.length || 0;
      case 'vehicles':
        return this.tabData.vehicleRequests?.length || 0;
      case 'equipment':
        return this.tabData.equipmentRequests?.length || 0;
      case 'expenses':
        return this.tabData.expenses?.length || 0;
      case 'timesheets':
        return this.tabData.timesheets?.length || 0;
      default:
        return 0;
    }
  }

  // Méthodes pour les statuts des véhicules
  getVehicleStatusColor(state: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'warning',
      'confirm': 'primary',
      'cancel': 'danger',
      'done': 'success'
    };
    return statusMap[state] || 'medium';
  }

  getVehicleStatusLabel(state: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'Brouillon',
      'confirm': 'Confirmé',
      'cancel': 'Annulé',
      'done': 'Terminé'
    };
    return statusMap[state] || state;
  }

  // Méthodes pour les statuts des équipements
  getEquipmentStatusColor(state: string): string {
    return this.getVehicleStatusColor(state); // Même logique que les véhicules
  }

  getEquipmentStatusLabel(state: string): string {
    return this.getVehicleStatusLabel(state); // Même logique que les véhicules
  }

  // Méthodes pour les statuts des dépenses
  getExpenseStatusColor(state: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'warning',
      'reported': 'primary',
      'approved': 'success',
      'refused': 'danger',
      'done': 'success'
    };
    return statusMap[state] || 'medium';
  }

  getExpenseStatusLabel(state: string): string {
    const statusMap: { [key: string]: string } = {
      'draft': 'Brouillon',
      'reported': 'Rapporté',
      'approved': 'Approuvé',
      'refused': 'Refusé',
      'done': 'Terminé'
    };
    return statusMap[state] || state;
  }
} 
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TaskService } from '../../services/task.service';
import { ITask } from '../../models/interfaces/task.interface';

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
  
  // Souscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService
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
} 
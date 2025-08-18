import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderTitleService } from '../../services/header-title.service';
import { TaskService } from '../../services/task.service';
// import { OfflineStorageService } from '../../services/offline-storage.service';
import { ToastService } from '../../services/toast.service';
import { ITask } from '../../models/interfaces/task.interface';
import { Subscription } from 'rxjs';

import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonTextarea, IonLabel, IonSelect, IonSelectOption, IonBackButton, IonButtons, IonRange, IonSpinner, IonInput, IonToast
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-modifier-tache',
  standalone: true,
  templateUrl: './modifier-tache.page.html',
  styleUrls: ['./modifier-tache.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonTextarea, IonLabel, IonSelect, IonSelectOption, IonBackButton, IonButtons, IonRange, IonSpinner, IonInput, IonToast
  ]
})
export class ModifierTachePage implements OnInit, OnDestroy {
  tacheForm: FormGroup;
  task: ITask | null = null;
  isLoading = false;
  errorMessage = '';
  taskId: number | null = null;
  subscriptions: Subscription[] = [];
  showSuccessToast = false;
  showErrorToast = false;
  toastMessage = '';
  isOnline = true;

  // États des tâches selon l'API Odoo - Correction des valeurs
  statusList: { value: string; label: string }[] = [];

  constructor(
    private fb: FormBuilder, 
    private headerTitleService: HeaderTitleService,
    private taskService: TaskService,
    // private offlineStorage: OfflineStorageService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.tacheForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      statut: ['', Validators.required],
      comment: [''],
      progress: [0, [Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit() {
    console.log('🔧 ModifierTachePage - ngOnInit() appelé');
    
    this.checkOnlineStatus();
    
    // Récupérer l'ID depuis les query parameters
    const snapshotQueryParams = this.route.snapshot.queryParams;
    console.log('🔧 ModifierTachePage - Snapshot query params:', snapshotQueryParams);
    
    if (snapshotQueryParams['taskId']) {
      this.taskId = +snapshotQueryParams['taskId'];
      console.log('🔧 ModifierTachePage - TaskId depuis query params:', this.taskId);
      
      if (this.taskId && !isNaN(this.taskId)) {
        this.loadTaskDetails();
        return;
      }
    }
    
    // Si snapshot ne fonctionne pas, essayer avec subscribe
    console.log('🔧 ModifierTachePage - Tentative avec subscribe query params...');
    const taskIdSub = this.route.queryParams.subscribe(queryParams => {
      console.log('🔧 ModifierTachePage - Query params reçus:', queryParams);
      console.log('🔧 ModifierTachePage - Type de query params:', typeof queryParams);
      console.log('🔧 ModifierTachePage - Clés de query params:', Object.keys(queryParams));
      
      const taskIdParam = queryParams['taskId'];
      console.log('🔧 ModifierTachePage - TaskId param brut:', taskIdParam);
      console.log('🔧 ModifierTachePage - Type de TaskId param:', typeof taskIdParam);
      
      this.taskId = +taskIdParam;
      console.log('🔧 ModifierTachePage - TaskId récupéré:', this.taskId);
      console.log('🔧 ModifierTachePage - TaskId est un nombre?', !isNaN(this.taskId));
      
      if (this.taskId && !isNaN(this.taskId)) {
        this.loadTaskDetails();
      } else {
        this.errorMessage = 'ID de tâche manquant ou invalide';
        console.error('❌ ModifierTachePage - ID de tâche invalide:', taskIdParam);
        console.error('❌ ModifierTachePage - Query params complet:', queryParams);
      }
    });
    
    this.subscriptions.push(taskIdSub);
  }

  // ===== GESTION STATUT CONNEXION =====
  private checkOnlineStatus(): void {
    // Simplifié - toujours en ligne pour l'instant
    this.isOnline = navigator.onLine;
    console.log('Statut connexion:', this.isOnline ? 'En ligne' : 'Hors ligne');
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadTaskDetails() {
    if (!this.taskId) return;

    console.log('🔧 ModifierTachePage - loadTaskDetails() appelé pour taskId:', this.taskId);
    this.isLoading = true;
    this.errorMessage = '';

    // Charger d'abord les statuts, puis les détails de la tâche
    const statesSub = this.taskService.getTaskStates().subscribe({
      next: (states: any) => {
        console.log('✅ ModifierTachePage - Statuts récupérés:', states);
        this.statusList = states.map((state: any) => ({
          value: state[0],
          label: state[1]
        }));
        
        // Maintenant charger les détails de la tâche
        const loadSub = this.taskService.getTaskDetails(this.taskId!).subscribe({
          next: (task) => {
            console.log('✅ ModifierTachePage - Tâche chargée:', task);
            this.task = task;
            this.populateForm(task);
            this.isLoading = false;
          },
          error: (error) => {
            console.error('❌ ModifierTachePage - Erreur lors du chargement:', error);
            this.errorMessage = 'Erreur lors du chargement de la tâche';
            this.isLoading = false;
            this.showErrorToast = true;
            this.toastMessage = 'Erreur lors du chargement de la tâche';
          }
        });
        this.subscriptions.push(loadSub);
      },
      error: (error: any) => {
        console.error('❌ ModifierTachePage - Erreur lors du chargement des statuts:', error);
        // Continuer avec les statuts par défaut
        this.statusList = [
          { value: '01_in_progress', label: 'En cours' },
          { value: '02_done', label: 'Terminé' }
        ];
        
        // Charger les détails de la tâche
        const loadSub = this.taskService.getTaskDetails(this.taskId!).subscribe({
          next: (task) => {
            console.log('✅ ModifierTachePage - Tâche chargée:', task);
            this.task = task;
            this.populateForm(task);
            this.isLoading = false;
          },
          error: (error) => {
            console.error('❌ ModifierTachePage - Erreur lors du chargement:', error);
            this.errorMessage = 'Erreur lors du chargement de la tâche';
            this.isLoading = false;
            this.showErrorToast = true;
            this.toastMessage = 'Erreur lors du chargement de la tâche';
          }
        });
        this.subscriptions.push(loadSub);
      }
    });

    this.subscriptions.push(statesSub);
  }

  populateForm(task: ITask) {
    console.log('🔧 ModifierTachePage - populateForm() appelé avec task:', task);
    
    // Trouver le statut correspondant
    const status = this.statusList.find(s => s.value === task.state) || this.statusList[0];
    
    this.tacheForm.patchValue({
      name: task.name || '',
      statut: status.value,
      comment: task.description || '',
      progress: task.progress || 0
    });
  }

  onStatusChange(ev: any) {
    console.log('🔧 ModifierTachePage - Statut changé:', ev.detail.value);
    this.tacheForm.patchValue({ statut: ev.detail.value });
  }

  onProgressChange(ev: any) {
    console.log('🔧 ModifierTachePage - Progression changée:', ev.detail.value);
    this.tacheForm.patchValue({ progress: ev.detail.value });
  }

  updateTask() {
    if (!this.taskId || !this.tacheForm.valid) {
      console.warn('⚠️ ModifierTachePage - Formulaire invalide ou taskId manquant');
      this.showErrorToast = true;
      this.toastMessage = 'Veuillez remplir tous les champs requis';
      return;
    }

    console.log('🔧 ModifierTachePage - updateTask() appelé');
    const formData = this.tacheForm.value;
    
    const updateData: any = {
      name: formData.name
    };

    // Ajouter les champs seulement s'ils ont changé ou ont une valeur
    if (formData.comment !== undefined && formData.comment !== this.task?.description) {
      updateData.description = formData.comment;
    }
    
    if (formData.statut !== undefined && formData.statut !== this.task?.state) {
      updateData.state = formData.statut;
    }
    
    if (formData.progress !== undefined && formData.progress !== this.task?.progress) {
      updateData.progress = formData.progress;
    }

    console.log('📤 ModifierTachePage - Données de mise à jour:', updateData);

    this.isLoading = true;
    const updateSub = this.taskService.updateTask(this.taskId, updateData).subscribe({
      next: (updatedTask) => {
        console.log('✅ ModifierTachePage - Tâche mise à jour:', updatedTask);
        this.task = updatedTask;
        this.isLoading = false;
        
        if (!this.isOnline) {
          this.toastService.showInfo('Modification ajoutée à la queue de synchronisation');
        } else {
          this.toastService.showSuccess('Tâche mise à jour avec succès');
        }
        
        this.showSuccessToast = true;
        this.toastMessage = 'Tâche mise à jour avec succès !';
        this.showSuccessMessage();
      },
      error: (error) => {
        console.error('❌ ModifierTachePage - Erreur lors de la mise à jour:', error);
        this.errorMessage = 'Erreur lors de la mise à jour de la tâche';
        this.isLoading = false;
        this.toastService.showError('Erreur lors de la mise à jour de la tâche');
        this.showErrorToast = true;
        this.toastMessage = 'Erreur lors de la mise à jour de la tâche';
      }
    });

    this.subscriptions.push(updateSub);
  }

  modifyHumanResource() {
    console.log('🔧 ModifierTachePage - modifyHumanResource() appelé');
    // Navigation vers la page d'assignation d'ouvriers
    if (this.taskId) {
      this.router.navigate(['/assignation-ouvrier'], { queryParams: { taskId: this.taskId } });
    }
  }

  modifyMaterialResource() {
    console.log('🔧 ModifierTachePage - modifyMaterialResource() appelé');
    // Navigation vers la page d'ajout d'équipement
    if (this.taskId) {
      this.router.navigate(['/ajout-equipement'], { queryParams: { taskId: this.taskId } });
    }
  }

  showSuccessMessage() {
    // Afficher un message de succès
    console.log('✅ ModifierTachePage - Tâche mise à jour avec succès');
  }

  getStatusLabel(value: string): string {
    const status = this.statusList.find(s => s.value === value);
    return status ? status.label : value;
  }

  getProgressColor(): string {
    const progress = this.tacheForm.get('progress')?.value || 0;
    if (progress < 30) return 'danger';
    if (progress < 70) return 'warning';
    return 'success';
  }

  onImageError(event: any) {
    console.log('🔧 ModifierTachePage - Erreur de chargement d\'image, utilisation de l\'image par défaut');
    event.target.src = 'assets/images/taches/updatePhoto.webp';
  }
} 
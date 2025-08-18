import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonInput, IonTextarea, IonLabel, IonRange, IonToggle, IonBackButton, IonButtons, IonSelect, IonSelectOption, IonDatetime, IonItem, IonSpinner
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HeaderTitleService } from '../../services/header-title.service';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { EmployeeService, IEmployee } from '../../services/employee.service';
// import { OfflineStorageService } from '../../services/offline-storage.service';
import { ToastService } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-creer-tache',
  standalone: true,
  templateUrl: './creer-tache.page.html',
  styleUrls: ['./creer-tache.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonInput, IonTextarea, IonLabel, IonRange, IonToggle, IonBackButton, IonButtons, IonSelect, IonSelectOption, IonDatetime, IonItem, IonSpinner
  ]
})
export class CreerTachePage implements OnInit, OnDestroy {
  tacheForm: FormGroup;
  expectedProgress = 0;
  weatherSensitive = false;
  
  // Données dynamiques
  projects: any[] = [];
  employees: IEmployee[] = [];
  
  // États
  isLoading = false;
  isLoadingProjects = false;
  isLoadingEmployees = false;
  isOnline = true;
  
  // Souscriptions
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder, 
    private headerTitleService: HeaderTitleService,
    private taskService: TaskService,
    private projectService: ProjectService,
    private employeeService: EmployeeService,
    // private offlineStorage: OfflineStorageService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.headerTitleService.setTitle('Créer Tâche');
    this.tacheForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      projectId: [''],
      userId: [''],
      dateDeadline: [''],
      priority: ['0'],
      progress: [0]
    });
  }

  ngOnInit() {
    this.checkOnlineStatus();
    this.loadProjects();
    this.loadEmployees();
  }

  // ===== GESTION STATUT CONNEXION =====
  private checkOnlineStatus(): void {
    // Simplifié - toujours en ligne pour l'instant
    this.isOnline = navigator.onLine;
    console.log('Statut connexion:', this.isOnline ? 'En ligne' : 'Hors ligne');
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Charge la liste des projets
   */
  private loadProjects() {
    this.isLoadingProjects = true;
    const subscription = this.projectService.getProjects().subscribe({
      next: (projects: any[]) => {
        this.projects = projects;
        this.isLoadingProjects = false;
        console.log('✅ Projets chargés:', projects.length);
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des projets:', error);
        this.isLoadingProjects = false;
      }
    });
    this.subscriptions.add(subscription);
  }

  /**
   * Charge la liste des employés
   */
  private loadEmployees() {
    this.isLoadingEmployees = true;
    const subscription = this.employeeService.getAllEmployees().subscribe({
      next: (employees: IEmployee[]) => {
        this.employees = employees;
        this.isLoadingEmployees = false;
        console.log('✅ Employés chargés:', employees.length);
      },
      error: (error: any) => {
        console.error('❌ Erreur lors du chargement des employés:', error);
        this.isLoadingEmployees = false;
      }
    });
    this.subscriptions.add(subscription);
  }

  onStartDateChange(event: any) {
    this.tacheForm.patchValue({ startDate: event.detail.value });
  }
  onEndDateChange(event: any) {
    this.tacheForm.patchValue({ endDate: event.detail.value });
  }

  onProgressChange(ev: any) {
    this.expectedProgress = ev.detail.value;
  }

  onToggleWeatherSensitive(ev: any) {
    this.weatherSensitive = ev.detail.checked;
  }

  onCreate() {
    if (this.tacheForm.valid) {
      this.isLoading = true;
      
      const formData = this.tacheForm.value;
      const taskData = {
        name: formData.name,
        description: formData.description,
        projectId: formData.projectId ? parseInt(formData.projectId) : undefined,
        userId: formData.userId ? parseInt(formData.userId) : undefined,
        dateDeadline: formData.dateDeadline,
        priority: formData.priority,
        progress: this.expectedProgress
      };

      console.log('📤 Création de tâche avec données:', taskData);

      const subscription = this.taskService.createTask(taskData).subscribe({
        next: (task: any) => {
          console.log('✅ Tâche créée avec succès:', task);
          this.isLoading = false;
          
          if (!this.isOnline) {
            this.toastService.showInfo('Tâche ajoutée à la queue de synchronisation');
          } else {
            this.toastService.showSuccess('Tâche créée avec succès');
          }
          
          // Rediriger vers la page de détail de la tâche
          this.router.navigate(['/detail-tache', task.id]);
        },
        error: (error: any) => {
          console.error('❌ Erreur lors de la création de la tâche:', error);
          this.isLoading = false;
          this.toastService.showError('Erreur lors de la création de la tâche');
        }
      });
      
      this.subscriptions.add(subscription);
    } else {
      console.log('❌ Formulaire invalide');
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.tacheForm.controls).forEach(key => {
        const control = this.tacheForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  close() {
    // Logique pour fermer la page ou revenir en arrière
  }

  takePhoto() {
    // Logique pour prendre une photo
  }

  importPhoto() {
    // Logique pour importer une photo
  }

  addHumanResource() {
    // Logique pour ajouter une ressource humaine
  }

  addMaterialResource() {
    // Logique pour ajouter une ressource matérielle
  }

  seeHumanResourceDetails() {
    // Logique pour voir les détails des ressources humaines
  }

  seeMaterialResourceDetails() {
    // Logique pour voir les détails des ressources matérielles
  }
} 
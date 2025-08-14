import { Component } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonTextarea, IonLabel, IonSelect, IonSelectOption, IonBackButton, IonButtons, IonRange
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
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonTextarea, IonLabel, IonSelect, IonSelectOption, IonBackButton, IonButtons, IonRange
  ]
})
export class ModifierTachePage {
  tacheForm: FormGroup;
  statusList = ['Pending', 'In Progress', 'Done'];
  progress = 50;

  constructor(private fb: FormBuilder) {
    this.tacheForm = this.fb.group({
      statut: ['', Validators.required],
      comment: [''],
    });
  }

  onStatusChange(ev: any) {
    this.tacheForm.patchValue({ statut: ev.detail.value });
  }

  onProgressChange(ev: any) {
    this.progress = ev.detail.value;
  }

  updateTask() {
    // Logique de mise à jour de la tâche
  }

  modifyHumanResource() {
    // Logique pour modifier les ressources humaines
  }

  modifyMaterialResource() {
    // Logique pour modifier les ressources matérielles
  }
} 
import { Component, ViewChild } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonInput, IonTextarea, IonLabel, IonRange, IonToggle, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

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
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonInput, IonTextarea, IonLabel, IonRange, IonToggle, IonBackButton, IonButtons
  ]
})
export class CreerTachePage {
  tacheForm: FormGroup;
  expectedProgress = 0;
  weatherSensitive = false;

  constructor(private fb: FormBuilder) {
    this.tacheForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
    });
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
    // Logique de création de tâche à implémenter
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
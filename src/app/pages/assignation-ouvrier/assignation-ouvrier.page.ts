import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HeaderTitleService } from '../../services/header-title.service';

@Component({
  selector: 'app-assignation-ouvrier',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, FormsModule],
  templateUrl: './assignation-ouvrier.page.html',
  styleUrls: ['./assignation-ouvrier.page.scss']
})
export class AssignationOuvrierPage {
  constructor(private headerTitleService: HeaderTitleService) {
    this.headerTitleService.setTitle('Assignation Ouvrier');
  }
  profils = [
    { value: 'macon', label: 'Maçon' },
    { value: 'electricien', label: 'Électricien' },
    { value: 'plombier', label: 'Plombier' }
  ];
  profilSelectionne: string = '';
  nombreOuvriers: number | null = null;
  duree: number | null = null;

  assigner() {
    console.log('Assigner cliqué', {
      profil: this.profilSelectionne,
      nombreOuvriers: this.nombreOuvriers,
      duree: this.duree
    });
  }
} 
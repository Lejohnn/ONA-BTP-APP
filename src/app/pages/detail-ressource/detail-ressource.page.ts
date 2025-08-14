import { Component } from '@angular/core';
import { HeaderTitleService } from '../../services/header-title.service';

import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
interface HumanResource {
  id: number;
  nom: string;
  icon: string;
  effectif: number;
  jours: number;
}

interface MaterialResource {
  id: number;
  nom: string;
  icon: string;
  quantite: number;
}

@Component({
  selector: 'app-detail-ressource',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule,],
  templateUrl: './detail-ressource.page.html',
  styleUrls: ['./detail-ressource.page.scss']
})
export class DetailRessourcePage {
  humanResources: HumanResource[] = [
          { id: 1, nom: 'Masons', icon: 'people', effectif: 5, jours: 10 },
      { id: 2, nom: 'Electricians', icon: 'people', effectif: 2, jours: 7 }
  ];

  materialResources: MaterialResource[] = [
          { id: 1, nom: 'Concrete', icon: 'construct', quantite: 20 },
      { id: 2, nom: 'Bricks', icon: 'construct', quantite: 500 }
  ];

  addProfile() {
    console.log('Add Profile clicked');
  }

  addMaterial() {
    console.log('Add Material clicked');
  }

  confirm() {
    console.log('Confirm clicked');
  }
} 
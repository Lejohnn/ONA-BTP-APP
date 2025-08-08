import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ajout-equipement',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, FormsModule],
  templateUrl: './ajout-equipement.page.html',
  styleUrls: ['./ajout-equipement.page.scss']
})
export class AjoutEquipementPage {
  equipements = [
    { value: 'betonniere', label: 'Bétonnière', total: 5, disponible: 3 },
    { value: 'marteau', label: 'Marteau', total: 10, disponible: 7 },
    { value: 'pelle', label: 'Pelle', total: 8, disponible: 2 }
  ];
  equipementSelectionne: any = null;
  quantite: number | null = null;

  assigner() {
    console.log('Assign clicked', {
      equipement: this.equipementSelectionne,
      quantite: this.quantite
    });
  }
} 
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

interface Tache {
  id: number;
  nom: string;
  statut: 'Pending' | 'In Progress' | 'Done';
  dateDebut: string;
  dateFin: string;
}

@Component({
  selector: 'app-liste-taches',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './liste-taches.page.html',
  styleUrls: ['./liste-taches.page.scss']
})
export class ListeTachesPage {
  taches: Tache[] = [
    { id: 1, nom: 'Site Preparation', statut: 'Pending', dateDebut: '2024-07-15', dateFin: '2024-07-22' },
    { id: 2, nom: 'Foundation', statut: 'In Progress', dateDebut: '2024-07-23', dateFin: '2024-08-05' },
    { id: 3, nom: 'Structure', statut: 'Done', dateDebut: '2024-08-06', dateFin: '2024-09-01' }
  ];

  constructor(private router: Router) {}

  ajouterTache() {
    console.log('Ajouter tâche cliqué');
  }

  voirDetailTache(tacheId: number) {
    this.router.navigate(['/detail-tache', tacheId]);
  }
} 
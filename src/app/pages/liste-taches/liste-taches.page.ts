import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { HeaderTitleService } from '../../services/header-title.service';

interface Tache {
  id: number;
  nom: string;
  statut: 'Pending' | 'In Progress' | 'Done';
  dateDebut: string;
  dateFin: string;
}

@Component({
  selector: 'app-liste-taches',
  templateUrl: './liste-taches.page.html',
  styleUrls: ['./liste-taches.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class ListeTachesPage {
  taches = [
    { id: 1, nom: 'Préparer le terrain', statut: 'En cours', dateDebut: '2024-01-15', dateFin: '2024-01-20' },
    { id: 2, nom: 'Coulage béton', statut: 'À faire', dateDebut: '2024-01-21', dateFin: '2024-01-25' },
    { id: 3, nom: 'Pose échafaudage', statut: 'Terminé', dateDebut: '2024-01-10', dateFin: '2024-01-12' }
  ];

  constructor(
    private router: Router,
    private headerTitleService: HeaderTitleService
  ) {
    this.headerTitleService.setTitle('Liste des Tâches');
  }

  ajouterTache() {
    this.router.navigate(['/creer-tache']);
  }

  voirDetailTache(tacheId: number) {
    this.router.navigate(['/detail-tache', tacheId]);
  }
} 
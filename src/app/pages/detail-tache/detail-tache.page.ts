import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Resource {
  id: number;
  nom: string;
  quantite: number;
}

interface TacheDetail {
  id: number;
  nom: string;
  description: string;
  statut: 'Pending' | 'In Progress' | 'Done';
  dateDebut: string;
  dateFin: string;
  progression: number;
  sensibiliteMeteo: 'Haute' | 'Moyenne' | 'Basse';
  photos: string[];
  ressourcesHumaines: Resource[];
  ressourcesMaterielles: Resource[];
}

@Component({
  selector: 'app-detail-tache',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './detail-tache.page.html',
  styleUrls: ['./detail-tache.page.scss']
})
export class DetailTachePage {
  tache: TacheDetail = {
    id: 1,
    nom: 'Site Preparation',
    description: 'Préparation du site avant le début des travaux principaux. Cette étape est cruciale pour assurer une bonne fondation.',
    statut: 'Pending',
    dateDebut: '2024-07-15',
    dateFin: '2024-07-22',
    progression: 0.2,
    sensibiliteMeteo: 'Haute',
          photos: ['assets/images/taches/progressPhoto.webp'],
    ressourcesHumaines: [
      { id: 1, nom: 'Ouvriers', quantite: 5 },
      { id: 2, nom: 'Superviseurs', quantite: 1 }
    ],
    ressourcesMaterielles: [
      { id: 1, nom: 'Pelles', quantite: 3 },
      { id: 2, nom: 'Brouettes', quantite: 2 }
    ]
  };

  ajouterPhoto() {
    console.log('Ajouter/Modifier photo');
  }

  editerRessourcesHumaines() {
    console.log('Éditer ressources humaines');
  }

  editerRessourcesMaterielles() {
    console.log('Éditer ressources matérielles');
  }

  updateTask() {
    console.log('Mettre à jour la tâche');
  }

  returnTask() {
    console.log('Retourner la tâche');
  }
} 
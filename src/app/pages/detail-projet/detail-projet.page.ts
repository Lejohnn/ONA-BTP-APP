import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ProjetService, ProjetFigma } from '../../services/projet.service';
import { ToastController } from '@ionic/angular/standalone';
import { HeaderTitleService } from '../../services/header-title.service';

@Component({
  selector: 'app-detail-projet',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './detail-projet.page.html',
  styleUrls: ['./detail-projet.page.scss']
})
export class DetailProjetPage implements OnInit {
  projet: ProjetFigma | undefined;
  isLoading: boolean = true;
  errorMessage: string = '';
  keyIndicators: any[] = [];
  private projetId: number = 0;

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private projetService: ProjetService,
    private toastController: ToastController,
    private headerTitleService: HeaderTitleService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const projetId = params['id'];
      if (projetId) {
        this.projetId = Number(projetId);
        this.loadProjet(this.projetId);
      }
    });
    this.loadKeyIndicators();
  }

  loadProjet(id: number) {
    this.isLoading = true;
    this.errorMessage = '';

    this.projetService.getProjetById(id).subscribe({
      next: (projet) => {
        this.projet = projet;
        this.isLoading = false;
        // Mise à jour du titre avec le nom du projet
        if (projet?.nom) {
          this.headerTitleService.setTitle(`Détail Projet - ${projet.nom}`);
        } else {
          this.headerTitleService.setTitle('Détail Projet');
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement du projet:', error);
        this.errorMessage = 'Erreur lors du chargement du projet';
        this.isLoading = false;
      }
    });
  }

  getPageTitle(): string {
    if (this.projet?.nom) {
      return `ONA BTP - Détail Projet - ${this.projet.nom}`;
    }
    return 'ONA BTP - Détail Projet';
  }

  retryLoad() {
    this.loadProjet(this.projetId);
  }

  loadKeyIndicators() {
    this.keyIndicators = [
      { label: 'Ongoing', icon: 'play-circle', value: 12 },
      { label: 'Total', icon: 'stats-chart', value: 20 },
      { label: 'Not Started', icon: 'time', value: 8 },
      { label: 'Available Resources', icon: 'people-circle', value: 35 },
      { label: 'Workers Used', icon: 'construct', value: 18 },
      { label: 'Cash Balance', icon: 'wallet', value: '3,500,000 FCFA' }
    ];
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    toast.present();
  }

  setDefaultProjet(id: any) {}

  goToTaches() {
    // Navigation vers la page des tâches (à implémenter)
  }
  
  goToRessources() {}
  
  goToMeteo() {}
  
  goToJournal() {}
  
  goToCaisse() {
    if (this.projet) {
      this.router.navigate(['/module-caisse', this.projet.id]);
    }
  }
  
  goToMajProjet() {
    if (this.projet) {
      this.router.navigate(['/mise-a-jour-projet', this.projet.id]);
    }
  }

  onIndicatorClick(indicator: any) {
    switch (indicator.label) {
      case 'Total':
        this.router.navigate(['/liste-taches']);
        break;
      case 'Available Resources':
        this.router.navigate(['/detail-tache', 1]); // ID par défaut, à adapter selon vos besoins
        break;
      case 'Workers Used':
        this.router.navigate(['/creer-tache']);
        break;
      default:
        // Pas d'action pour les autres indicateurs
        break;
    }
  }
} 
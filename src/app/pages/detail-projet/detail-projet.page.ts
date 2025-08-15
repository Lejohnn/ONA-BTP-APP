import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { ToastController } from '@ionic/angular/standalone';
import { HeaderTitleService } from '../../services/header-title.service';
import { addIcons } from 'ionicons';
import { 
  playCircleOutline,
  listOutline,
  timeOutline,
  peopleOutline,
  constructOutline,
  walletOutline,
  locationOutline,
  calendarOutline,
  personOutline,
  businessOutline,
  alertCircleOutline,
  refreshOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-detail-projet',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './detail-projet.page.html',
  styleUrls: ['./detail-projet.page.scss']
})
export class DetailProjetPage implements OnInit {
  projet: Project | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  keyIndicators: any[] = [];
  private projetId: number = 0;

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private projectService: ProjectService,
    private toastController: ToastController,
    private headerTitleService: HeaderTitleService
  ) {
    // Initialisation des icônes Ionic
    addIcons({
      playCircleOutline,
      listOutline,
      timeOutline,
      peopleOutline,
      constructOutline,
      walletOutline,
      locationOutline,
      calendarOutline,
      personOutline,
      businessOutline,
      alertCircleOutline,
      refreshOutline
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const projetId = params['id'];
      if (projetId) {
        this.projetId = Number(projetId);
        this.loadProjet(this.projetId);
      }
    });
  }

  loadProjet(id: number) {
    this.isLoading = true;
    this.errorMessage = '';

    this.projectService.getProjectById(id).subscribe({
      next: (projet) => {
        this.projet = projet;
        this.isLoading = false;
        this.loadKeyIndicators();
        
        // Mise à jour du titre avec le nom du projet
        if (projet?.name) {
          this.headerTitleService.setTitle(`Détail Projet - ${projet.name}`);
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
    if (this.projet?.name) {
      return `ONA BTP - ${this.projet.name}`;
    }
    return 'ONA BTP - Détail Projet';
  }

  retryLoad() {
    this.loadProjet(this.projetId);
  }

  loadKeyIndicators() {
    if (!this.projet) return;

    this.keyIndicators = [
      // Ligne 1 : Tâches
      { 
        label: 'Tâches en cours', 
        icon: 'play-circle-outline', 
        value: this.projet.openTaskCount || 0,
        color: '#FCC15D',
        action: 'tasks'
      },
      { 
        label: 'Tâches totales', 
        icon: 'list-outline', 
        value: this.projet.taskCount || 0,
        color: '#FD5200',
        action: 'tasks'
      },
      { 
        label: 'Tâches non lancées', 
        icon: 'time-outline', 
        value: Math.max(0, (this.projet.taskCount || 0) - (this.projet.openTaskCount || 0) - (this.projet.closedTaskCount || 0)),
        color: '#8c755e',
        action: 'tasks'
      },
      // Ligne 2 : Ressources
      { 
        label: 'Ressources disponibles', 
        icon: 'people-outline', 
        value: this.projet.collaboratorCount || 0,
        color: '#FCC15D',
        action: 'resources'
      },
      { 
        label: 'Hommes utilisés', 
        icon: 'construct-outline', 
        value: Math.floor((this.projet.collaboratorCount || 0) * 0.7), // Simulation
        color: '#FD5200',
        action: 'resources'
      },
      // Finances
      { 
        label: 'Solde caisse/0 XAF', 
        icon: 'wallet-outline', 
        value: '2 000 000 XAF',
        color: '#FCC15D',
        action: 'caisse'
      }
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

  goToCaisse() {
    if (this.projet) {
      this.router.navigate(['/module-caisse', this.projet.id]);
    }
  }
  
  goToTaches() {
    if (this.projet) {
      this.router.navigate(['/tabs/liste-taches'], { queryParams: { projectId: this.projet.id } });
    }
  }
  
  goToRessources() {
    if (this.projet) {
      this.router.navigate(['/detail-ressource', this.projet.id]);
    }
  }

  onIndicatorClick(indicator: any) {
    switch (indicator.action) {
      case 'tasks':
        this.goToTaches();
        break;
      case 'resources':
        this.goToRessources();
        break;
      case 'caisse':
        this.goToCaisse();
        break;
      default:
        this.showToast(`Accès à ${indicator.label}`, 'primary');
        break;
    }
  }

  // Méthodes utilitaires pour l'affichage
  getProjectLocation(): string {
    if (!this.projet) return 'Non renseigné';
    
    // Simulation de localisation basée sur les données disponibles
    if (this.projet.partnerName) {
      return this.projet.partnerName;
    }
    return 'Douala, Cameroun'; // Valeur par défaut
  }

  getProjectBudget(): string {
    if (!this.projet) return 'Non renseigné';
    
    // Utiliser les données réelles du projet si disponibles
    if (this.projet.effectiveHours && this.projet.effectiveHours > 0) {
      // Simulation de budget basée sur les heures effectives
      const budgetPerHour = 50000; // 50 000 XAF par heure
      const totalBudget = this.projet.effectiveHours * budgetPerHour;
      return this.formatCurrency(totalBudget);
    }
    
    // Fallback basé sur le type de construction
    const budgets: { [key: string]: string } = {
      'Résidentiel': '15 000 000 XAF',
      'Commercial': '25 000 000 XAF',
      'Industriel': '50 000 000 XAF',
      'Institutionnel': '35 000 000 XAF'
    };
    
    return budgets[this.projet.constructionType] || '20 000 000 XAF';
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getProjectProgress(): number {
    if (!this.projet) return 0;
    return this.projet.progress || 0;
  }

  getProjectStateColor(): string {
    if (!this.projet) return '#8c755e';
    
    const stateColors: { [key: string]: string } = {
      'open': '#FCC15D',
      'close': '#FD5200',
      'pending': '#8c755e',
      'draft': '#8c755e'
    };
    
    return stateColors[this.projet.state] || '#8c755e';
  }
} 
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project.service';
import { Project } from '../../models/project.model';
import { ToastController } from '@ionic/angular/standalone';
import { HeaderTitleService } from '../../services/header-title.service';
import { addIcons } from 'ionicons';
import * as L from 'leaflet';
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
  refreshOutline,
  createOutline,
  mapOutline,
  checkmarkCircleOutline,
  documentTextOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-detail-projet',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './detail-projet.page.html',
  styleUrls: ['./detail-projet.page.scss']
})
export class DetailProjetPage implements OnInit, AfterViewInit {
  projet: Project | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  keyIndicators: any[] = [];
  private projetId: number = 0;
  private mapInitialized: boolean = false;

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
      refreshOutline,
      createOutline,
      mapOutline,
      checkmarkCircleOutline,
      documentTextOutline
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

  ngAfterViewInit() {
    console.log('🗺️ DetailProjetPage - ngAfterViewInit() appelé');
    // Initialiser la carte après que la vue soit chargée
    setTimeout(() => {
      console.log('🗺️ DetailProjetPage - Tentative d\'initialisation de la carte');
      this.initMap();
    }, 1000);
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
        
        // Initialiser la carte après le chargement des données
        setTimeout(() => {
          console.log('🗺️ Tentative d\'initialisation de la carte après chargement des données');
          this.initMap();
        }, 1000);
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
        value: Math.max(0, (this.projet.taskCount || 0) - (this.projet.openTaskCount || 0)),
        color: '#8c755e',
        action: 'tasks'
      },
      // Ligne 2 : Ressources et Finances
      { 
        label: 'Dépenses', 
        icon: 'wallet-outline', 
        value: this.projet.expenseCount || 0,
        color: '#FCC15D',
        action: 'expenses'
      },
      { 
        label: 'Heures réalisées', 
        icon: 'time-outline', 
        value: this.projet.effectiveHours || 0,
        color: '#FD5200',
        action: 'hours'
      },
      { 
        label: 'Solde caisse', 
        icon: 'wallet-outline', 
        value: '0 XAF',
        color: '#8c755e',
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
      case 'expenses':
        this.showToast(`Dépenses: ${indicator.value}`, 'primary');
        break;
      case 'hours':
        this.showToast(`Heures réalisées: ${indicator.value}h`, 'primary');
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

  // Nouvelle méthode pour afficher les informations du site
  getSiteInfo(): string {
    if (!this.projet) return 'Non renseigné';
    
    const parts = [];
    
    if (this.projet.siteArea && this.projet.siteArea > 0) {
      parts.push(`${this.projet.siteArea}m²`);
    }
    
    if (this.projet.siteLength && this.projet.siteWidth) {
      parts.push(`${this.projet.siteLength}m × ${this.projet.siteWidth}m`);
    }
    
    if (parts.length > 0) {
      return parts.join(' - ');
    }
    
    return 'Non renseigné';
  }

  // Méthode pour initialiser la carte
  initMap() {
    // Éviter les initialisations multiples
    if (this.mapInitialized) {
      console.log('🗺️ Carte déjà initialisée, ignoré');
      return;
    }
    
    console.log('🗺️ initMap() - Début de l\'initialisation');
    console.log('🗺️ Projet:', this.projet);
    console.log('🗺️ Latitude:', this.projet?.latitude, 'Longitude:', this.projet?.longitude);
    
    if (!this.projet?.latitude || !this.projet?.longitude) {
      console.warn('🗺️ Pas de coordonnées disponibles pour la carte');
      return;
    }
    
    try {
      const mapElement = document.getElementById('map');
      console.log('🗺️ Élément map trouvé:', !!mapElement);
      if (!mapElement) {
        console.warn('🗺️ Élément map non trouvé');
        return;
      }
      
      // Nettoyer le contenu existant
      mapElement.innerHTML = '';
      console.log('🗺️ Création de la carte...');
      
      // Configuration des icônes Leaflet pour éviter les erreurs 404
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'assets/marker-icon-2x.png',
        iconUrl: 'assets/marker-icon.png',
        shadowUrl: 'assets/marker-shadow.png',
      });
      
      const map = L.map('map').setView([this.projet.latitude, this.projet.longitude], 16);
      console.log('🗺️ Carte créée, ajout des tuiles...');
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      console.log('🗺️ Ajout du marqueur...');
      L.marker([this.projet.latitude, this.projet.longitude]).addTo(map)
        .bindPopup(this.projet.siteName || 'Site du projet').openPopup();
      
      console.log('🗺️ Carte initialisée avec succès');
      this.mapInitialized = true;
    } catch (error) {
      console.error('🗺️ Erreur lors de l\'initialisation de la carte:', error);
    }
  }


} 
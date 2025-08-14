import { Component } from '@angular/core';
import { 
  IonApp, 
  IonRouterOutlet, 
  IonMenu, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonList, 
  IonItem, 
  IonIcon, 
  IonLabel,
  IonMenuToggle
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  home, 
  business, 
  card, 
  person, 
  list, 
  settings, 
  wallet,
  homeOutline,
  businessOutline,
  walletOutline,
  personOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    IonApp, 
    IonRouterOutlet, 
    IonMenu, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonList, 
    IonItem, 
    IonIcon, 
    IonLabel,
    IonMenuToggle,
    CommonModule, 
    RouterModule
  ],
})
export class AppComponent {
  public appPages = [
    { title: 'Accueil', url: '/home', icon: 'home' },
    { title: 'Projets', url: '/tabs/projets', icon: 'business' },
    { title: 'Tâches', url: '/tabs/taches', icon: 'list' },
    { title: 'Caisse', url: '/tabs/caisse', icon: 'wallet' },
    { title: 'Paramètres', url: '/tabs/parametres', icon: 'settings' },
    { title: 'Profil', url: '/tabs/profile', icon: 'person' }
  ];

  constructor(private router: Router) {
    addIcons({ 
      home, 
      business, 
      card, 
      person, 
      list, 
      settings, 
      wallet,
      homeOutline,
      businessOutline,
      walletOutline,
      personOutline
    });
  }

  navigate(url: string) {
    this.router.navigate([url]);
  }
}

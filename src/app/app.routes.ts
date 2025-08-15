import { Routes } from '@angular/router';

export const routes: Routes = [
  // Routes sans tab bar (pages d'accueil et login)
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },

  // Route d'accès direct sans authentification
  {
    path: 'direct',
    loadComponent: () => import('./pages/liste-projets/liste-projets.page').then(m => m.ListeProjetsPage)
  },

  // Routes avec tab bar (pages principales de l'application)
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.page').then(m => m.DashboardPage)
      },
      {
        path: 'projets',
        loadComponent: () => import('./pages/liste-projets/liste-projets.page').then(m => m.ListeProjetsPage)
      },
      {
        path: 'taches',
        loadComponent: () => import('./pages/taches/taches.page').then(m => m.TachesPage)
      },

      {
        path: 'caisse',
        loadComponent: () => import('./pages/module-caisse/module-caisse.page').then(m => m.ModuleCaissePage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage)
      },
      {
        path: 'liste-taches',
        loadComponent: () => import('./pages/liste-taches/liste-taches.page').then(m => m.ListeTachesPage)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Routes pour les pages de détail (sans tab bar)
  {
    path: 'creer-tache',
    loadComponent: () => import('./pages/creer-tache/creer-tache.page').then(m => m.CreerTachePage)
  },
  {
    path: 'modifier-tache',
    loadComponent: () => import('./pages/modifier-tache/modifier-tache.page').then(m => m.ModifierTachePage)
  },
  {
    path: 'detail-projet/:id',
    loadComponent: () => import('./pages/detail-projet/detail-projet.page').then(m => m.DetailProjetPage)
  },
  {
    path: 'detail-tache/:id',
    loadComponent: () => import('./pages/detail-tache/detail-tache.page').then(m => m.DetailTachePage)
  },
  {
    path: 'detail-ressource/:id',
    loadComponent: () => import('./pages/detail-ressource/detail-ressource.page').then(m => m.DetailRessourcePage)
  },
  {
    path: 'assignation-ouvrier',
    loadComponent: () => import('./pages/assignation-ouvrier/assignation-ouvrier.page').then(m => m.AssignationOuvrierPage)
  },
  {
    path: 'ajout-equipement',
    loadComponent: () => import('./pages/ajout-equipement/ajout-equipement.page').then(m => m.AjoutEquipementPage)
  },
  {
    path: 'mise-a-jour-projet/:id',
    loadComponent: () => import('./pages/mise-a-jour-projet/mise-a-jour-projet.page').then(m => m.MiseAJourProjetPage)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.page').then( m => m.DashboardPage)
  }

];

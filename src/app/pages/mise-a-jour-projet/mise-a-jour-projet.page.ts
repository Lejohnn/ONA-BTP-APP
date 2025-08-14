import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { HeaderTitleService } from '../../services/header-title.service';

@Component({
  selector: 'app-mise-a-jour-projet',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './mise-a-jour-projet.page.html',
  styleUrls: ['./mise-a-jour-projet.page.scss']
})
export class MiseAJourProjetPage implements OnInit {
  majForm: FormGroup;
  etats = [
    { label: 'En cours', value: 'en_cours' },
    { label: 'En pause', value: 'en_pause' },
    { label: 'Retardé', value: 'retarde' },
    { label: 'Terminé', value: 'termine' }
  ];
  projetId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private headerTitleService: HeaderTitleService
  ) {
    this.headerTitleService.setTitle('Mise à Jour Projet');
    this.majForm = this.fb.group({
      etat: ['en_cours'],
      commentaire: ['']
    });
  }

  ngOnInit() {
    this.projetId = this.route.snapshot.paramMap.get('id');
  }

  validerMaj() {
    // Traitement de la mise à jour (à implémenter)
    this.router.navigate(['/detail-projet', this.projetId]);
  }
} 
import { Component } from '@angular/core';
import { HeaderTitleService } from '../../services/header-title.service';

import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
@Component({
  selector: 'app-taches',
  templateUrl: './taches.page.html',
  styleUrls: ['./taches.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule,]
})
export class TachesPage {} 
import { Component } from '@angular/core';
import { HeaderTitleService } from '../../services/header-title.service';

import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-parametres',
  templateUrl: './parametres.page.html',
  styleUrls: ['./parametres.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule,]
})
export class ParametresPage {} 
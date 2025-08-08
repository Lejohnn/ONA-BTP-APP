import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './parametres.page.html',
  styleUrls: ['./parametres.page.scss']
})
export class ParametresPage {} 
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-taches',
  standalone: true,
  imports: [IonicModule, CommonModule, RouterModule],
  templateUrl: './taches.page.html',
  styleUrls: ['./taches.page.scss']
})
export class TachesPage {} 
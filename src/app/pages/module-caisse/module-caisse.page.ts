import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-module-caisse',
  standalone: true,
  imports: [IonicModule, CommonModule],
  templateUrl: './module-caisse.page.html',
  styleUrls: ['./module-caisse.page.scss']
})
export class ModuleCaissePage {

  constructor(private toastService: ToastService) {}

  /**
   * Actualise la page
   */
  refreshPage(): void {
    this.toastService.showInfo('Module en cours de développement - Actualisation effectuée');
  }
} 
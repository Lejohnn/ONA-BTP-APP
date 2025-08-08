import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
  providedIn: 'root'
})
export class ToastService {

  constructor(private toastController: ToastController) {}

  /**
   * Affiche un toast avec un message et une couleur
   * @param message Le message à afficher
   * @param color La couleur du toast ('success', 'danger', 'warning', 'info')
   * @param duration La durée d'affichage en millisecondes (défaut: 3000)
   * @param position La position du toast ('top', 'middle', 'bottom')
   */
  async showToast(
    message: string, 
    color: 'success' | 'danger' | 'warning' | 'info' = 'info',
    duration: number = 3000,
    position: 'top' | 'middle' | 'bottom' = 'top'
  ): Promise<void> {
    try {
      console.log(`🍞 Toast: ${message} (${color})`);
      
      const toast = await this.toastController.create({
        message: message,
        duration: duration,
        color: color,
        position: position,
        buttons: [
          {
            text: '✕',
            role: 'cancel'
          }
        ],
        cssClass: `toast-${color}`
      });

      await toast.present();
      
      console.log('✅ Toast affiché avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'affichage du toast:', error);
    }
  }

  /**
   * Affiche un toast de bienvenue personnalisé avec le nom de l'utilisateur
   * @param userName Le nom de l'utilisateur
   */
  async showWelcomeToast(userName: string): Promise<void> {
    try {
      console.log(`🎉 Toast de bienvenue pour: ${userName}`);
      
      const welcomeMessage = `Bienvenue ${userName} ! 👋`;
      
      const toast = await this.toastController.create({
        message: welcomeMessage,
        duration: 4000,
        color: 'success',
        position: 'top',
        buttons: [
          {
            text: '✕',
            role: 'cancel'
          }
        ],
        cssClass: 'toast-welcome',
        icon: 'person-circle'
      });

      await toast.present();
      
      console.log('✅ Toast de bienvenue affiché avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'affichage du toast de bienvenue:', error);
    }
  }

  /**
   * Affiche un toast de succès
   */
  async showSuccess(message: string, duration: number = 3000): Promise<void> {
    await this.showToast(message, 'success', duration);
  }

  /**
   * Affiche un toast d'erreur
   */
  async showError(message: string, duration: number = 4000): Promise<void> {
    await this.showToast(message, 'danger', duration);
  }

  /**
   * Affiche un toast d'avertissement
   */
  async showWarning(message: string, duration: number = 3000): Promise<void> {
    await this.showToast(message, 'warning', duration);
  }

  /**
   * Affiche un toast d'information
   */
  async showInfo(message: string, duration: number = 3000): Promise<void> {
    await this.showToast(message, 'info', duration);
  }
}

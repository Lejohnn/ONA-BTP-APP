import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonContent],
})
export class HomePage {
  private timer: any;

  constructor(private router: Router) {}

  ngOnInit() {
    this.startTimer();
  }

  startTimer() {
    // Animation de 3 secondes puis redirection
    this.timer = setTimeout(() => {
      this.goToLogin();
    }, 3000);
  }

  goToLogin() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    // Utiliser replaceUrl pour éviter le retour en arrière
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  ngOnDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
}

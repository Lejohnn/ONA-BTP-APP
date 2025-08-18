import { Injectable } from '@angular/core';
import { addIcons } from 'ionicons';
import { 
  personCircle, 
  logInOutline, 
  refreshOutline, 
  calendarOutline, 
  timeOutline, 
  checkmarkCircleOutline, 
  analyticsOutline, 
  chevronForwardOutline, 
  addCircleOutline, 
  listOutline, 
  documentTextOutline, 
  trendingUpOutline, 
  locationOutline, 
  alertCircleOutline, 
  constructOutline, 
  eyeOutline,
  businessOutline,
  personOutline
} from 'ionicons/icons';

@Injectable({
  providedIn: 'root'
})
export class IconService {
  
  constructor() {
    this.initializeIcons();
  }

  private initializeIcons(): void {
    try {
      addIcons({
        'person-circle': personCircle,
        'log-in-outline': logInOutline,
        'refresh-outline': refreshOutline,
        'calendar-outline': calendarOutline,
        'time-outline': timeOutline,
        'checkmark-circle-outline': checkmarkCircleOutline,
        'analytics-outline': analyticsOutline,
        'chevron-forward-outline': chevronForwardOutline,
        'add-circle-outline': addCircleOutline,
        'list-outline': listOutline,
        'document-text-outline': documentTextOutline,
        'trending-up-outline': trendingUpOutline,
        'location-outline': locationOutline,
        'alert-circle-outline': alertCircleOutline,
        'construct-outline': constructOutline,
        'eye-outline': eyeOutline,
        'business-outline': businessOutline,
        'person-outline': personOutline,
        'add-outline': addCircleOutline,
        'warning-outline': alertCircleOutline
      });
      console.log('✅ Icônes Ionicons initialisées avec succès');
    } catch (error) {
      console.warn('⚠️ Erreur lors de l\'initialisation des icônes:', error);
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { ModalController, NavController } from '@ionic/angular';
import { TermsPage } from '../terms/terms.page';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: false
})
export class WelcomePage implements OnInit {
  
  // podemos guardar en localstorage después
  userHasAgreed: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private navCtrl: NavController
  ) { }

  ngOnInit() {}

  async presentTermsModal() {
  const modal = await this.modalCtrl.create({
    component: TermsPage,
    backdropDismiss: false
  });

  await modal.present();

  const { data } = await modal.onDidDismiss();

  if (data && data.accepted) {
      this.userHasAgreed = true;
      // GUARDAR ACA: así el navegador recuerda la decisión
      localStorage.setItem('hasAcceptedTerms', 'true'); 
      this.navCtrl.navigateForward('/login');
    }
}

  validateAndGo() {
    if (this.userHasAgreed) {
      this.navCtrl.navigateForward('/login');
    } else {
      this.presentTermsModal();
    }
  }
}

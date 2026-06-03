import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, NavController } from '@ionic/angular';
import { TermsPage } from '../terms/terms.page';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: false,
})
export class WelcomePage implements OnInit {

  userHasAgreed: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private router: Router
  ) { }

  ngOnInit() {
    if (localStorage.getItem('hasAcceptedTerms') === 'true') {
      this.navCtrl.navigateRoot('/login');
    }
  }

  /**
     * Presenta un modal con los términos y condiciones de la aplicación.
     * * Bloquea el cierre accidental del modal (`backdropDismiss: false`).
     * * Al aceptar, persiste la decisión en `localStorage` y redirige al usuario al login.
     * * @async
     * @function presentTermsModal
     * @returns {Promise<void>} Una promesa que se resuelve cuando el usuario cierra el modal y se procesa su decisión.
     */
  async presentTermsModal() {
    const modal = await this.modalCtrl.create({
      component: TermsPage,
      backdropDismiss: false
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.accepted) {
      this.userHasAgreed = true;
      localStorage.setItem('hasAcceptedTerms', 'true');
      this.navCtrl.navigateRoot('/login');
    }
  }

  /**
   * Abre el modal de términos y condiciones.
   * @function validateAndGo
   */
  validateAndGo() {
    this.presentTermsModal();
  }
}
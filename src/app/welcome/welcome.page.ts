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

  userHasAgreed: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private navCtrl: NavController
  ) { }

  ngOnInit() { }

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

    if (data && data.accepted) {
      this.userHasAgreed = true;
      // Realiza la persistencia
      localStorage.setItem('hasAcceptedTerms', 'true');
      this.navCtrl.navigateForward('/login');
    }
  }

  /**
   * Valida si el usuario ya aceptó los términos y condiciones.
   * * Si el usuario ya aceptó, navega directamente al login.
   * * Si no, invoca el flujo de aceptación mediante `presentTermsModal`.
   * @function validateAndGo
   */
  validateAndGo() {
    if (this.userHasAgreed) {
      this.navCtrl.navigateForward('/login');
    } else {
      this.presentTermsModal();
    }
  }
}
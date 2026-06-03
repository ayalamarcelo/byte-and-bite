import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-terms-modal',
  templateUrl: './terms.page.html',
  styleUrls: ['./terms.page.scss'],
  standalone: false
})
export class TermsPage {
  isAccepted: boolean = false;

  constructor(private modalCtrl: ModalController) { }

  /**
   * Cierra el modal de términos y condiciones y devuelve un estado de aceptación.
   * * @async
   * @function closeModal
   * @param {boolean} accepted - Indica si el usuario aceptó los términos (true) o canceló (false).
   * @returns {Promise<void>} Una promesa que se resuelve cuando el modal se ha cerrado correctamente.
   */
  async closeModal(accepted: boolean) {

    await this.modalCtrl.dismiss({
      'accepted': accepted
    });
  }
}
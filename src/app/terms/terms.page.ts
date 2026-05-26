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

  async dismiss(accepted: boolean) {

    await this.modalCtrl.dismiss({
      'accepted': accepted
    });
  }
}
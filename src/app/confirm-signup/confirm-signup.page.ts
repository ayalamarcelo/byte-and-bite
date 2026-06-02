import { Component, Input } from '@angular/core';
import { ModalController, AlertController, LoadingController } from '@ionic/angular';
import { confirmSignUp, resendSignUpCode, signIn } from 'aws-amplify/auth';

@Component({
  selector: 'app-confirm-signup',
  templateUrl: './confirm-signup.page.html',
  styleUrls: ['./confirm-signup.page.scss'],
  standalone: false
})
export class ConfirmSignupPage {
  @Input() email: string = ''; // Recibido desde el LoginPage
  @Input() password: string = '';
  code: string = '';

  constructor(
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  async handleConfirm() {
    const loading = await this.loadingController.create({
      message: 'Verifying code...',
    });
    await loading.present();

    try {
      await confirmSignUp({
        username: this.email,
        confirmationCode: this.code.trim()
      });

      await signIn({ username: this.email, password: this.password });
      await loading.dismiss();
      // Cerramos el modal avisando éxito
      this.modalCtrl.dismiss({ confirmed: true });

    } catch (error: any) {
      await loading.dismiss();
      this.presentAlert('Error', error.message || 'The code is incorrect.');
    }
  }

  async resend() {
    try {
      await resendSignUpCode({ username: this.email });
      this.presentAlert('Sent', 'A new code has been sent to your email.');
    } catch (error: any) {
      this.presentAlert('Error', 'Could not resend code. Try again later.');
    }
  }

  cancel() {
    this.modalCtrl.dismiss({ confirmed: false });
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
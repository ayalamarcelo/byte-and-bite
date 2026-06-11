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
  @Input() email: string = ''; 
  @Input() password: string = '';
  code: string = '';

  constructor(
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  /**
   * Envía el código de confirmación a AWS Amplify.
   * Si la confirmación es exitosa, realiza un inicio de sesión automático 
   * y cierra el modal devolviendo un estado de éxito.
   * @async
   * @function handleConfirm
   * @returns {Promise<void>}
   */
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
      this.modalCtrl.dismiss({ confirmed: true });

    } catch (error: any) {
      await loading.dismiss();
      this.presentAlert('Error', error.message || 'The code is incorrect.');
    }
  }

  /**
   * Solicita a AWS Amplify que reenvíe el código de verificación al correo del usuario.
   * @async
   * @function resend
   * @returns {Promise<void>}
   */
  async resend() {
    try {
      await resendSignUpCode({ username: this.email });
      this.presentAlert('Sent', 'A new code has been sent to your email.');
    } catch (error: any) {
      this.presentAlert('Error', 'Could not resend code. Try again later.');
    }
  }

  /**
   * Cierra el modal sin realizar ninguna acción de confirmación.
   * @function cancel
   * @returns {void}
   */
  cancel() {
    this.modalCtrl.dismiss({ confirmed: false });
  }

  /**
   * Muestra una alerta emergente estándar con un botón de aceptación.
   * @function presentAlert
   * @param {string} header - Título de la alerta.
   * @param {string} message - Cuerpo del mensaje a mostrar.
   * @returns {Promise<void>}
   */
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
import { Component, OnInit } from '@angular/core';
import { signUp } from 'aws-amplify/auth';
import { AlertController, LoadingController, NavController, ModalController } from '@ionic/angular';
import { ConfirmSignupPage } from '../confirm-signup/confirm-signup.page';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: false
})
export class SignupPage implements OnInit {

  name = '';
  lastname = '';
  email = '';
  password = '';
  repeatPassword = '';
  termsAccepted = false;
  showPassword = false;
  showRepeatPassword = false;

  /**
   * @function togglePasswordVisibility
   * @description Alterna la visibilidad de la contraseña o la repetición de contraseña cambiando el tipo de input.
   * @param {string} field - El campo a alternar ('password' o 'repeat').
   */
  togglePasswordVisibility(field: string) {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showRepeatPassword = !this.showRepeatPassword;
    }
  }

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController
  ) { }

  ngOnInit() { }

  /**
   * Ejecuta el proceso de registro del usuario.
   * * Realiza validaciones de campos (coincidencia de contraseñas, términos).
   * * Llama a `signUp` de Amplify y, tras el éxito, abre un modal de confirmación.
   * * @function handleSignUp
   * @async
   * @returns {Promise<void>}
   */
  async handleSignUp() {
    if (this.password !== this.repeatPassword) {
      this.presentAlert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    if (!this.termsAccepted) {
      this.presentAlert('Aviso', 'Debes aceptar los términos y condiciones.');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Creando tu cuenta...',
    });
    await loading.present();

    try {
      const { nextStep } = await signUp({
        username: this.email,
        password: this.password,
        options: {
          userAttributes: {
            email: this.email,
            given_name: this.name,
            family_name: this.lastname
          }
        }
      });

      await loading.dismiss();

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        const modal = await this.modalController.create({
          component: ConfirmSignupPage,
          componentProps: {
            email: this.email,
            password: this.password
          }
        });

        await modal.present();

        const { data } = await modal.onDidDismiss();

        if (data?.confirmed) {
          this.navCtrl.navigateRoot(['/tabs/home']);
        }
      }

    } catch (error: any) {
      await loading.dismiss();
      this.presentAlert('Error', error.message || 'Ocurrió un error en el registro');
    }
  }

  /**
   * Navega de vuelta a la página de login utilizando el controlador de navegación.
   * @function goToLogin
   * @returns {void}
   */
  goToLogin() {
    this.navCtrl.navigateBack('/login');
  }

  /**
   * Muestra una alerta emergente con un título y mensaje.
   * @function presentAlert
   * @async
   * @param {string} header - Título de la alerta.
   * @param {string} message - Descripción del error o aviso.
   * @returns {Promise<void>}
   */
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header, message, buttons: ['OK'],
    });
    await alert.present();
  }
}
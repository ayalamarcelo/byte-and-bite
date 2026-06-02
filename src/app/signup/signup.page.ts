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

  // variables para el formulario
  name = '';
  lastname = '';
  email = '';
  password = '';
  repeatPassword = '';
  termsAccepted = false;

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController
  ) { }

  ngOnInit() { }

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
        // Abrimos el modal directamente al terminar el registro
        const modal = await this.modalController.create({
          component: ConfirmSignupPage,
          componentProps: {
            email: this.email, // Pasamos el email para que el usuario no tenga que escribirlo de nuevo
            password: this.password
          }
        });

        await modal.present();

        // Esperamos a que el usuario termine en el modal
        const { data } = await modal.onDidDismiss();

        // Si el usuario confirmó exitosamente, navegamos al login o al home
        if (data?.confirmed) {
          this.navCtrl.navigateRoot(['/tabs/home']);
        }
      }

    } catch (error: any) {
      await loading.dismiss();
      // console.error('Error en SignUp:', error);
      this.presentAlert('Error', error.message || 'Ocurrió un error en el registro');
    }
  }

  //Navega de vuelta al login con animación de retroceso
  goToLogin() {
    this.navCtrl.navigateBack('/login');
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header, message, buttons: ['OK'],
    });
    await alert.present();
  }
}
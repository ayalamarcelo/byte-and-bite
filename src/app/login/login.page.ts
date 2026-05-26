import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { signIn } from 'aws-amplify/auth';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { ConfirmSignupPage } from '../confirm-signup/confirm-signup.page';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {

  // variables para el formulario
  email = '';
  password = '';

  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController
  ) { }

  ngOnInit() { }

  async continueWithGoogle() {
    try {
      // acá va el await signInWithRedirect({ provider: 'Google' });
      // por ahora, simulamos la espera y lanzamos el aviso
      console.log('Starting with Google...');

      // lanzamos mensaje informativo
      this.presentAlert(
        'Coming soon',
        'Google Sign-In will be available after configuring the credentials in the Google Cloud Console.'
      );

    } catch (error: any) {
      console.error('Google Login Error:', error);
      this.presentAlert('Error', 'Could not connect to Google at this time.');
    }
  }

  async handleLogin() {
    const loading = await this.loadingController.create({
      message: 'Logging in...',
    });
    await loading.present();

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: this.email,
        password: this.password
      });

      console.log('Login successful. Next step:', nextStep.signInStep);
      await loading.dismiss();

      if (isSignedIn) {
        // usuario autenticado completamente
        this.router.navigate(['/tabs/home'], { replaceUrl: true });
      } else {
        // manejo de estados intermedios de cognito
        switch (nextStep.signInStep) {
          case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
            this.presentAlert('New password', 'Your user was created in the console and requires you to change your temporary password.');
            break;
          // lo envio para confirmar
          case 'CONFIRM_SIGN_UP':
            await loading.dismiss(); // quita el loading antes de mostrar el modal

            const modal = await this.modalController.create({
              component: ConfirmSignupPage,
              componentProps: {
                email: this.email // pasamos el email como @Input al modal
              }
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();

            if (data?.confirmed) {
              // si el usuario se confirmó con éxito en el modal
              this.presentAlert('Verified', 'Your account is active. You can login now.');
            }
            break;

          case 'DONE':
            this.router.navigate(['/tabs/home'], { replaceUrl: true });
            break;

          default:
            console.warn('Unhandled step:', nextStep.signInStep);
            break;
        }
      }

    } catch (error: any) {
      await loading.dismiss();
      console.error('Login Error:', error);

      // muestras el mensaje de error real que viene de AWS
      this.presentAlert('Error', error.message || 'Incorrect credentials');
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  goToWelcome() { this.router.navigate(['/welcome']); }
  goToSignUp() { this.router.navigate(['/signup']); }
}
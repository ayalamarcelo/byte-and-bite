import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { signIn } from 'aws-amplify/auth';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { ConfirmSignupPage } from '../confirm-signup/confirm-signup.page';
import { signInWithRedirect } from 'aws-amplify/auth';

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
      // Al ejecutar esta función, Amplify abrirá el navegador del sistema
      // hacia la URL de login de Cognito 
      await signInWithRedirect({
        provider: 'Google'
      });
    } catch (error: any) {
      console.error('Error al iniciar sesión con Google:', error);
      this.presentAlert('Error', 'No se pudo conectar con Google en este momento.');
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
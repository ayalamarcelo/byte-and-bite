import { Component, OnInit } from '@angular/core';
/* import { Router } from '@angular/router'; */
import { signIn } from 'aws-amplify/auth';
import { AlertController, LoadingController, ModalController, NavController } from '@ionic/angular';
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
    private navCtrl: NavController,
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

      await loading.dismiss();

      if (isSignedIn) {
        this.navCtrl.navigateRoot(['/tabs/home'], { replaceUrl: true });
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        this.presentAlert('New password', 'Your user requires you to change your temporary password.');
      } else {
        console.warn('Unhandled step:', nextStep.signInStep);
      }

    } catch (error: any) {
      await loading.dismiss();
      console.error('Login Error:', error);

      // Si el usuario intenta loguearse antes de confirmar, Amplify lanzará este error.
      // Primero debe confirmar su cuenta.
      if (error.name === 'UserNotConfirmedException') {
        this.presentAlert('Not confirmed', 'Please check your email to confirm your account.');
      } else {
        this.presentAlert('Error', error.message || 'Incorrect credentials');
      }
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

  goToWelcome() { this.navCtrl.navigateBack(['/welcome']); }
  goToSignUp() { this.navCtrl.navigateForward(['/signup']); }
}
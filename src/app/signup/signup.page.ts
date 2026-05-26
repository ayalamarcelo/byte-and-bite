import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { signUp } from 'aws-amplify/auth';
import { AlertController, LoadingController } from '@ionic/angular';

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
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController
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
        username: this.email, // es el mail, cognito lo usa como username
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
        this.presentAlert('¡Casi listo!', 'Revisa tu email. Te enviamos un código de confirmación.');
        // acá podemos ir a una página de verificación o a la consola de aws
      }

    } catch (error: any) {
      await loading.dismiss();
      console.error('Error en SignUp:', error);
      this.presentAlert('Error', error.message || 'Ocurrió un error en el registro');
    }
  }

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header, message, buttons: ['OK'],
    });
    await alert.present();
  }
}
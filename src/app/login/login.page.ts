import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { signIn } from 'aws-amplify/auth';
import { AlertController, LoadingController } from '@ionic/angular';

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
    private loadingController: LoadingController
  ) { }

  ngOnInit() { }

  async continueWithGoogle() {
    try {
      // acá va el await signInWithRedirect({ provider: 'Google' });
      // por ahora, simulamos la espera y lanzamos el aviso
      console.log('Iniciando flujo de Google...');

      // lanzamos mensaje informativo
      this.presentAlert(
        'Próximamente',
        'El inicio de sesión con Google estará disponible tras configurar las credenciales en la consola de Google Cloud.'
      );

    } catch (error: any) {
      console.error('Error en Google Login:', error);
      this.presentAlert('Error', 'No se pudo conectar con Google en este momento.');
    }
  }

  async handleLogin() {
    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
    });
    await loading.present();

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: this.email,
        password: this.password
      });

      console.log('Login exitoso. Paso siguiente:', nextStep.signInStep);
      await loading.dismiss();

      if (isSignedIn) {
        // usuario autenticado completamente
        this.router.navigate(['/tabs/home']);
      } else {
        // manejo de estados intermedios de cognito
        switch (nextStep.signInStep) {
          case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
            this.presentAlert('Nueva Contraseña', 'Tu usuario fue creado en la consola y requiere que cambies la contraseña temporal.');
            break;

          case 'CONFIRM_SIGN_UP':
            this.presentAlert('Verificación', 'Debes confirmar tu cuenta con el código enviado a tu email.');
            // this.router.navigate(['/confirm-signup']);
            break;

          case 'DONE':
            this.router.navigate(['/tabs/home']);
            break;

          default:
            console.warn('Paso no manejado:', nextStep.signInStep);
            break;
        }
      }

    } catch (error: any) {
      await loading.dismiss();
      console.error('Error en login:', error);

      // muestras el mensaje de error real que viene de AWS
      this.presentAlert('Error', error.message || 'Credenciales incorrectas');
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
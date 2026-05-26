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
      console.log('Iniciando sesión con Google...');

      // lanzamos mensaje informativo
      this.presentAlert(
        'Próximamente',
        'El inicio de sesión de Google se habilitará tras configurar las credenciales en la consola de Google Cloud.'
      );

    } catch (error: any) {
      console.error('Error al iniciar sesión con Google:', error);
      this.presentAlert('Error', 'Inténtalo de nuevo más tarde.');
    }
  }

  async handleLogin() {
    const loading = await this.loadingController.create({
      message: 'Accediendo...',
    });
    await loading.present();

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: this.email,
        password: this.password
      });

      console.log('Se ha iniciado sesión correctamente. Siguiente paso', nextStep.signInStep);
      await loading.dismiss();

      if (isSignedIn) {
        // usuario autenticado completamente
        this.router.navigate(['/tabs/home'], { replaceUrl: true });
      } else {
        // manejo de estados intermedios de cognito
        switch (nextStep.signInStep) {
          case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
            this.presentAlert('Nueva contraseña', 'Tu usuario ha sido creado en la consola y requiere que cambies tu contraseña temporal.');
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
              this.presentAlert('Verificado', 'Su cuenta está activa. Ya puede iniciar sesión.');
            }
            break;

          case 'DONE':
            this.router.navigate(['/tabs/home'], { replaceUrl: true });
            break;

          default:
            console.warn('Paso no definido:', nextStep.signInStep);
            break;
        }
      }

    } catch (error: any) {
      await loading.dismiss();
      console.error('Error de inicio de sesión:', error);

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
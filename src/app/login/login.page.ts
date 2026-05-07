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

  async handleLogin() {
    // cargando...
    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
    });
    await loading.present();

    try {
      // llamada a cognito
      // username suele ser el email config en AWS
      const { isSignedIn, nextStep } = await signIn({
        username: this.email,
        password: this.password
      });

      await loading.dismiss();

      if (isSignedIn) {
        // 3. Si todo ok, vamos al home
        this.router.navigate(['/tabs/home']);
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        // el usuario no validó su email todavía
        this.presentAlert('Aviso', 'Debes confirmar tu cuenta con el código enviado a tu email.');
        // redirigimos a una página de confirmación
      }

    } catch (error: any) {
      await loading.dismiss();
      console.error('Error en login:', error);
      this.presentAlert('Error', error.message || 'Credenciales incorrectas');
    }
  }

  // función auxiliar para mostrar errores
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
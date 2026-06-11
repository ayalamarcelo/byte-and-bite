import { Component, OnInit } from '@angular/core';
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

  email = '';
  password = '';
  showPassword = false;

  /**
   * @function togglePasswordVisibility
   * @description Alterna la visibilidad de la contraseña cambiando el tipo de input entre 'password' y 'text'.
   */
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  constructor(
    private navCtrl: NavController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController
  ) { }

  ngOnInit() { }

  /**
 * Gestiona el proceso de autenticación del usuario.
 * Este método invoca el servicio de autenticación de Amplify, maneja los estados de carga,
 * las redirecciones tras un inicio de sesión exitoso y gestiona los flujos de 
 * autenticación multifactor o cambios de contraseña obligatorios.
 * @function handleLogin
 * @async
 * @returns {Promise<void>} No retorna valor, realiza navegación o muestra alertas.
 * @throws {UserNotConfirmedException} Si el usuario no ha verificado su correo electrónico.
 * @throws {AuthError} Errores genéricos de credenciales inválidas u otros fallos del servicio.
 */
  async handleLogin() {
    const loading = await this.loadingController.create({
      message: 'Iniciando Sesión...',
    });
    await loading.present();

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: this.email,
        password: this.password
      });

      await loading.dismiss();

      if (isSignedIn) {
        this.navCtrl.navigateRoot('/tabs/home', {
          animated: true,
          animationDirection: 'forward'
        });
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        this.presentAlert('New password', 'Your user requires you to change your temporary password.');
      } else {
        console.warn('Unhandled step:', nextStep.signInStep);
      }

    } catch (error: any) {
      await loading.dismiss();
      console.error('Login Error:', error);

      if (error.name === 'UserNotConfirmedException') {
        this.presentAlert('Not confirmed', 'Please check your email to confirm your account.');
      } else {
        this.presentAlert('Error', error.message || 'Incorrect credentials');
      }
    }
  }

  /**
 * Muestra una alerta emergente (toast/modal) al usuario.
 * * Utiliza el `AlertController` de Ionic para desplegar un aviso con un botón de confirmación.
 * * @function presentAlert
 * @async
 * @param {string} header - El título o encabezado que aparecerá en la parte superior de la alerta.
 * @param {string} message - El cuerpo del mensaje informativo para el usuario.
 * @returns {Promise<void>} Una promesa que se resuelve cuando la alerta ha sido presentada.
 */
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  /**
 * Navega hacia atrás en la pila de navegación hasta la página de bienvenida.
 * * Utiliza `navCtrl.navigateBack` para asegurar una transición visual correcta (animación de retroceso).
 * @function goToWelcome
 * @returns {void}
 */
  goToWelcome() {
    this.navCtrl.navigateBack('/welcome');
  }

  /**
   * Navega hacia adelante en la pila de navegación hacia la página de registro.
   * * Utiliza `navCtrl.navigateForward` para apilar la vista y permitir el regreso a la página anterior.
   * @function goToSignUp
   * @returns {void}
   */
  goToSignUp() {
    this.navCtrl.navigateForward('/signup');
  }
}
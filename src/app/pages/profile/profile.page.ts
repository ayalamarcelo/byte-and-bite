import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { AuthService } from '../../services/auth';
import { addIcons } from 'ionicons';
import { createOutline, globeOutline } from 'ionicons/icons';
import { UserService } from '../../services/user.service';
import { LanguageService } from '../../services/language.service';
import { AvatarService } from '../../services/avatar.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActionSheetController } from '@ionic/angular';
import { NavController } from '@ionic/angular';
import { fetchUserAttributes, updatePassword, getCurrentUser, signOut } from 'aws-amplify/auth';
import { FirebaseService } from '../../services/firebase.service';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {
  edad: number = 25;
  peso: number = 68;
  altura: number = 1.78;

  userEmail: string = 'Cargando...';
  userId: string = '';
  oldPasswordInput: string = '';
  newPasswordInput: string = '';

  isModalOpen: boolean = false;
  campoEditando: string = '';
  valorTemporal: any = 0; 

  alertasActivas: boolean = false;
  recordatoriosActivos: boolean = true;

  isMenuOpen = false;

  showOldPassword: boolean = false;
  showNewPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private alertController: AlertController,
    public userService: UserService,
    public languageService: LanguageService,
    public avatarService: AvatarService,
    private actionSheetCtrl: ActionSheetController,
    private firebaseService: FirebaseService,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController
  ) {
    addIcons({ createOutline, globeOutline });
  }

  /**
   * @function ngOnInit
   * @description La función será ejecutada automáticamente al inicializar la pantalla de perfil.
   * Obtiene de forma asíncrona el identificador único de AWS Cognito, descarga las propiedades físicas desde Firebase y mapea el email de la cuenta.
   */

  async ngOnInit() {
    try {
      const user = await getCurrentUser();
      this.userId = user.userId;
      await this.cargarPerfilUsuario();

      await Promise.all([
      this.cargarEmailUsuario(),
      this.userService.loadUserData(),
    ]);
    } catch (e) {
      console.log('No hay usuario logueado o error obteniendo ID', e);
    }

    console.log("Datos cargados correctamente");
  }

  /**
   * @function cargarPerfilUsuario
   * @description La función será ejecutada internamente después de validar la sesión activa del usuario.
   * Consulta el documento de FirebaseService para restaurar la edad, peso, altura y la URL remota de la foto de perfil en la UI.
   */
  async cargarPerfilUsuario() {
    if (this.userId) {
      const perfil = await this.firebaseService.getProfile(this.userId);
      if (perfil) {
        if (perfil['edad'] !== undefined) this.edad = perfil['edad'];
        if (perfil['peso'] !== undefined) this.peso = perfil['peso'];
        if (perfil['altura'] !== undefined) this.altura = perfil['altura'];
        if (perfil['avatarUrl']) {
          this.avatarService.updateAvatar(perfil['avatarUrl']);
        }
      }
    }
  }


  /**
   * @function cargarEmailUsuario
   * @description La función será ejecutada para consultar los atributos de seguridad del proveedor de identidad.
   * Invoca de forma asíncrona el método fetchUserAttributes de AWS Amplify para extraer y pintar el correo del usuario en la vista.
   */

  async cargarEmailUsuario() {
    try {
      const attributes = await fetchUserAttributes();
      this.userEmail = attributes.email || 'Email no disponible';
    } catch (error) {
      console.error('Error al obtener atributos de AWS:', error);
      this.userEmail = 'Error de conexión';
    }
  }

  /**
   * @function actualizarPasswordCognito
   * @description La función será ejecutada cuando el usuario confirme el cambio de sus credenciales de acceso.
   * Envía las contraseñas actual y nueva al pool de usuarios de AWS Cognito y notifica mediante una alerta el éxito o rechazo del servidor.
   */
  async actualizarPasswordCognito() {
    if (!this.oldPasswordInput || !this.newPasswordInput) {
      this.presentAlert('Aviso', 'Debes ingresar tu contraseña actual y la nueva.');
      return;
    }

    try {
      await updatePassword({
        oldPassword: this.oldPasswordInput,
        newPassword: this.newPasswordInput
      });
      this.presentAlert('Éxito', 'Tu contraseña ha sido actualizada correctamente.');
      this.isModalOpen = false;
      this.oldPasswordInput = '';
      this.newPasswordInput = '';

    } catch (error: any) {
      console.error('Error actualizando contraseña:', error);
      this.presentAlert('Error', error.message || 'No se pudo actualizar la contraseña.');
    }
  }


  /**
   * @function openEditModal
   * @description La función será ejecutada cuando el usuario presione el botón de edición en cualquier tarjeta de información del perfil.
   * Configura la variable de control de campo, respalda los valores numéricos actuales o inicializa el formulario limpio para el cambio de credenciales.
   */
  openEditModal(campo: string) {
    this.campoEditando = campo;
    this.isModalOpen = true;

    if (campo === 'edad') this.valorTemporal = this.edad;
    if (campo === 'peso') this.valorTemporal = this.peso;
    if (campo === 'altura') this.valorTemporal = this.altura;
    if (campo === 'contrasena') {
      this.oldPasswordInput = '';
      this.newPasswordInput = '';
      this.showOldPassword = false;
      this.showNewPassword = false;
    }
  }

  /**
   * @function togglePasswordVisibility
   * @description La función será ejecutada cuando el usuario interactúe con el icono del ojo en los formularios de claves.
   * Alterna las propiedades lógicas booleanas para modificar de forma dinámica el tipo de input del DOM entre 'text' y 'password'.
   */
  togglePasswordVisibility(campo: 'old' | 'new') {
    if (campo === 'old') {
      this.showOldPassword = !this.showOldPassword;
    } else {
      this.showNewPassword = !this.showNewPassword;
    }
  }

  /**
   * @function saveChanges
   * @description La función será ejecutada cuando el usuario presione el botón de Guardar dentro de la ventana de diálogo interactiva.
   * Transfiere el dato temporal al estado de las propiedades físicas y actualiza asíncronamente el documento del perfil en Google Firebase Firestore.
   */
  async saveChanges() {
    if (this.campoEditando === 'contrasena') {
      this.actualizarPasswordCognito();
      return;
    }

    if (this.campoEditando === 'edad') this.edad = this.valorTemporal;
    if (this.campoEditando === 'peso') this.peso = this.valorTemporal;
    if (this.campoEditando === 'altura') this.altura = this.valorTemporal;

    if (this.userId && ['edad', 'peso', 'altura'].includes(this.campoEditando)) {
      try {
        await this.firebaseService.updateProfile(this.userId, {
          edad: this.edad,
          peso: this.peso,
          altura: this.altura
        });
      } catch (error) {
        console.error('Error guardando perfil en Firebase', error);
      }
    }

    this.isModalOpen = false;
  }


  /**
   * @function presentAlert
   * @description La función será ejecutada internamente para instanciar componentes flotantes emergentes nativos de la interfaz de Ionic.
   * Muestra un cuadro de diálogo contextualizado pasando un título y descripción con un botón único de descarte interactivo.
   */
  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * @function idiomaSeleccionado
   * @description La función actúa como un getter reactivo para mapear el código lingüístico activo de la aplicación.
   * Interroga al LanguageService para retornar la abreviación del idioma (ej: 'es' o 'en') que gobierna las traducciones del template.
   */
  get idiomaSeleccionado() {
    return this.languageService.getCurrentLang();
  }

  /**
   * @function cambiarIdioma
   * @description La función será ejecutada cuando el usuario elija una opción distinta en el selector desplegable de idiomas.
   * Pasa el nuevo valor String al LanguageService para mutar de forma instantánea todos los diccionarios de traducción de la app.
   */
  cambiarIdioma(event: any) {
    this.languageService.setLanguage(event.detail.value);
  }


  /**
   * @function ejecutarCamara
   * @description La función será ejecutada de forma asíncrona para interactuar con los recursos de captura nativos del ecosistema móvil.
   * Lanza el SDK de Capacitor Camera para obtener una imagen (DataUrl), actualiza localmente la interfaz e inicia el proceso de carga en Firebase Storage.
   */
  async ejecutarCamara(usarCamara: boolean) {
    this.isMenuOpen = false; 

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: usarCamara ? CameraSource.Camera : CameraSource.Photos
      });

      if (image.dataUrl) {
        this.avatarService.updateAvatar(image.dataUrl);
        
        if (this.userId) {
          const remoteUrl = await this.firebaseService.uploadAvatar(this.userId, image.dataUrl);
          this.avatarService.updateAvatar(remoteUrl);
        }
      }
    } catch (e) {
      console.log("Acción cancelada");
    }
  }

  /**
   * @function abrirMenuOpciones
   * @description La función será ejecutada para componer y desplegar una hoja de acciones nativa (ActionSheetController) en la parte inferior.
   * Ofrece de manera elegante al usuario las opciones táctiles de activar la Cámara, abrir la Galería multimedia o abortar la operación.
   */

  async abrirMenuOpciones() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar imagen',
      buttons: [
        {
          text: 'Cámara',
          icon: 'camera',
          handler: () => this.ejecutarCamara(true)
        },
        {
          text: 'Galería',
          icon: 'image',
          handler: () => this.ejecutarCamara(false)
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  /**
   * @function cerrarSesion
   * @description La función será ejecutada cuando el usuario haga click en el botón de deslogueo o abandono de cuenta.
   * Introduce un retardo de tiempo de un segundo para suavizar la animación estética de salida y cierra la sesión en AWS Amplify.
   */
  async cerrarSesion() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.authService.logout();
  }
}
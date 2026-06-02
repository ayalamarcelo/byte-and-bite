import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController } from '@ionic/angular';
import { AuthService } from '../services/auth';
import { addIcons } from 'ionicons';
import { createOutline, globeOutline } from 'ionicons/icons';
import { UserService } from '../services/user.service';
import { LanguageService } from '../services/language.service';

import { TranslateService } from '@ngx-translate/core';
import { AvatarService } from '../services/avatar.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActionSheetController } from '@ionic/angular';
import { NavController } from '@ionic/angular';

// Importaciones de AWS Amplify
import { fetchUserAttributes, updatePassword, getCurrentUser, signOut } from 'aws-amplify/auth';
import { FirebaseService } from '../services/firebase.service';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {
  // Datos Físicos
  edad: number = 25;
  peso: number = 68;
  altura: number = 1.78;

  // Datos de Cuenta (AWS Amplify)
  userEmail: string = 'Cargando...';
  userId: string = '';
  oldPasswordInput: string = '';
  newPasswordInput: string = '';

  // Control del Modal
  isModalOpen: boolean = false;
  campoEditando: string = '';
  valorTemporal: any = 0; // Cambiado a 'any' para soportar tanto números (edad) como texto   

  // Preferencias
  alertasActivas: boolean = false;
  recordatoriosActivos: boolean = true;

  // menu
  isMenuOpen = false;

  showOldPassword: boolean = false;
  showNewPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private alertController: AlertController, // Agregado para los mensajes de éxito/error
    public userService: UserService,
    public languageService: LanguageService,
    public avatarService: AvatarService,
    private actionSheetCtrl: ActionSheetController,
    private firebaseService: FirebaseService,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController
  ) {
    // Aseguramos que los iconos estén registrados
    addIcons({ createOutline, globeOutline });
  }

  async ngOnInit() {
    try {
      const user = await getCurrentUser();
      this.userId = user.userId;
      await this.cargarPerfilUsuario();
    } catch (e) {
      console.log('No hay usuario logueado o error obteniendo ID', e);
    }

    await Promise.all([
      this.cargarEmailUsuario(),
      this.userService.loadUserData(),
    ]);

    console.log("Datos cargados correctamente");
  }

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

  // ==========================================
  // LÓGICA DE SEGURIDAD (AWS COGNITO)
  // ==========================================

  async cargarEmailUsuario() {
    try {
      const attributes = await fetchUserAttributes();
      this.userEmail = attributes.email || 'Email no disponible';
    } catch (error) {
      console.error('Error al obtener atributos de AWS:', error);
      this.userEmail = 'Error de conexión';
    }
  }

  async actualizarPasswordCognito() {
    if (!this.oldPasswordInput || !this.newPasswordInput) {
      this.presentAlert('Aviso', 'Debes ingresar tu contraseña actual y la nueva.');
      return;
    }

    try {
      // Impacta directamente en el backend de AWS
      await updatePassword({
        oldPassword: this.oldPasswordInput,
        newPassword: this.newPasswordInput
      });

      this.presentAlert('Éxito', 'Tu contraseña ha sido actualizada correctamente.');

      // Cerramos modal y limpiamos campos por seguridad
      this.isModalOpen = false;
      this.oldPasswordInput = '';
      this.newPasswordInput = '';

    } catch (error: any) {
      console.error('Error actualizando contraseña:', error);
      this.presentAlert('Error', error.message || 'No se pudo actualizar la contraseña.');
    }
  }

  // ==========================================
  // LÓGICA DE LA INTERFAZ Y MODAL
  // ==========================================

  openEditModal(campo: string) {
    this.campoEditando = campo;
    this.isModalOpen = true;

    if (campo === 'edad') this.valorTemporal = this.edad;
    if (campo === 'peso') this.valorTemporal = this.peso;
    if (campo === 'altura') this.valorTemporal = this.altura;
    if (campo === 'contrasena') {
      // Limpiamos los inputs temporales antes de abrir el modal
      this.oldPasswordInput = '';
      this.newPasswordInput = '';
      this.showOldPassword = false;
      this.showNewPassword = false;
    }
  }

  togglePasswordVisibility(campo: 'old' | 'new') {
    if (campo === 'old') {
      this.showOldPassword = !this.showOldPassword;
    } else {
      this.showNewPassword = !this.showNewPassword;
    }
  }

  async saveChanges() {
    // Si estamos editando la contraseña, delegamos la acción a AWS y salimos de la función
    if (this.campoEditando === 'contrasena') {
      this.actualizarPasswordCognito();
      return;
    }

    // Si son datos físicos, se actualizan las variables locales
    if (this.campoEditando === 'edad') this.edad = this.valorTemporal;
    if (this.campoEditando === 'peso') this.peso = this.valorTemporal;
    if (this.campoEditando === 'altura') this.altura = this.valorTemporal;

    // Persistir en Firebase si tenemos el ID del usuario
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

  onToggleChange(tipo: string) {
    const estado = tipo === 'recordatorios' ? this.recordatoriosActivos : this.alertasActivas;
    console.log(`Estado de ${tipo}:`, estado);
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  async presentAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  get idiomaSeleccionado() {
    return this.languageService.getCurrentLang();
  }

  cambiarIdioma(event: any) {
    this.languageService.setLanguage(event.detail.value);
  }

  // LOGICA PARA CAMBIAR IMAGEN DE PERFIL

  abrirMenu() {
    this.isMenuOpen = true;
  }

  async ejecutarCamara(usarCamara: boolean) {
    this.isMenuOpen = false; // Cerramos nuestro menú

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        // Aquí forzamos una opción u otra, ya no usamos Prompt
        source: usarCamara ? CameraSource.Camera : CameraSource.Photos
      });

      if (image.dataUrl) {
        this.avatarService.updateAvatar(image.dataUrl); // Actualización visual rápida
        if (this.userId) {
          const remoteUrl = await this.firebaseService.uploadAvatar(this.userId, image.dataUrl);
          this.avatarService.updateAvatar(remoteUrl);
        }
      }
    } catch (e) {
      // Si el usuario cancela en el menú NATIVO, cae aquí.
      console.log("Cancelado");
    }
  }

  async ejecutarSeleccion(usarCamara: boolean) {
    this.isMenuOpen = false;

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: usarCamara ? CameraSource.Camera : CameraSource.Photos
      });

      if (image.dataUrl) {
        this.avatarService.updateAvatar(image.dataUrl); // Actualización visual rápida
        if (this.userId) {
          const remoteUrl = await this.firebaseService.uploadAvatar(this.userId, image.dataUrl);
          this.avatarService.updateAvatar(remoteUrl);
        }
      }
    } catch (e) {
      console.log("Acción cancelada");
    }
  }

  async abrirMenuOpciones() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar imagen',
      buttons: [
        {
          text: 'Cámara',
          icon: 'camera',
          handler: () => this.ejecutarSeleccion(true) // Aquí SÍ pasas el argumento
        },
        {
          text: 'Galería',
          icon: 'image',
          handler: () => this.ejecutarSeleccion(false) // Aquí SÍ pasas el argumento
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
   * Cierra la sesión del usuario actual.
   * Ejecuta una pausa artificial de 1 segundo para mejorar la experiencia
   * @async
   * @function cerrarSesion
   * @returns { Promise<void> } Una promesa que se resuelve cuando el cierre de sesión ha finalizado.
  */

  async cerrarSesion() {
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.authService.logout();
  }
}
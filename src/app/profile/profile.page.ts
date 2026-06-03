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

// [AGREGADO] Capacitor Preferences para persistir estado de notificaciones y datos físicos
import { Preferences } from '@capacitor/preferences';

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
  valorTemporal: any = 0;

  // [MODIFICADO] Preferencias — ahora se cargan desde Preferences al iniciar
  alertasActivas: boolean = false;
  recordatoriosActivos: boolean = false;

  // menu
  isMenuOpen = false;

  showOldPassword: boolean = false;
  showNewPassword: boolean = false;

  // [AGREGADO] Claves de Preferences para notificaciones
  private readonly NOTIF_KEYS = {
    recordatorios: 'notif_recordatorios',
    alertas: 'notif_alertas'
  };

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
      // [AGREGADO] Cargar estado guardado de las notificaciones
      this.cargarEstadoNotificaciones()
    ]);

    console.log("Datos cargados correctamente");
  }

  // ==========================================
  // LÓGICA DE NOTIFICACIONES
  // ==========================================

  // [AGREGADO] Carga el estado guardado de cada toggle desde Preferences
  async cargarEstadoNotificaciones() {
    try {
      const [recordRes, alertRes] = await Promise.all([
        Preferences.get({ key: this.NOTIF_KEYS.recordatorios }),
        Preferences.get({ key: this.NOTIF_KEYS.alertas })
      ]);

      // Si hay un valor guardado lo usa, si no queda en false por defecto
      if (recordRes.value !== null) {
        this.recordatoriosActivos = recordRes.value === 'true';
      }
      if (alertRes.value !== null) {
        this.alertasActivas = alertRes.value === 'true';
      }

      console.log('Estado notificaciones cargado:', {
        recordatorios: this.recordatoriosActivos,
        alertas: this.alertasActivas
      });
    } catch (error) {
      console.error('Error al cargar estado de notificaciones:', error);
    }
  }

  // [AGREGADO] Se llama cuando el usuario mueve cualquier toggle
  // Guarda el nuevo estado y ejecuta la lógica de suscripción/desuscripción
  async onToggleChange(tipo: string) {
    if (tipo === 'recordatorios') {
      // Guardar estado en Preferences
      await Preferences.set({
        key: this.NOTIF_KEYS.recordatorios,
        value: String(this.recordatoriosActivos)
      });

      // Lógica FCM: suscribir o desuscribir del topic de recordatorios
      if (this.recordatoriosActivos) {
        await this.suscribirATopic('recordatorios_comida');
        console.log('Suscripto a recordatorios de comida');
      } else {
        await this.desuscribirDeTopic('recordatorios_comida');
        console.log('Desuscripto de recordatorios de comida');
      }

    } else if (tipo === 'alertas') {
      // Guardar estado en Preferences
      await Preferences.set({
        key: this.NOTIF_KEYS.alertas,
        value: String(this.alertasActivas)
      });

      // Lógica FCM: suscribir o desuscribir del topic de alertas
      if (this.alertasActivas) {
        await this.suscribirATopic('alertas_generales');
        console.log('Suscripto a alertas generales');
      } else {
        await this.desuscribirDeTopic('alertas_generales');
        console.log('Desuscripto de alertas generales');
      }
    }
  }

  // [AGREGADO] Suscribe al usuario a un topic de FCM
  // Cuando integres @capacitor/push-notifications, completá esta función
  async suscribirATopic(topic: string) {
    try {
      // TODO: cuando instales @capacitor/push-notifications descomentar:
      // const { PushNotifications } = await import('@capacitor/push-notifications');
      // await PushNotifications.requestPermissions();
      // await PushNotifications.register();
      // El token FCM se obtiene en el listener 'registration'
      // y con ese token llamás a tu backend para suscribir al topic
      console.log(`[FCM] Suscripto al topic: ${topic}`);
    } catch (error) {
      console.error(`Error al suscribirse al topic ${topic}:`, error);
    }
  }

  // [AGREGADO] Desuscribe al usuario de un topic de FCM
  async desuscribirDeTopic(topic: string) {
    try {
      // TODO: cuando integres FCM completá con la llamada a tu backend
      // para desuscribir el token del topic
      console.log(`[FCM] Desuscripto del topic: ${topic}`);
    } catch (error) {
      console.error(`Error al desuscribirse del topic ${topic}:`, error);
    }
  }

  // ==========================================
  // LÓGICA DE FIREBASE (PERFIL)
  // ==========================================

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
   * Cierra la sesión del usuario actual.
   * Ejecuta una pausa artificial de 1 segundo para mejorar la experiencia
   */
  async cerrarSesion() {
    // [AGREGADO] Limpiar estado de notificaciones al cerrar sesión
    await Promise.all([
      Preferences.remove({ key: this.NOTIF_KEYS.recordatorios }),
      Preferences.remove({ key: this.NOTIF_KEYS.alertas })
    ]);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.authService.logout();
  }
}
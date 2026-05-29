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


// Importaciones de AWS Amplify
import { fetchUserAttributes, updatePassword } from 'aws-amplify/auth';

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
  oldPasswordInput: string = '';
  newPasswordInput: string = '';

  // Control del Modal
  isModalOpen: boolean = false;
  campoEditando: string = '';
  valorTemporal: any = 0; // Cambiado a 'any' para soportar tanto números (edad) como texto   

  // Preferencias
  alertasActivas: boolean = false;
  recordatoriosActivos: boolean = true;

  constructor(
    private authService: AuthService,
    private alertController: AlertController, // Agregado para los mensajes de éxito/error
    public userService: UserService,
    public languageService: LanguageService
  ) {
    // Aseguramos que los iconos estén registrados
    addIcons({ createOutline, globeOutline });
  }

  async ngOnInit() {
    await Promise.all([
      this.cargarEmailUsuario(),
      this.userService.loadUserData(),
    ]);

    console.log("Datos cargados correctamente");
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
    }
  }

  saveChanges() {
    // Si estamos editando la contraseña, delegamos la acción a AWS y salimos de la función
    if (this.campoEditando === 'contrasena') {
      this.actualizarPasswordCognito();
      return;
    }

    // Si son datos físicos, se actualizan las variables locales
    if (this.campoEditando === 'edad') this.edad = this.valorTemporal;
    if (this.campoEditando === 'peso') this.peso = this.valorTemporal;
    if (this.campoEditando === 'altura') this.altura = this.valorTemporal;

    this.isModalOpen = false;
  }

  onToggleChange(tipo: string) {
    const estado = tipo === 'recordatorios' ? this.recordatoriosActivos : this.alertasActivas;
    console.log(`Estado de ${tipo}:`, estado);
  }

  async handleLogout() {
    await this.authService.logout();
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
}
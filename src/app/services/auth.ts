import { Injectable } from '@angular/core';
import { NavController } from '@ionic/angular';
/* import { Router } from '@angular/router'; */
import { signOut } from 'aws-amplify/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private navCtrl:NavController) {}

  /**
   * @function logout
   * @description La función será ejecutada cuando el usuario presione el botón de cierre de sesión en el perfil.
   * Remueve de forma asíncrona los tokens de autenticación del pool de AWS Cognito, ejecuta una limpieza total de las memorias 
   * LocalStorage y SessionStorage por seguridad, y redirige al usuario hacia la pantalla de Login anulando el historial de navegación.
   */
  async logout() {
    try {
      // esto elimina los tokens de Cognito del almacenamiento local
      await signOut(); 
      
      // limpia todo por seguridad
      localStorage.clear();
      sessionStorage.clear();

      // esto redirige al inicio y evita que el usuario pueda volver atrás
      await this.navCtrl.navigateRoot(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
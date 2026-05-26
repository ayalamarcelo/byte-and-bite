import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { signOut } from 'aws-amplify/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private router: Router) {}

  async logout() {
    try {
      // esto elimina los tokens de Cognito del almacenamiento local
      await signOut(); 
      
      // limpia todo por seguridad
      localStorage.clear();
      sessionStorage.clear();

      // esto redirige al inicio y evita que el usuario pueda volver atrás
      await this.router.navigate(['/login'], { replaceUrl: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}
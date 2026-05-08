import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { fetchAuthSession } from 'aws-amplify/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  async canActivate(): Promise<boolean | UrlTree> {
    try {
      // intentamos obtener la sesión actual de cognito
      const session = await fetchAuthSession();
      
      // verifica si existen los tokens (esto confirmaría que está logueado)
      const isAuthenticated = !!session.tokens?.accessToken;

      if (isAuthenticated) {
        return true; // deja pasar al usuario
      } else {
        // si no está autenticado, lo mandamos al login
        return this.router.parseUrl('/login');
      }
    } catch (error) {
      // si hay un error (ej: sesión expirada o sin internet), pal lobby
      console.error('Auth Guard Error:', error);
      return this.router.parseUrl('/login');
    }
  }
}
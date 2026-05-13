import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { fetchAuthSession } from 'aws-amplify/auth';

// --- 1. GUARD PARA RUTAS PRIVADAS  ---
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  async canActivate(): Promise<boolean | UrlTree> {
    try {
      const session = await fetchAuthSession();
      const isAuthenticated = !!session.tokens?.accessToken;

      if (isAuthenticated) {
        return true; // usuario logueado, adelante.
      } else {
        return this.router.parseUrl('/login'); // sin sesión, pal login.
      }
    } catch (error) {
      return this.router.parseUrl('/login');
    }
  }
}

// --- 2. GUARD PARA RUTAS PÚBLICAS (Bloquea a logueados en Login/Welcome) ---
@Injectable({
  providedIn: 'root'
})
export class PublicGuard implements CanActivate {
  constructor(private router: Router) {}

  async canActivate(): Promise<boolean | UrlTree> {
    try {
      const session = await fetchAuthSession();
      const isAuthenticated = !!session.tokens?.accessToken;

      if (isAuthenticated) {
        // si ya tiene sesión, no tiene sentido ver el Welcome/Login
        return this.router.parseUrl('/tabs/home'); 
      } else {
        return true; // no está logueado, puede ver la página pública.
      }
    } catch (error) {
      return true;
    }
  }
}
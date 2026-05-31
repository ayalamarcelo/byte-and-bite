import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root' // Esto garantiza que es un Singleton
})
export class AvatarService {
  // Inicializamos directamente desde el localStorage para que al cargar la app esté disponible
  private avatarSource = new BehaviorSubject<string | null>(localStorage.getItem('user-avatar'));

  // Exponemos el observable
  avatar$ = this.avatarSource.asObservable();

  updateAvatar(newUrl: string) {
    localStorage.setItem('user-avatar', newUrl);
    this.avatarSource.next(newUrl); // Esto notifica automáticamente a cualquier componente suscrito
  }
}
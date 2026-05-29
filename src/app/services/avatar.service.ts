import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  // url por defecto o null
  private avatarSource = new BehaviorSubject<string | null>(null);
  
  avatar$ = this.avatarSource.asObservable();

  constructor() {}

  // para actualizar la imagen desde cualquier página
  updateAvatar(newUrl: string) {
    this.avatarSource.next(newUrl);
    // persistencia
    localStorage.setItem('user-avatar', newUrl);
  }
}
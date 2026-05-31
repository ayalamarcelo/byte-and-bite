import { Injectable } from '@angular/core';
import { fetchUserAttributes } from 'aws-amplify/auth';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public userName: string = '';
  public userLastName: string = '';

  constructor() { }

  async loadUserData() {
    try {
      const attributes = await fetchUserAttributes();
      this.userName = attributes.given_name || '';
      this.userLastName = attributes.family_name || '';
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }
}
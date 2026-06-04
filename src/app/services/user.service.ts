import { Injectable } from '@angular/core';
import { fetchUserAttributes } from 'aws-amplify/auth';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public userName: string = '';
  public userLastName: string = '';

  constructor() { }

  /**
   * @function loadUserData
   * @description La función será ejecutada asíncronamente para recuperar los datos de identidad de la cuenta.
   * Establece una conexión con el proveedor de AWS Amplify mediante fetchUserAttributes para mapear el nombre y apellido del usuario en propiedades globales de la aplicación.
   */
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
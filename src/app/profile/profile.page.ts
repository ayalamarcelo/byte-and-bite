import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { IonicModule } from '@ionic/angular'; 
import { AuthService } from '../services/auth';
import { addIcons } from 'ionicons';
import { createOutline } from 'ionicons/icons';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
})
export class ProfilePage implements OnInit {
  edad: number = 25;
  peso : number = 68;
  altura : number = 1.78
  contrasena: number = 12345;
  isModalOpen: boolean = false; // Controla el pop-up
  campoEditando: string = '';   // Guarda qué estamos editando
  valorTemporal: number = 0;    // Valor que se escribe en el input

  openEditModal(campo: string) {
  this.campoEditando = campo;
  this.isModalOpen = true;
  
  // Aquí es donde luego abriremos el modal
  if (campo === 'edad') this.valorTemporal = this.edad; 
  if (campo === 'peso') this.valorTemporal = this.peso; 
  if (campo === 'altura') this.valorTemporal = this.altura; 
  if (campo === 'contrasena') this.valorTemporal = this.contrasena; 
}
  // se guardan los cambios en el modal
  saveChanges(){
  if (this.campoEditando === 'edad') this.edad = this.valorTemporal;
  if (this.campoEditando === 'peso') this.peso = this.valorTemporal;
  if (this.campoEditando === 'altura') this.altura = this.valorTemporal;
  if (this.campoEditando === 'contrasena') this.contrasena = this.valorTemporal;
    this.isModalOpen = false;
  }
   
  alertasActivas: boolean = false;
  recordatoriosActivos: boolean = true;
  constructor(private authService: AuthService) { 
    addIcons({ createOutline });
  }
  ngOnInit() { }
    // Activa y desactiva loas notificaciones
    onToggleChange(tipo: string) {
    const estado = tipo === 'recordatorios' ? this.recordatoriosActivos : this.alertasActivas;
    console.log(`Estado de ${tipo}:`, estado);
  }

  async handleLogout() {
    await this.authService.logout();
  }

  
}
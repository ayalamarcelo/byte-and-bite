import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { NutritionService } from '../services/nutrition.service';
import { fetchUserAttributes } from 'aws-amplify/auth';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DatePipe]
})
export class HomePage implements OnInit {

  fotoPerfil: string = '';
  currentDate: Date = new Date();

  percentageFats: number = 30;
  proteinPercentage: number = 60;
  percentageCarbo: number = 10;

  sodioMg: number = 1500;
  fibraG: number = 25;
  potasioMg: number = 3500;

  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  goToProfile() {
    this.router.navigate(['/tabs/profile']);
  }

  constructor(private router: Router, private nutritionService: NutritionService) { }

  async ngOnInit() {
    await this.getUserInfo();
    this.nutritionService.alimentos$.subscribe(() => {
      const p = this.nutritionService.getPorcentajes();
      this.percentageFats = p.grasas;
      this.proteinPercentage = p.proteinas;
      this.percentageCarbo = p.carbohidratos;
    });
  }

  async getUserInfo() {
    try {
      const attributes = await fetchUserAttributes();
      
      this.nombreUsuario = attributes.given_name || '';
      this.apellidoUsuario = attributes.family_name || '';
      
    } catch (error) {
      console.error('Error al obtener atributos:', error);
    }
  }

  async cambiarFoto() {
    try {
      console.log('Abriendo la galería o cámara del dispositivo...');
    } catch (error) {
      console.error('Error al seleccionar la foto:', error);
    }
  }
}
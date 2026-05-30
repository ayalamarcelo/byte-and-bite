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

  totalKcal: number = 0;

  metaKcal: number = 2000;
  strokeDashoffset: number = 251.32;

  percentageFats: number = 30;
  proteinPercentage: number = 60;
  percentageCarbo: number = 10;

  sodioMg: number = 1500;
  fibraG: number = 25;
  potasioMg: number = 3500;

  aguaConsumida: number = 0;
  aguaMeta: number = 2000;
  porcentajeAgua: number = 0;
  porcentajeAguaEntero: number = 0;

  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  constructor(private router: Router, private nutritionService: NutritionService) { }

  async ngOnInit() {
    await this.getUserInfo();

    this.nutritionService.alimentos$.subscribe(() => {
      this.totalKcal = this.nutritionService.getTotalKcal();

      const p = this.nutritionService.getPorcentajes();
      this.percentageFats = p.grasas;
      this.proteinPercentage = p.proteinas;
      this.percentageCarbo = p.carbohidratos;

      const micros = this.nutritionService.getMicronutrientesTotales();
      this.sodioMg = micros.sodio;
      this.fibraG = micros.fibra;
      this.potasioMg = micros.potasio;
      
      this.actualizarGrafico();
    });

    this.nutritionService.agua$.subscribe(ml => {
      this.aguaConsumida = ml;
      this.porcentajeAgua = this.aguaConsumida / this.aguaMeta; 
      this.porcentajeAguaEntero = Math.round(this.porcentajeAgua * 100);
    });
  } 

  actualizarGrafico() {
    if (this.metaKcal <= 0) this.metaKcal = 1;
    
    const porcentaje = this.totalKcal / this.metaKcal;
    const circunferencia = 2 * Math.PI * 40;
    const factorProgreso = Math.min(porcentaje, 1);
    
    this.strokeDashoffset = circunferencia - (factorProgreso * circunferencia);
  }

  onMetaChange() {
    if (!this.metaKcal || this.metaKcal < 0) {
      this.metaKcal = 0;
    }
    this.actualizarGrafico();
  }

  agregarAgua(cantidadMl: number) {
    this.nutritionService.sumarAgua(cantidadMl);
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

  goToProfile() {
    this.router.navigate(['/tabs/profile']);
  }

}
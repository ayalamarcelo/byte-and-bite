import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule , NavController} from '@ionic/angular';
// import { Router } from '@angular/router';
import { NutritionService } from '../services/nutrition.service';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { AvatarService } from '../services/avatar.service';

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

  percentageFats: number = 0;
  proteinPercentage: number = 0;
  percentageCarbo: number = 0;

  sodioMg: number = 0;
  fibraG: number = 0;
  potasioMg: number = 0;

  progresoSodio: number = 0;
  progresoFibra: number = 0;
  progresoPotasio: number = 0;

  metaSodio: number = 2300; 
  metaFibra: number = 30;   
  metaPotasio: number = 3500; 

  aguaConsumida: number = 0;
  aguaMeta: number = 2000;
  porcentajeAgua: number = 0;
  porcentajeAguaEntero: number = 0;

  nombreUsuario: string = '';
  apellidoUsuario: string = '';

  userAvatar: string | null = null;


  goToProfile() {
    this.navCtrl.navigateForward(['/tabs/profile']);
  }

  constructor(
    private navCtrl: NavController,
    private nutritionService: NutritionService,
    private avatarService: AvatarService) { }

  async ngOnInit() {
    await this.getUserInfo();

    this.nutritionService.alimentos$.subscribe(alimentos => {
      this.totalKcal = this.nutritionService.getTotalKcal();

      const p = this.nutritionService.getPorcentajesMacros();
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

    this.avatarService.avatar$.subscribe(url => {
      console.log('Avatar actualizado en Home:', url);
      this.userAvatar = url;
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
}
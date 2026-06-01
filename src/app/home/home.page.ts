import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule , NavController} from '@ionic/angular';
import { NutritionService } from '../services/nutrition.service';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { AvatarService } from '../services/avatar.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})

export class HomePage implements OnInit {

  // Variables para guardar la información del usuario y la fecha actual
  fotoPerfil: string = '';
  currentDate: Date = new Date();
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  userAvatar: string | null = null;

  // Contador de calorías consumidas y control del gráfico circular
  totalKcal: number = 0;
  metaKcal: number = Number(localStorage.getItem('metaCalorias')) || 2000; // Límite diario por defecto
  strokeDashoffset: number = 251.32; // Controla qué tan lleno se ve el círculo azul

  // Porcentajes de los macronutrientes para las barras de progreso
  percentageFats: number = 0;
  proteinPercentage: number = 0;
  percentageCarbo: number = 0;

  // Valores acumulados de los micronutrientes en miligramos o gramos
  sodioMg: number = 0;
  fibraG: number = 0;
  potasioMg: number = 0;

  // Variables de control de progreso y metas fijas para los micros
  progresoSodio: number = 0;
  progresoFibra: number = 0;
  progresoPotasio: number = 0;
  metaSodio: number = 2300; 
  metaFibra: number = 30;   
  metaPotasio: number = 3500; 

  // Estado del contador de agua diaria
  aguaConsumida: number = 0;
  aguaMeta: number = 2000;
  porcentajeAgua: number = 0;
  porcentajeAguaEntero: number = 0;

  constructor(
    private navCtrl: NavController,
    private nutritionService: NutritionService, // Servicio de cálculos nutricionales
    private avatarService: AvatarService // Servicio para controlar la foto de perfil
  ) { }

  // Al arrancar la pantalla, nos suscribimos a los servicios para escuchar cambios en vivo
  async ngOnInit() {
    await this.getUserInfo();

    // Escucha en tiempo real cada vez que el usuario agrega un alimento
    this.nutritionService.alimentos$.subscribe(alimentos => {
      // Traemos el total de calorías consumidas
      this.totalKcal = this.nutritionService.getTotalKcal();

      // Traemos el reparto de porcentajes de grasas, proteínas y carbohidratos
      const p = this.nutritionService.getPorcentajesMacros();
      this.percentageFats = p.grasas;
      this.proteinPercentage = p.proteinas;
      this.percentageCarbo = p.carbohidratos;

      // Traemos la suma acumulada de sodio, fibra y potasio
      const micros = this.nutritionService.getMicronutrientesTotales();
      this.sodioMg = Number(micros.sodio) || 0;
      this.fibraG = Number(micros.fibra) || 0;
      this.potasioMg = Number(micros.potasio) || 0;
      
      // Re-calculamos el diseño del anillo azul con los nuevos datos
      this.actualizarGrafico();
    });

    // Escucha en tiempo real cuánta agua va tomando el usuario en el día
    this.nutritionService.agua$.subscribe(ml => {
      this.aguaConsumida = ml;
      this.porcentajeAgua = this.aguaConsumida / this.aguaMeta; 
      this.porcentajeAguaEntero = Math.round(this.porcentajeAgua * 100);
    });

    // Escucha si el usuario cambió su foto desde el perfil para actualizarla acá
    this.avatarService.avatar$.subscribe(url => {
      console.log('Avatar actualizado en Home:', url);
      this.userAvatar = url;
    });
  }

  // Método que calcula el progreso del anillo circular en base a la meta diaria
  actualizarGrafico() {
    if (this.metaKcal <= 0) this.metaKcal = 1; // Evitamos división por cero
    
    const porcentaje = this.totalKcal / this.metaKcal;
    const circunferencia = 2 * Math.PI * 40; // Largo total de la línea del círculo (251.32)
    const factorProgreso = Math.min(porcentaje, 1); // El anillo no se pasa del 100% visual
    
    // Modificamos el offset: menos offset significa que el círculo se pinta más
    this.strokeDashoffset = circunferencia - (factorProgreso * circunferencia);
  }

  // Se ejecuta automáticamente cada vez que el usuario edita el número de su meta diaria
  onMetaChange() {
    if (!this.metaKcal || this.metaKcal < 0) {
      this.metaKcal = 0;
    }
    localStorage.setItem('metaCalorias', this.metaKcal.toString());
    
    this.actualizarGrafico();
  }

  // Suma los mililitros seleccionados (150, 250, 500) al contador diario del servicio
  agregarAgua(cantidadMl: number) {
    this.nutritionService.sumarAgua(cantidadMl);
  }

  // Redirige al usuario hacia la pestaña de perfil al tocar el avatar
  goToProfile() {
    this.navCtrl.navigateForward(['/tabs/profile']);
  }

  // Conexión segura con AWS Amplify para traer el nombre real del usuario logueado
  async getUserInfo() {
    try {
      const attributes = await fetchUserAttributes();
      this.nombreUsuario = attributes.given_name || '';
      this.apellidoUsuario = attributes.family_name || '';
    } catch (error) {
      console.error('Error al obtener atributos:', error);
    }
  }

  // Marcador de posición por si en un futuro deciden abrir la cámara directo desde la Home
  async cambiarFoto() {
    try {
      console.log('Abriendo la galería o cámara del dispositivo...');
    } catch (error) {
      console.error('Error al seleccionar la foto:', error);
    }
  }
}
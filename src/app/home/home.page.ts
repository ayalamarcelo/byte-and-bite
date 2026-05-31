import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule , NavController} from '@ionic/angular';
/* import { Router } from '@angular/router'; */
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

  percentageFats: number = 30;
  proteinPercentage: number = 60;
  percentageCarbo: number = 10;
  totalKcal: number = 0;

  sodioMg: number = 1500;
  fibraG: number = 25;
  potasioMg: number = 3500;

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

    // 1. Suscripción a la nutrición (Independiente)
    this.nutritionService.alimentos$.subscribe(() => {
      const p = this.nutritionService.getPorcentajes();
      this.percentageFats = p.grasas;
      this.proteinPercentage = p.proteinas;
      this.percentageCarbo = p.carbohidratos;
      this.totalKcal = this.nutritionService.getTotalKcal();
    });

    // 2. Suscripción al avatar (Independiente)
    // Al estar fuera de la otra, siempre estará escuchando
    this.avatarService.avatar$.subscribe(url => {
      console.log('Avatar actualizado en Home:', url);
      this.userAvatar = url;
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
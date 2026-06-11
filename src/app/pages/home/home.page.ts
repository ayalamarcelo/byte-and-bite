import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule , NavController} from '@ionic/angular';
import { NutritionService } from '../../services/nutrition.service';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { AvatarService } from '../../services/avatar.service';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getCurrentUser } from 'aws-amplify/auth';
import { environment } from '../../../environments/environment';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: environment.firebaseConfig.apiKey,
  authDomain: environment.firebaseConfig.authDomain,
  projectId: environment.firebaseConfig.projectId,
  storageBucket: environment.firebaseConfig.storageBucket,
  messagingSenderId: environment.firebaseConfig.messagingSenderId,
  appId: environment.firebaseConfig.appId 
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit {

  fotoPerfil: string = '';
  currentDate: Date = new Date();
  nombreUsuario: string = '';
  apellidoUsuario: string = '';
  userAvatar: string | null = null;

  totalKcal: number = 0;
  metaKcal: number = Number(localStorage.getItem('metaCalorias')) || 2000;
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

  private userId: string = '';

  constructor(
    private navCtrl: NavController,
    private nutritionService: NutritionService,
    private avatarService: AvatarService
  ) { }

  /**
   * @function getFechaHoyString
   * @description La función será ejecutada internamente para formatear la fecha actual del sistema.
   * Retorna un String estandarizado en formato YYYY-MM-DD que se usa como identificador único para los documentos de la base de datos.
   */
  private getFechaHoyString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /**
   * @function ngOnInit
   * @description La función será ejecutada automáticamente al inicializar la pantalla.
   * Se conecta con AWS Amplify para traer el nombre del usuario, invoca la carga del agua desde la nube de Firebase, y se suscribe 
   * en tiempo real a los flujos reactivos de alimentos y avatar para actualizar la UI dinámicamente.
   */
  async ngOnInit() {
    await this.getUserInfo();
    await this.cargarAguaDesdeFirebase();

    this.nutritionService.alimentos$.subscribe(alimentos => {
      this.totalKcal = this.nutritionService.getTotalKcal();

      const p = this.nutritionService.getPorcentajesMacros();
      this.percentageFats = p.grasas;
      this.proteinPercentage = p.proteinas;
      this.percentageCarbo = p.carbohidratos;

      const micros = this.nutritionService.getMicronutrientesTotales();
      this.sodioMg = Number(micros.sodio) || 0;
      this.fibraG = Number(micros.fibra) || 0;
      this.potasioMg = Number(micros.potasio) || 0;
      
      this.actualizarGrafico();
    });

    this.avatarService.avatar$.subscribe(url => {
      this.userAvatar = url;
    });
  }

  /**
   * @function cargarAguaDesdeFirebase
   * @description La función será ejecutada de forma asíncrona al arrancar la aplicación para recuperar el historial de hidratación.
   * Se conecta a Firestore buscando el documento diario del usuario logueado en la colección 'aguaDiaria' para pintar el progreso real en frío.
   */

  async cargarAguaDesdeFirebase() {
    try {
      const user = await getCurrentUser();
      this.userId = user.userId;
      
      if (this.userId) {
        const fechaHoy = this.getFechaHoyString();
        const docRef = doc(db, 'aguaDiaria', `${this.userId}_${fechaHoy}`);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          this.aguaConsumida = Number(data['mililitros']) || 0;
        } else {
          this.aguaConsumida = 0;
        }

        this.porcentajeAgua = this.aguaConsumida / this.aguaMeta;
        this.porcentajeAguaEntero = Math.round(this.porcentajeAgua * 100);
      }
    } catch (e) {
      console.error("Error cargando agua desde Firebase:", e);
    }
  }

  /**
   * @function actualizarGrafico
   * @description La función será ejecutada para recalcular el progreso calórico diario del usuario en base a su meta.
   * Modifica matemáticamente la propiedad strokeDashoffset para rellenar visualmente el anillo SVG de la interfaz.
   */
  actualizarGrafico() {
    if (this.metaKcal <= 0) this.metaKcal = 1;
    const porcentaje = this.totalKcal / this.metaKcal;
    const circunferencia = 2 * Math.PI * 40;
    const factorProgreso = Math.min(porcentaje, 1);
    this.strokeDashoffset = circunferencia - (factorProgreso * circunferencia);
  }

  /**
   * @function onMetaChange
   * @description La función será ejecutada automáticamente cada vez que el usuario edita numéricamente su meta de calorías en el campo de texto.
   * Guarda de forma permanente el nuevo valor en el LocalStorage del dispositivo y actualiza el gráfico circular de progreso.
   */
  // guarda el nuevo valor
  onMetaChange() {
    if (!this.metaKcal || this.metaKcal < 0) {
      this.metaKcal = 0;
    }
    localStorage.setItem('metaCalorias', this.metaKcal.toString());
    this.actualizarGrafico();
  }

  /**
   * @function agregarAgua
   * @description La función será ejecutada cuando el usuario haga click en alguno de los botones de selección rápida de medida (150ml, 250ml o 500ml).
   * Incrementa los mililitros en pantalla cuidando de no pasar el tope, y sincroniza el nuevo total directamente actualizando un documento en Firebase Firestore.
   */
  async agregarAgua(cantidadMl: number) {
    if (this.aguaConsumida >= this.aguaMeta) return;

    let nuevoTotal = this.aguaConsumida + cantidadMl;
    if (nuevoTotal > this.aguaMeta) {
      nuevoTotal = this.aguaMeta;
    }

    this.aguaConsumida = nuevoTotal;
    this.porcentajeAgua = this.aguaConsumida / this.aguaMeta;
    this.porcentajeAguaEntero = Math.round(this.porcentajeAgua * 100);

    if (this.userId) {
      const fechaHoy = this.getFechaHoyString();
      const docRef = doc(db, 'aguaDiaria', `${this.userId}_${fechaHoy}`);
      try {
        await setDoc(docRef, {
          userId: this.userId,
          fecha: fechaHoy,
          mililitros: this.aguaConsumida
        }, { merge: true });
        console.log("Agua sincronizada en Firebase con éxito.");
      } catch (e) {
        console.error("Error guardando agua en Firebase:", e);
      }
    }

    this.nutritionService.sumarAgua(cantidadMl);
  }

  /**
   * @function goToProfile
   * @description La función será ejecutada cuando el usuario haga click en el botón del perfil con el avatar animado.
   * Gestiona la navegación interna mediante el NavController de Ionic para redirigir al usuario hacia la pestaña de perfil.
   */
  goToProfile() {
    this.navCtrl.navigateForward(['/tabs/profile']);
  }

  /**
   * @function getUserInfo
   * @description La función será ejecutada internamente de forma asíncrona al arrancar la aplicación.
   * Establece una conexión con el backend de AWS Amplify mediante fetchUserAttributes para recuperar el nombre y apellido reales del usuario logueado.
   */
  async getUserInfo() {
    try {
      const attributes = await fetchUserAttributes();
      this.nombreUsuario = attributes.given_name || '';
      this.apellidoUsuario = attributes.family_name || '';
    } catch (error) {
      console.error('Error al obtener atributos:', error);
    }
  }
}
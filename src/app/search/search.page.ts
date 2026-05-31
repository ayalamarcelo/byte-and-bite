import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EdamamService } from '../services/edamam.service';
import { FirebaseService } from '../services/firebase.service';
import { getCurrentUser } from 'aws-amplify/auth';
import { NutritionService } from '../services/nutrition';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: false, // Este componente pertenece a un módulo (SearchPageModule)
})
export class SearchPage implements OnInit {
  
  // Variables de estado del buscador y de la UI
  query: string = ''; // Lo que el usuario escribe en la barra de búsqueda
  resultadosBusqueda: any[] = []; // Resultados que devuelve la API de Edamam
  alimentoSeleccionado: any = null; // El alimento que el usuario eligió de la lista
  historial: any[] = []; // Últimas 5 búsquedas que hizo el usuario
  userId: string = ''; // ID del usuario logueado en Amplify

  // Objeto para organizar las comidas ingresadas manualmente (no lo usamos en el home actualmente)
  comidas: any = {
    desayuno: [],
    almuerzo: [],
    cena: []
  };

  tipoComida: 'desayuno' | 'almuerzo' | 'cena' = 'desayuno'; // Por defecto agrega al desayuno
  cantidad: number = 100; // Gramos por defecto que se muestran en el contador
  private lastQuery = ''; // Guarda la última búsqueda para no repetir peticiones a la API
  defaultImage: string = 'https://ionicframework.com/docs/img/demos/card-media.png'; // Imagen de relleno por si falla la original

  // Inyección de servicios (API externa, Base de Datos, Nutrición local y Notificaciones)
  constructor(
    private edamamService: EdamamService,
    private firebaseService: FirebaseService,
    private nutritionService: NutritionService,
    private toastController: ToastController
  ) { }

  // Se ejecuta cuando la página de búsqueda se inicia
  async ngOnInit() {
    // 1. Recupera si había un alimento seleccionado anteriormente de la memoria local
    const guardado = localStorage.getItem('ultimoAlimento');
    if (guardado) {
      this.alimentoSeleccionado = JSON.parse(guardado);
    }
    // 2. Intenta obtener el ID del usuario de AWS Amplify para usarlo en Firebase luego
    try {
      const user = await getCurrentUser();
      this.userId = user.userId;
    } catch (e) {
      console.log('No hay usuario logueado');
    }
  }

  // Método que sube un alimento a la colección "bookmarks" de Firebase
  async guardarBookmark(item: any) {
    if (!this.userId) return; // Validación de seguridad: no guardar si no hay sesión
    
    const food = item.food;
    // Llama al servicio de Firebase para meter el dato en Firestore
    await this.firebaseService.agregarBookmark(this.userId, {
      nombre: food.label,
      categoria: this.determinarCategoria(food.nutrients), // Asigna la categoría inteligentemente
      kcal: Math.round(food.nutrients?.ENERC_KCAL || 0),
      gramos: 100, // Siempre se guarda tomando 100g como base en favoritos
      img: food.image || this.defaultImage
    });

    // Muestra un cartelito verde abajo avisando que se agrego a bookmarks
    const toast = await this.toastController.create({
      message: `${food.label} Agregado a Bookmarks`,
      duration: 1500,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  // Se dispara cada vez que el usuario teclea en el buscador
  async onSearchChange(event: any) {
    const valor = event.detail.value;
    
    // Si borró todo o escribió menos de 3 letras, limpiamos la lista
    if (!valor || valor.length < 3) {
      this.resultadosBusqueda = [];
      return;
    }
    
    // Evita volver a buscar exactamente lo mismo que ya se buscó hace 1 segundo
    if (valor === this.lastQuery) return;
    this.lastQuery = valor;

    try {
      // Hace la petición POST/GET a la API de Edamam y espera la respuesta
      const respuesta: any = await firstValueFrom(this.edamamService.buscarAlimento(valor));
      this.resultadosBusqueda = respuesta?.hints || []; // Guarda los resultados para mostrarlos
    } catch (error) {
      console.error(error);
    }
  }

  // Cuando el usuario elige un ítem de la lista desplegable de resultados
  seleccionarAlimento(item: any) {
    const food = item.food;
    this.query = food.label; // Pone el nombre en el buscador
    this.alimentoSeleccionado = {
      ...food,
      image: food.image || this.defaultImage
    };
    this.cantidad = 100; // Resetea los gramos a 100
    
    // Lo guarda en localStorage por si el usuario recarga la app
    localStorage.setItem('ultimoAlimento', JSON.stringify(this.alimentoSeleccionado));
    this.resultadosBusqueda = []; // Esconde la lista desplegable

    // Agrega el alimento al historial (las últimas 5 búsquedas) sin repetir
    if (!this.historial.find(h => h.food.label === food.label)) {
      this.historial.unshift(item);
      this.historial = this.historial.slice(0, 5); // Corta el array para que solo queden 5
    }
  }

  // Borra un ítem del historial reciente de búsquedas
  eliminarDeHistorial(item: any) {
    this.historial = this.historial.filter(h => h.food.label !== item.food.label);
  }

  // Manda el alimento directamente al Home (al contador de macros) con la cantidad ingresada
  agregarAlimentoDesdeContador() {
    if (!this.alimentoSeleccionado) return;
    const food = this.alimentoSeleccionado;
    
    // Estructura limpia que el Home entiende
    const alimentoParaHome = {
      nombre: food.label,
      categoria: this.determinarCategoria(food.nutrients), // Categoría inteligente
      kcal: Math.round(food.nutrients?.ENERC_KCAL || 0),
      img: food.image || this.defaultImage
    };

    // Llama al servicio centralizado para que impacte en la UI principal
    this.nutritionService.agregarAlimento(alimentoParaHome, this.cantidad);
    
    // Limpia la pantalla para que puedas buscar otra cosa
    this.alimentoSeleccionado = null;
    this.cantidad = 100;
    this.query = '';
  }

  // Agrega el alimento a un registro local (desayuno, almuerzo, cena) con los macros calculados 
  // Nota: por ahora esto es para registro interno, el Home usa agregarAlimentoDesdeContador()
  agregarAlimentoManual(item?: any) {
    const food = item ? item.food : this.alimentoSeleccionado;
    if (!food) return;
    const factor = this.cantidad / 100; // Sirve para multiplicar por la cantidad de gramos reales

    const alimento = {
      nombre: food.label,
      cantidad: this.cantidad,
      calorias: (food.nutrients?.ENERC_KCAL || 0) * factor,
      proteina: (food.nutrients?.PROCNT || 0) * factor,
      grasa: (food.nutrients?.FAT || 0) * factor,
      carbs: (food.nutrients?.CHOCDF || 0) * factor
    };

    this.comidas[this.tipoComida].push(alimento);
    this.cantidad = 100;
  }

  // MAGIA DE CATEGORÍAS: Esta función calcula qué macro es más predominante y le pone ese nombre
  determinarCategoria(nutrients: any): string {
    if (!nutrients) return 'General';
    
    const prot = nutrients.PROCNT || 0; // Proteínas
    const carb = nutrients.CHOCDF || 0; // Carbohidratos
    const fat = nutrients.FAT || 0;     // Grasas
    
    const max = Math.max(prot, carb, fat); // ¿Cuál de los 3 números es mayor?
    if (max === 0) return 'General'; // Si todos son cero (ej: agua), es General
    
    // Devuelve el nombre del filtro exacto según el macro que ganó
    if (max === carb) return 'Carbohidratos';
    if (max === prot) return 'Proteínas';
    if (max === fat) return 'Grasas';
    
    return 'General'; // Por las dudas
  }

  // Obtiene el total de calorías consumidas hoy desde el servicio de nutrición
  get totalCalorias() {
    return this.nutritionService.getTotalKcal();
  }

  // Si la imagen original se rompe o no carga, le enchufa una por defecto para no romper el diseño
  onImgError(event: any) { event.target.src = this.defaultImage; }
}
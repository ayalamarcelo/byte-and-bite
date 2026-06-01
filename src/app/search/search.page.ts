import { Component, OnInit, Inject, forwardRef } from '@angular/core';
import { EdamamService } from '../services/edamam.service';
import { FirebaseService } from '../services/firebase.service';
import { getCurrentUser } from 'aws-amplify/auth';
import { NutritionService } from '../services/nutrition.service';
import { ToastController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

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
  historial: any[] = []; // Últimas 5 búsquedas que hizo el usuario (Mantenido para compatibilidad)
  userId: string = ''; // ID del usuario logueado en Amplify

  // Variables agregadas por el equipo para el nuevo diseño
  listaRecientes: any[] = [];
  listaConsumo: any[] = [];
  alimentoParaEditar: any = null;
  isModalOpen = false;
  isInfoModalOpen: boolean = false;
  cache: { [key: string]: any } = {};
  itemExpandido: any = null;

  private searchSubject = new Subject<string>();

  // Objeto para organizar las comidas ingresadas manualmente (no lo usamos en el home actualmente)
  comidas: any = {
    desayuno: [],
    almuerzo: [],
    cena: []
  };

  tipoComida: 'desayuno' | 'almuerzo' | 'cena' = 'desayuno'; // Por defecto agrega al desayuno
  cantidad: number = 100; // Gramos por defecto que se muestran en el contador
  defaultImage: string = 'https://ionicframework.com/docs/img/demos/card-media.png'; // Imagen de relleno por si falla la original

  // Inyectamos el servicio usando forwardRef para evitar dependencias circulares y añadimos nuestros servicios
  constructor(
    @Inject(forwardRef(() => EdamamService)) private edamamService: EdamamService,
    private firebaseService: FirebaseService,
    private nutritionService: NutritionService,
    private toastController: ToastController
  ) {}

  // Se ejecuta cuando la página de búsqueda se inicia
  async ngOnInit() {
    // La suscripción se mueve aquí para asegurar la inicialización correcta del buscador con RxJS
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(query => this.edamamService.buscarAlimento(query))
    ).subscribe({
      next: (respuesta: any) => this.resultadosBusqueda = respuesta?.hints || [],
      error: (err) => console.error("Error en búsqueda:", err)
    });

    // 1. Recupera si había un alimento seleccionado anteriormente de la memoria local
    const guardado = localStorage.getItem('ultimoAlimento');
    if (guardado) this.alimentoSeleccionado = JSON.parse(guardado);
  }

  async onSearchChange(event: any) {
    const valor = event.detail.value;
    if (valor && valor.length >= 3) {
      this.searchSubject.next(valor);
    } else {
      this.resultadosBusqueda = [];
    }
    // 2. Intenta obtener el ID del usuario de AWS Amplify para usarlo en Firebase luego
    try {
      const user = await getCurrentUser();
      this.userId = user.userId;
    } catch (e) {
      console.log('No hay usuario logueado');
    }
  }

  async guardarBookmark(item: any) {
    if (!this.userId) return; 
    
    const food = item.food;
    const nutrients = food.nutrients || {};

    await this.firebaseService.agregarBookmark(this.userId, {
      nombre: food.label,
      categoria: this.determinarCategoria(nutrients), 
      kcal: Math.round(nutrients.ENERC_KCAL || 0),
      gramos: 100, 
      img: food.image || this.defaultImage,
      
      grasasG: nutrients.FAT || 0,
      proteinasG: nutrients.PROCNT || 0,
      carbohidratosG: nutrients.CHOCDF || 0,
      
      sodioMg: nutrients.NA || 0,
      fibraG: nutrients.FIBTG || 0,
      potasioMg: nutrients.K || 0
    });

    const toast = await this.toastController.create({
      message: `${food.label} Agregado a Bookmarks`,
      duration: 1500,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  mostrarInfo(item: any) {
    if (this.itemExpandido === item) {
      this.itemExpandido = null;
      return;
    }
    this.itemExpandido = item;

    const cacheKey = item.food.label.toLowerCase();
    if (this.cache[cacheKey]) {
      this.alimentoSeleccionado = this.cache[cacheKey];
      return;
    }

    this.edamamService.getFoodDetails(item.food.label).subscribe({
      next: (data: any) => {
        if (data.hints && data.hints.length > 0) {
          this.cache[cacheKey] = data.hints[0];
          this.alimentoSeleccionado = data.hints[0];
        }
      }
    });
  }

  get totalCalorias(): number {
    return this.calcularTotalCalorias();
  }

  calcularTotalCalorias(): number {
    return this.listaConsumo.reduce((total, item) => {
      const kcalBase = item.food.nutrients?.ENERC_KCAL || 0;
      const porcion = item.cantidad || 100;
      return total + (kcalBase * (porcion / 100));
    }, 0);
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

    // Lógica combinada de historial reciente
    if (!this.listaRecientes.find(i => i.food.foodId === item.food.foodId)) {
      this.listaRecientes.unshift(item);
      localStorage.setItem('recientes', JSON.stringify(this.listaRecientes));
    }
    
    if (!this.historial.find(h => h.food.label === food.label)) {
      this.historial.unshift(item);
      this.historial = this.historial.slice(0, 5); // Corta el array para que solo queden 5
    }
    this.query = '';
    this.resultadosBusqueda = [];
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

  // Funciones agregadas por el equipo para el nuevo diseño modal y tracking
  agregarAContador(item: any) {
    this.alimentoParaEditar = { ...item, cantidad: 100 };
    this.isModalOpen = true;
  }

  confirmarSeleccion() {
    if (this.alimentoParaEditar) {
      this.listaConsumo.push(this.alimentoParaEditar);
    }
    this.isModalOpen = false;
    this.alimentoParaEditar = null;
  }

  async transferirAlimentosAHome() {
    if (this.listaConsumo.length === 0) return;

    this.listaConsumo.forEach(item => {
      this.nutritionService.agregarAlimentoEdamam(item, item.cantidad || 100);
    });

    const toast = await this.toastController.create({
      message: `¡Alimentos añadidos con éxito al contador diario!`,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();

    this.listaConsumo = [];
  }

  eliminarReciente(item: any) {
    this.listaRecientes = this.listaRecientes.filter(i => i.food.foodId !== item.food.foodId);
    localStorage.setItem('recientes', JSON.stringify(this.listaRecientes));
  }

  trackByFn(index: number, item: any) {
    return item.id || index;
  }
}
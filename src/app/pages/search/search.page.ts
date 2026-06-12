import { Component, OnInit, Inject, forwardRef } from '@angular/core';
import { EdamamService } from '../../services/edamam.service';
import { FirebaseService } from '../../services/firebase.service';
import { getCurrentUser } from 'aws-amplify/auth';
import { NutritionService } from '../../services/nutrition.service';
import { ToastController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';


/**
 * Componente de búsqueda de alimentos.
 * Gestiona consultas a la API (Edamam), selección de ítems, almacenamiento en caché
 * local y sincronización con servicios de nutrición y Firebase.
 */
@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: false, // Este componente pertenece a un módulo (SearchPageModule)
})
export class SearchPage implements OnInit {
  /** @member {string} query - Valor actual de la barra de búsqueda. */
  query: string = '';

  /** @member {any[]} resultadosBusqueda - Lista de alimentos encontrados vía API. */
  resultadosBusqueda: any[] = []; // Resultados que devuelve la API de Edamam

  /** @member {any} alimentoSeleccionado - Ítem actualmente seleccionado para inspección. */
  alimentoSeleccionado: any = null;

  historial: any[] = [];
  userId: string = ''; 

  listaRecientes: any[] = [];
  listaConsumo: any[] = [];
  alimentoParaEditar: any = null;
  isModalOpen = false;
  isInfoModalOpen: boolean = false;
  cache: { [key: string]: any } = {};
  itemExpandido: any = null;

  private searchSubject = new Subject<string>();

  comidas: any = {
    desayuno: [],
    almuerzo: [],
    cena: []
  };

  tipoComida: 'desayuno' | 'almuerzo' | 'cena' = 'desayuno';
  cantidad: number = 100;
  defaultImage: string = 'https://ionicframework.com/docs/img/demos/card-media.png';

  constructor(
    @Inject(forwardRef(() => EdamamService)) private edamamService: EdamamService,
    private firebaseService: FirebaseService,
    private nutritionService: NutritionService,
    private toastController: ToastController
  ) { }


  /**
   * Inicializa las suscripciones de búsqueda (RxJS) y recupera estados guardados.
   * @function ngOnInit
   */
  async ngOnInit() {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(query => this.edamamService.buscarAlimento(query))
    ).subscribe({
      next: (respuesta: any) => this.resultadosBusqueda = respuesta?.hints || [],
      error: (err) => console.error("Error en búsqueda:", err)
    });

  
    const guardado = localStorage.getItem('ultimoAlimento');
    if (guardado) this.alimentoSeleccionado = JSON.parse(guardado);
  }


  /**
   * Dispara la búsqueda tras verificar longitud mínima.
   * @function onSearchChange
   */

  async onSearchChange(event: any) {
    const valor = event.detail.value;
    if (valor && valor.length >= 3) {
      this.searchSubject.next(valor);
    } else {
      this.resultadosBusqueda = [];
    }
  
    try {
      const user = await getCurrentUser();
      this.userId = user.userId;
    } catch (e) {
      console.log('No hay usuario logueado');
    }
  }

  /**
   * Guarda el alimento seleccionado en la base de datos (Firebase).
   * @function guardarBookmark
   */
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

  /**
   * Alterna la visualización de detalles y gestiona la caché de alimentos.
   * @function mostrarInfo
   */
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

  /**
   * Calcula el total de calorías de la lista de consumo.
   * @function calcularTotalCalorias
   * @returns {number}
   */
  calcularTotalCalorias(): number {
    return this.listaConsumo.reduce((total, item) => {
      const kcalBase = item.food.nutrients?.ENERC_KCAL || 0;
      const porcion = item.cantidad || 100;
      return total + (kcalBase * (porcion / 100));
    }, 0);
  }

  /**
   * Gestiona la selección del alimento, actualizando historial y UI.
   * @function seleccionarAlimento
   */
  seleccionarAlimento(item: any) {
    const food = item.food;
    this.query = food.label;
    this.alimentoSeleccionado = {
      ...food,
      image: food.image || this.defaultImage
    };
    this.cantidad = 100;

    
    localStorage.setItem('ultimoAlimento', JSON.stringify(this.alimentoSeleccionado));
    this.resultadosBusqueda = [];

    
    if (!this.listaRecientes.find(i => i.food.foodId === item.food.foodId)) {
      this.listaRecientes.unshift(item);
      localStorage.setItem('recientes', JSON.stringify(this.listaRecientes));
    }

    if (!this.historial.find(h => h.food.label === food.label)) {
      this.historial.unshift(item);
      this.historial = this.historial.slice(0, 5);
    }
    this.query = '';
    this.resultadosBusqueda = [];
  }

  eliminarDeHistorial(item: any) {
    this.historial = this.historial.filter(h => h.food.label !== item.food.label);
  }

  /**
   * Envía el alimento al servicio de nutrición global.
   * @function agregarAlimentoDesdeContador
   */
  agregarAlimentoDesdeContador() {
    if (!this.alimentoSeleccionado) return;
    const food = this.alimentoSeleccionado;

    const alimentoParaHome = {
      nombre: food.label,
      categoria: this.determinarCategoria(food.nutrients),
      kcal: Math.round(food.nutrients?.ENERC_KCAL || 0),
      img: food.image || this.defaultImage
    };

  
    this.nutritionService.agregarAlimento(alimentoParaHome, this.cantidad);

    this.alimentoSeleccionado = null;
    this.cantidad = 100;
    this.query = '';
  }

  /**
   * @function agregarAlimentoManual - Agrega el alimento a un registro local (desayuno, almuerzo, cena) con los macros calculados 
   * Nota: por ahora esto es para registro interno, el Home usa agregarAlimentoDesdeContador()
   * @param item 
   * @returns 
   */
  agregarAlimentoManual(item?: any) {
    const food = item ? item.food : this.alimentoSeleccionado;
    if (!food) return;
    const factor = this.cantidad / 100;

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

  /**
   * Clasifica un alimento por su macro nutriente predominante.
   * @function determinarCategoria
   * @param {any} nutrients - Datos nutricionales del alimento.
   * @returns {string} - 'Proteínas' | 'Carbohidratos' | 'Grasas' | 'General'.
   */
  determinarCategoria(nutrients: any): string {
    if (!nutrients) return 'General';

    const prot = nutrients.PROCNT || 0;
    const carb = nutrients.CHOCDF || 0;
    const fat = nutrients.FAT || 0;

    const max = Math.max(prot, carb, fat);
    if (max === 0) return 'General';


    if (max === carb) return 'Carbohidratos';
    if (max === prot) return 'Proteínas';
    if (max === fat) return 'Grasas';

    return 'General';
  }

  /**
   * Prepara un alimento para ser editado y abre el modal de edición.
   * Crea una copia del objeto item para evitar mutaciones directas y establece una cantidad inicial.
   * 
   * @param {any} item - El objeto de alimento seleccionado originalmente.
   */
  agregarAContador(item: any) {
    this.alimentoParaEditar = { ...item, cantidad: 100 };
    this.isModalOpen = true;
  }

  /**
   * @function confirmarSeleccion
   * Confirma la selección del alimento editado y lo agrega a la lista de consumo.
   * Cierra el modal, limpia la variable de edición y guarda el registro en la lista.
   */
  confirmarSeleccion() {
    if (this.alimentoParaEditar) {
      this.listaConsumo.push(this.alimentoParaEditar);
    }
    this.isModalOpen = false;
    this.alimentoParaEditar = null;
  }

  /**
   * Transfiere todos los alimentos seleccionados al contador diario (Home).
   * @function transferirAlimentosAHome
   */
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
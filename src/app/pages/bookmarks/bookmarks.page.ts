import { Component, OnInit } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
// import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NutritionService } from '../../services/nutrition.service';
import { FirebaseService } from '../../services/firebase.service';
import { getCurrentUser } from 'aws-amplify/auth';

@Component({
  selector: 'app-bookmarks',
  templateUrl: './bookmarks.page.html',
  styleUrls: ['./bookmarks.page.scss'],
  standalone: false, // Indica que este componente es independiente y no requiere estar declarado en un ngModule
})
export class BookmarksPage implements OnInit {

  // Variables de estado del componente
  filtroActivo: string = 'Todos'; // Almacena qué categoría de filtro está seleccionada actualmente en la UI
  busqueda: string = ''; // Almacena el texto que el usuario escribe en la barra de búsqueda
  buscando: boolean = false; // Bandera para mostrar un indicador de carga (spinner) cuando se busca o carga algo
  userId: string = ''; // Almacena el ID del usuario actualmente autenticado (obtenido de AWS Amplify)
  bookmarks: any[] = []; // Arreglo que contiene la lista completa de alimentos guardados en favoritos

  // Inyección de dependencias en el constructor
  constructor(
    private nutritionService: NutritionService, // Servicio para manejar la lógica nutricional (agregar al contador)
    private firebaseService: FirebaseService, // Servicio para interactuar con la base de datos de Firebase
    private toastController: ToastController
  ) {}

  /**
   * @function ngOnInit
   * @description Método del ciclo de vida de Angular que se ejecuta al inicializar el componente.
   * Obtiene el usuario autenticado actualmente y carga la lista de favoritos desde la base de datos.
   */
  async ngOnInit() {
    try {
      // Obtiene el usuario autenticado actualmente a través de AWS Amplify
      const user = await getCurrentUser();
      this.userId = user.userId;
      // Carga la lista de favoritos desde la base de datos
      await this.cargarBookmarks();
    } catch (e) {
      console.log('No hay usuario logueado');
    }
  }

  /**
   * @function ionViewWillEnter
   * @description Método del ciclo de vida de Ionic que se ejecuta justo antes de que la página entre y se vuelva activa.
   * Verifica si ya se tiene el userId, y si es así, recarga la lista. Si no, intenta obtenerlo nuevamente.
   */
  async ionViewWillEnter() {
    // Verificamos si ya tenemos el userId. Si es así, recargamos la lista
    if (this.userId) {
      await this.cargarBookmarks();
    } else {
      // Si no tenemos el userId, intentamos obtenerlo nuevamente y luego cargamos la lista
      try {
        const user = await getCurrentUser();
        this.userId = user.userId;
        await this.cargarBookmarks();
      } catch (e) {
        console.log('No hay usuario logueado');
      }
    }
  }

  /**
   * @function cargarBookmarks
   * @description Método para obtener los favoritos de la base de datos de Firebase usando el ID del usuario.
   */
  async cargarBookmarks() {
    this.bookmarks = await this.firebaseService.getBookmarks(this.userId);
  }

  /**
   * @function toggleBookmark
   * @description Método para guardar un nuevo alimento en la base de datos de favoritos.
   */
  async toggleBookmark(alimento: any) {
    if (!this.userId) return; // Si no hay usuario, cancelamos la acción
    await this.firebaseService.agregarBookmark(this.userId, alimento);
    await this.cargarBookmarks(); // Actualiza la lista para reflejar los cambios en pantalla
  }

  /**
   * @function eliminarBookmark
   * @description Método para eliminar un alimento específico de la lista de favoritos en Firebase.
   */
  async eliminarBookmark(alimento: any) {
    if (!alimento.id) return; // Si el alimento no tiene ID, no se puede eliminar
    await this.firebaseService.eliminarBookmark(alimento.id);
    await this.cargarBookmarks(); // Recarga la lista para que el elemento desaparezca de la pantalla
  }

  /**
   * @function buscar
   * @description Método que se activa cada vez que el usuario escribe en la barra de búsqueda.
   * Actualiza la variable de búsqueda.
   */
  buscar(evento: any) {
    const query = evento.target.value; // Obtiene el texto escrito en el input
    this.busqueda = query; // Actualiza la variable de búsqueda
  }

  /**
   * @function alimentosMostrados
   * @description Getter dinámico: Retorna la lista filtrada de alimentos que se mostrará en la interfaz.
   * Filtra por categoría y texto de búsqueda.
   */
  get alimentosMostrados() {
    let lista = this.bookmarks; // Empezamos con la lista completa
    
    // 1. Filtrado por categoría (Carbohidratos, Proteínas, etc.)
    if (this.filtroActivo !== 'Todos') {
      lista = lista.filter((a: any) => a.categoria === this.filtroActivo);
    }
    
    // 2. Filtrado por texto (lo que el usuario tipeó en la barra de búsqueda)
    if (this.busqueda.trim() !== '') {
      lista = lista.filter((a: any) =>
        a.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
      );
    }
    
    return lista; // Devuelve la lista ya filtrada
  }

  /**
   * @function setFiltro
   * @description Método para actualizar el filtro seleccionado (ej: al presionar el botón "Proteínas").
   */
  setFiltro(filtro: string) {
    this.filtroActivo = filtro;
  }

  /**
   * @function toggleMenu
   * @description Método para abrir o cerrar el submenú de un alimento (donde se seleccionan los gramos).
   */
  toggleMenu(alimento: any) {
    alimento.menuAbierto = !alimento.menuAbierto; // Invierte el valor actual (de verdadero a falso o viceversa)
  }

  /**
   * @function seleccionarGramos
   * @description Método para registrar cuántos gramos quiere el usuario de un alimento en particular.
   */
  seleccionarGramos(alimento: any, gramos: number) {
    alimento.gramosSeleccionados = gramos;
  }

  /**
   * @function agregarAlHome
   * @description Agrega el alimento con los gramos seleccionados al contador diario.
   * Calcula los macronutrientes en base a las calorías si es necesario y muestra un mensaje de éxito.
   */
  async agregarAlHome(alimento: any) {
    if (!alimento.gramosSeleccionados || alimento.gramosSeleccionados <= 0) return;
    
    let grasas = Number(alimento.grasasG) || 0;
    let proteinas = Number(alimento.proteinasG) || 0;
    let carbs = Number(alimento.carbohidratosG) || 0;

    if (grasas === 0 && proteinas === 0 && carbs === 0 && alimento.kcal > 0) {
      carbs = Math.round((alimento.kcal * 0.5) / 4);
      proteinas = Math.round((alimento.kcal * 0.3) / 4);
      grasas = Math.round((alimento.kcal * 0.2) / 9);
    }

    const mapeadoParaServicio = {
      food: {
        label: alimento.nombre,
        foodId: alimento.id || Date.now().toString(),
        image: alimento.img || '',
        nutrients: {
          ENERC_KCAL: alimento.kcal || 0,
          FAT: grasas,
          PROCNT: proteinas,
          CHOCDF: carbs,
          NA: alimento.sodioMg || 0,
          FIBTG: alimento.fibraG || 0,
          K: alimento.potasioMg || 0
        }
      }
    };

    await this.nutritionService.agregarAlimentoEdamam(mapeadoParaServicio, alimento.gramosSeleccionados);
    
    const gramosCargados = alimento.gramosSeleccionados;
    alimento.menuAbierto = false;
    alimento.gramosSeleccionados = null; 

    const toast = await this.toastController.create({
      message: `¡Alimentos añadidos con éxito al contador diario!`,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }
}
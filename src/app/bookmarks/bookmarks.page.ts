import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
// import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { NutritionService } from '../services/nutrition.service';
import { FirebaseService } from '../services/firebase.service';
import { getCurrentUser } from 'aws-amplify/auth';

@Component({
  selector: 'app-bookmarks',
  templateUrl: './bookmarks.page.html',
  styleUrls: ['./bookmarks.page.scss'],
  standalone: true, // Indica que este componente es independiente y no requiere estar declarado en un ngModule
  imports: [IonicModule, CommonModule, FormsModule] // Módulos necesarios para la vista (UI, directivas de Angular, enrutamiento, formularios)
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
    private firebaseService: FirebaseService // Servicio para interactuar con la base de datos de Firebase
  ) {}

  // Método del ciclo de vida de Angular que se ejecuta al inicializar el componente
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

  // Método del ciclo de vida de Ionic que se ejecuta justo antes de que la página entre y se vuelva activa
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

  // Método para obtener los favoritos de la base de datos de Firebase usando el ID del usuario
  async cargarBookmarks() {
    this.bookmarks = await this.firebaseService.getBookmarks(this.userId);
  }

  // Método para guardar un nuevo alimento en la base de datos de favoritos
  async toggleBookmark(alimento: any) {
    if (!this.userId) return; // Si no hay usuario, cancelamos la acción
    await this.firebaseService.agregarBookmark(this.userId, alimento);
    await this.cargarBookmarks(); // Actualiza la lista para reflejar los cambios en pantalla
  }

  // Método para eliminar un alimento específico de la lista de favoritos en Firebase
  async eliminarBookmark(alimento: any) {
    if (!alimento.id) return; // Si el alimento no tiene ID, no se puede eliminar
    await this.firebaseService.eliminarBookmark(alimento.id);
    await this.cargarBookmarks(); // Recarga la lista para que el elemento desaparezca de la pantalla
  }

  // Método que se activa cada vez que el usuario escribe en la barra de búsqueda
  buscar(evento: any) {
    const query = evento.target.value; // Obtiene el texto escrito en el input
    this.busqueda = query; // Actualiza la variable de búsqueda
  }

  // Getter dinámico: Retorna la lista filtrada de alimentos que se mostrará en la interfaz
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

  // Método para actualizar el filtro seleccionado (ej: al presionar el botón "Proteínas")
  setFiltro(filtro: string) {
    this.filtroActivo = filtro;
  }

  // Método para abrir o cerrar el submenú de un alimento (donde se seleccionan los gramos)
  toggleMenu(alimento: any) {
    alimento.menuAbierto = !alimento.menuAbierto; // Invierte el valor actual (de verdadero a falso o viceversa)
  }

  // Método para registrar cuántos gramos quiere el usuario de un alimento en particular
  seleccionarGramos(alimento: any, gramos: number) {
    alimento.gramosSeleccionados = gramos;
  }

  // Método para agregar el alimento con los gramos indicados al contador general (Home)
  agregarAlHome(alimento: any) {
    // Si no ingresó gramos o si los gramos son cero o menos, cancelamos la acción
    if (!alimento.gramosSeleccionados || alimento.gramosSeleccionados <= 0) return;
    
    // Llamamos al servicio de nutrición para añadir este alimento a los cálculos diarios
    this.nutritionService.agregarAlimento(alimento, alimento.gramosSeleccionados);
    
    // Cerramos el menú del alimento para mejorar la experiencia de usuario
    alimento.menuAbierto = false;
  }
}
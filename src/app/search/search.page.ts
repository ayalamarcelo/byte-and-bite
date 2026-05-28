import { Component, OnInit } from '@angular/core';
import { EdamamService } from '../services/edamam.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
  standalone: false,
})
export class SearchPage implements OnInit {
  query: string = '';
  resultadosBusqueda: any[] = [];
  alimentoSeleccionado: any = null;
  listaRecientes: any[] = [];
  listaConsumo: any[] = [];
  alimentoParaEditar: any = null;
  isModalOpen = false;
  isInfoModalOpen: boolean = false;
  cache: { [key: string]: any } = {};
  itemExpandido: any = null;

  private searchSubject = new Subject<string>();

  constructor(private edamamService: EdamamService) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(query => this.edamamService.buscarAlimento(query))
    ).subscribe({
      next: (respuesta: any) => this.resultadosBusqueda = respuesta?.hints || [],
      error: (err) => console.error("Error en búsqueda:", err)
    });
  }

  ngOnInit() {
    const guardado = localStorage.getItem('ultimoAlimento');
    if (guardado) this.alimentoSeleccionado = JSON.parse(guardado);
  }

  onSearchChange(event: any) {
    const valor = event.detail.value;
    if (valor && valor.length >= 3) {
      this.searchSubject.next(valor);
    } else {
      this.resultadosBusqueda = [];
    }
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

  // getter para mostrar en pantalla automáticamente
  get totalCalorias(): number {
    return this.calcularTotalCalorias();
  }

  // manual
  calcularTotalCalorias(): number {
    return this.listaConsumo.reduce((total, item) => {
      const kcalBase = item.food.nutrients?.ENERC_KCAL || 0;
      const porcion = item.cantidad || 100;
      return total + (kcalBase * (porcion / 100));
    }, 0);
  }

  seleccionarAlimento(item: any) {
    if (!this.listaRecientes.find(i => i.food.foodId === item.food.foodId)) {
      this.listaRecientes.unshift(item);
      localStorage.setItem('recientes', JSON.stringify(this.listaRecientes));
    }
    this.query = '';
    this.resultadosBusqueda = [];
  }

  agregarAContador(item: any) {
    this.alimentoParaEditar = { ...item, cantidad: 100 };
    this.isModalOpen = true;
  }

  confirmarSeleccion() {
    this.listaConsumo.push(this.alimentoParaEditar);
    this.isModalOpen = false;
    this.alimentoParaEditar = null;
  }

  eliminarReciente(item: any) {
    this.listaRecientes = this.listaRecientes.filter(i => i.food.foodId !== item.food.foodId);
    localStorage.setItem('recientes', JSON.stringify(this.listaRecientes));
  }

  // implementación de trackBy para evitar que Angular re-renderice toda la lista
  trackByFn(index: number, item: any) {
    return item.id || index;
  }
}
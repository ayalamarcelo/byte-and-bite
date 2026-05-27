import { Component, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { EdamamService } from '../services/edamam.service';

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
  historial: { nombre: string, favorito: boolean }[] = [];

  comidas: any = {
    desayuno: [],
    almuerzo: [],
    cena: []
  };

  tipoComida: 'desayuno' | 'almuerzo' | 'cena' = 'desayuno';
  cantidad: number = 100;
  private lastQuery = '';
  defaultImage: string = 'https://ionicframework.com/docs/img/demos/card-media.png';

  constructor(private edamamService: EdamamService) { }

  ngOnInit() {
    const guardado = localStorage.getItem('ultimoAlimento');
    if (guardado) {
      this.alimentoSeleccionado = JSON.parse(guardado);
    }
  }

  async onSearchChange(event: any) {
    const valor = event.detail.value;
    if (!valor || valor.length < 3) {
      this.resultadosBusqueda = [];
      return;
    }
    if (valor === this.lastQuery) return;
    this.lastQuery = valor;

    try {
      const respuesta: any = await firstValueFrom(this.edamamService.buscarAlimento(valor));
      this.resultadosBusqueda = respuesta?.hints || [];
    } catch (error) {
      console.error(error);
    }
  }

  seleccionarAlimento(item: any) {
    const food = item.food;
    this.query = food.label;
    this.alimentoSeleccionado = {
      ...food,
      image: food.image || this.defaultImage
    };
    
    localStorage.setItem('ultimoAlimento', JSON.stringify(this.alimentoSeleccionado));
    this.resultadosBusqueda = [];

    if (!this.historial.find(h => h.nombre === food.label)) {
      this.historial.unshift({ nombre: food.label, favorito: false });
      this.historial = this.historial.slice(0, 5);
    }
  }

  agregarAlimentoManual() {
    if (!this.alimentoSeleccionado) return;
    const food = this.alimentoSeleccionado;
    const factor = this.cantidad / 100;

    const item = {
      nombre: food.label,
      cantidad: this.cantidad,
      calorias: (food.nutrients?.ENERC_KCAL || 0) * factor,
      proteina: (food.nutrients?.PROCNT || 0) * factor,
      grasa: (food.nutrients?.FAT || 0) * factor,
      carbs: (food.nutrients?.CHOCDF || 0) * factor
    };

    this.comidas[this.tipoComida].push(item);
    this.cantidad = 100;
    // this.alimentoSeleccionado = null; // Descomenta si quieres que se borre al agregar
  }

  // Getters y otros métodos...
  get totalCalorias() { return this.getTotal('calorias'); }
  private getTotal(prop: string) {
    return (this.comidas.desayuno || []).reduce((a: number, b: any) => a + (b[prop] || 0), 0) +
           (this.comidas.almuerzo || []).reduce((a: number, b: any) => a + (b[prop] || 0), 0) +
           (this.comidas.cena || []).reduce((a: number, b: any) => a + (b[prop] || 0), 0);
  }

  onImgError(event: any) { event.target.src = this.defaultImage; }
}
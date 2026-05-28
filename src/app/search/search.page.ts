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
  listaRecientes: any[] = [];
  historial: { nombre: string, favorito: boolean }[] = [];

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
    // Agregar a la lista de recientes si no existe
    if (!this.listaRecientes.find(i => i.food.foodId === item.food.foodId)) {
      this.listaRecientes.unshift(item); // Lo añade al principio
      localStorage.setItem('recientes', JSON.stringify(this.listaRecientes));
    }

    // Limpiar el buscador, el dropdown y la query
    this.query = '';
    this.resultadosBusqueda = [];
    this.lastQuery = '';
  }

  // eliminar de la lista de recientes
  eliminarReciente(item: any) {
    // 1. Filtramos el array para quitar el elemento seleccionado
    this.listaRecientes = this.listaRecientes.filter(
      i => i.food.foodId !== item.food.foodId
    );

    // 2. Sincronizamos el localStorage con el nuevo array
    localStorage.setItem('recientes', JSON.stringify(this.listaRecientes));
  }
}
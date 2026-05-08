import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-bookmarks',
  templateUrl: './bookmarks.page.html',
  styleUrls: ['./bookmarks.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink]
})
export class BookmarksPage implements OnInit {

  filtroActivo: string = 'Todos';

  alimentos: any[] = [
    {
      nombre: 'Palta',
      categoria: 'Grasas',
      kcal: 160,
      gramos: 100,
      img: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=400&h=200&fit=crop',
      menuAbierto: false,
      gramosSeleccionados: 0
    },
    {
      nombre: 'Arroz integral',
      categoria: 'Carbohidratos',
      kcal: 130,
      gramos: 100,
      img: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400&h=200&fit=crop',
      menuAbierto: false,
      gramosSeleccionados: 0
    },
    {
      nombre: 'Pechuga de pollo',
      categoria: 'Proteínas',
      kcal: 165,
      gramos: 100,
      img: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=200&fit=crop',
      menuAbierto: false,
      gramosSeleccionados: 0
    }
  ];

  get alimentosFiltrados() {
    if (this.filtroActivo === 'Todos') return this.alimentos;
    return this.alimentos.filter(a => a.categoria === this.filtroActivo);
  }

  setFiltro(filtro: string) {
    this.filtroActivo = filtro;
  }

  toggleMenu(alimento: any) {
    alimento.menuAbierto = !alimento.menuAbierto;
  }

  seleccionarGramos(alimento: any, gramos: number) {
    alimento.gramosSeleccionados = gramos;
  }

  constructor() { }

  ngOnInit() { }

}
import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { NutritionService } from '../services/nutrition';
  

@Component({
  selector: 'app-bookmarks',
  templateUrl: './bookmarks.page.html',
  styleUrls: ['./bookmarks.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink, FormsModule]
})
export class BookmarksPage implements OnInit {

  filtroActivo: string = 'Todos';
  busqueda: string = '';
  resultadosBusqueda: any[] = [];
  buscando: boolean = false;
  private searchSubject = new Subject<string>();

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

  constructor(private http: HttpClient, private nutritionService: NutritionService) {
    this.searchSubject.pipe(
      debounceTime(800),
      distinctUntilChanged()
    ).subscribe(query => {
      this.hacerBusqueda(query);
    });
  }

  ngOnInit() { }

  buscar(evento: any) {
    const query = evento.target.value;
    this.busqueda = query;

    if (!query || query.trim() === '') {
      this.resultadosBusqueda = [];
      return;
    }

    this.buscando = true;
    this.searchSubject.next(query);
  }

  hacerBusqueda(query: string) {
    const url = `${environment.edamam.baseUrl}?app_id=${environment.edamam.appId}&app_key=${environment.edamam.appKey}&ingr=${query}`;

    this.http.get<any>(url).subscribe({
      next: (data) => {
        this.resultadosBusqueda = data.hints
          .filter((item: any) =>
            item.food.label.toLowerCase().includes(query.toLowerCase())
          )
          .map((item: any) => ({
            nombre: item.food.label,
            categoria: item.food.category || 'General',
            kcal: Math.round(item.food.nutrients?.ENERC_KCAL || 0),
            gramos: 100,
            img: item.food.image || 'https://via.placeholder.com/400x200',
            menuAbierto: false,
            gramosSeleccionados: 0
          }));
        this.buscando = false;
      },
      error: () => {
        this.buscando = false;
      }
    });
  }

  get alimentosMostrados() {
    if (this.busqueda.trim() !== '') return this.resultadosBusqueda;
    if (this.filtroActivo === 'Todos') return this.alimentos;
    return this.alimentos.filter((a: any) => a.categoria === this.filtroActivo);
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
  agregarAlHome(alimento: any) {
  if (!alimento.gramosSeleccionados || alimento.gramosSeleccionados <= 0) return;
  this.nutritionService.agregarAlimento(alimento, alimento.gramosSeleccionados);
  alimento.menuAbierto = false;
}
}
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NutritionService {

  private alimentosAgregados: any[] = [];
  private alimentosSubject = new BehaviorSubject<any[]>([]);
  alimentos$ = this.alimentosSubject.asObservable();

  agregarAlimento(alimento: any, gramos: number) {
    const factor = gramos / 100;
    const nuevo = {
      nombre: alimento.nombre,
      categoria: alimento.categoria,
      kcal: Math.round(alimento.kcal * factor),
      gramos: gramos,
      img: alimento.img
    };
    this.alimentosAgregados.push(nuevo);
    this.alimentosSubject.next([...this.alimentosAgregados]);
  }

  getTotalKcal(): number {
    return this.alimentosAgregados.reduce((sum, a) => sum + a.kcal, 0);
  }

  getPorcentajes() {
    const porCategoria: any = { Grasas: 0, Proteínas: 0, Carbohidratos: 0 };
    const total = this.getTotalKcal();

    this.alimentosAgregados.forEach(a => {
      if (porCategoria[a.categoria] !== undefined) {
        porCategoria[a.categoria] += a.kcal;
      }
    });

    return {
      grasas: total > 0 ? Math.round((porCategoria['Grasas'] / total) * 100) : 0,
      proteinas: total > 0 ? Math.round((porCategoria['Proteínas'] / total) * 100) : 0,
      carbohidratos: total > 0 ? Math.round((porCategoria['Carbohidratos'] / total) * 100) : 0
    };
  }
}
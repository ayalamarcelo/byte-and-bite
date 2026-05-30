import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NutritionService {

  private alimentosAgregados: any[] = [];
  private alimentosSubject = new BehaviorSubject<any[]>([]);
  private aguaSubject = new BehaviorSubject<number>(0);

  alimentos$ = this.alimentosSubject.asObservable();
  agua$ = this.aguaSubject.asObservable();

  agregarAlimento(alimentoEdamam: any, gramos: number) {
    const factor = gramos / 100;
    const nutrients = alimentoEdamam.food.nutrients || {};

    const nuevo = {
      id: alimentoEdamam.food.foodId,
      nombre: alimentoEdamam.food.label,
      gramos: gramos,
      kcal: Math.round((nutrients.ENERC_KCAL || 0) * factor),
      grasasG: (nutrients.FAT || 0) * factor,
      proteinasG: (nutrients.PROCNT || 0) * factor,
      carbohidratosG: (nutrients.CHOCDF || 0) * factor,
      fibraG: (nutrients.FIBTG || 0) * factor
    };

    this.alimentosAgregados.push(nuevo);
    this.alimentosSubject.next([...this.alimentosAgregados]);
  }

  getTotalKcal(): number {
    return this.alimentosAgregados.reduce((sum, a) => sum + a.kcal, 0);
  }

  getPorcentajes() {
    const gramosTotales = this.alimentosAgregados.reduce((totales, a) => {
      totales.grasas += a.grasasG;
      totales.proteinas += a.proteinasG;
      totales.carbohidratos += a.carbohidratosG;
      return totales;
    }, { grasas: 0, proteinas: 0, carbohidratos: 0 });

    const sumaGramos = gramosTotales.grasas + gramosTotales.proteinas + gramosTotales.carbohidratos;

    return {
      grasas: sumaGramos > 0 ? Math.round((gramosTotales.grasas / sumaGramos) * 100) : 0,
      proteinas: sumaGramos > 0 ? Math.round((gramosTotales.proteinas / sumaGramos) * 100) : 0,
      carbohidratos: sumaGramos > 0 ? Math.round((gramosTotales.carbohidratos / sumaGramos) * 100) : 0
    };
  }

  getMicronutrientesTotales() {
    const fibraTotal = this.alimentosAgregados.reduce((sum, a) => sum + a.fibraG, 0);
    return {
      sodio: 0,
      fibra: Math.round(fibraTotal),
      potasio: 0
    };
  }

  sumarAgua(ml: number) {
    const actual = this.aguaSubject.value;
    this.aguaSubject.next(actual + ml);
  }

  vaciarContador() {
    this.alimentosAgregados = [];
    this.alimentosSubject.next([]);
  }
}
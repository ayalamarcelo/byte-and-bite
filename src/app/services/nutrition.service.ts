import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getCurrentUser } from 'aws-amplify/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBzgOuPbzGfOGey_nIUWhAJ0WqGVM1nGgg",
  authDomain: "byte-and-bite-a668c.firebaseapp.com",
  projectId: "byte-and-bite-a668c",
  storageBucket: "byte-and-bite-a668c.firebasestorage.app",
  messagingSenderId: "92084492666",
  appId: "1:92084492666:web:f1fc73818c55037dc3dec3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

@Injectable({
  providedIn: 'root'
})
export class NutritionService {

  private alimentosAgregados: any[] = [];
  private alimentosSubject = new BehaviorSubject<any[]>([]);
  private aguaSubject = new BehaviorSubject<number>(0);

  alimentos$ = this.alimentosSubject.asObservable();
  agua$ = this.aguaSubject.asObservable();

  private userId: string = '';

  constructor() {
    this.cargarDesdeLocalStorage();
    
    this.inicializarFirebase();
  }

  private cargarDesdeLocalStorage() {
    const fechaHoy = new Date().toLocaleDateString().replace(/\//g, '-');
    const fechaGuardada = localStorage.getItem('fecha_consumo');

    if (fechaGuardada !== fechaHoy) {
      localStorage.removeItem('alimentos_consumo');
      localStorage.removeItem('agua_consumida');
      localStorage.setItem('fecha_consumo', fechaHoy);
      this.alimentosAgregados = [];
      this.aguaSubject.next(0);
    } else {
      this.alimentosAgregados = JSON.parse(localStorage.getItem('alimentos_consumo') || '[]');
      const aguaGuardada = Number(localStorage.getItem('agua_consumida') || '0');
      this.aguaSubject.next(aguaGuardada);
    }
    this.alimentosSubject.next([...this.alimentosAgregados]);
  }

  async inicializarFirebase() {
    const fechaHoy = new Date().toLocaleDateString().replace(/\//g, '-');
    try {
      const user = await getCurrentUser();
      this.userId = user.userId;
      
      if (this.userId) {
        if (this.alimentosAgregados.length === 0) {
          const q = query(
            collection(db, 'consumosDiarios'), 
            where('userId', '==', this.userId),
            where('fecha', '==', fechaHoy)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            this.alimentosAgregados = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            this.alimentosSubject.next([...this.alimentosAgregados]);
            localStorage.setItem('alimentos_consumo', JSON.stringify(this.alimentosAgregados));
          }
        }
      }
    } catch (e) {
      console.log('NutritionService: Trabajando en modo local (LocalStorage activo).');
    }
  }

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
    localStorage.setItem('alimentos_consumo', JSON.stringify(this.alimentosAgregados));
  }

  async agregarAlimentoEdamam(alimentoEdamam: any, gramos: number) {
    const factor = gramos / 100;
    const nutrients = alimentoEdamam.food?.nutrients || {};
    const fechaHoy = new Date().toLocaleDateString().replace(/\//g, '-');

    const safeGet = (nutrientField: any): number => {
      if (!nutrientField) return 0;
      if (typeof nutrientField === 'object' && nutrientField.quantity !== undefined) {
        return Number(nutrientField.quantity) || 0;
      }
      return Number(nutrientField) || 0;
    };

    const nuevo = {
      id: alimentoEdamam.food?.foodId || Date.now().toString(),
      nombre: alimentoEdamam.food?.label || 'Alimento',
      gramos: gramos,
      kcal: Math.round(safeGet(nutrients.ENERC_KCAL) * factor),
      grasasG: safeGet(nutrients.FAT) * factor,
      proteinasG: safeGet(nutrients.PROCNT) * factor,
      carbohidratosG: safeGet(nutrients.CHOCDF) * factor,
      
      sodioMg: safeGet(nutrients.NA) * factor,
      fibraG: safeGet(nutrients.FIBTG) * factor,
      potasioMg: safeGet(nutrients.K) * factor,
      
      img: alimentoEdamam.food?.image || ''
    };

    this.alimentosAgregados.push(nuevo);
    this.alimentosSubject.next([...this.alimentosAgregados]);

    localStorage.setItem('alimentos_consumo', JSON.stringify(this.alimentosAgregados));
    localStorage.setItem('fecha_consumo', fechaHoy);

    if (this.userId) {
      try {
        await addDoc(collection(db, 'consumosDiarios'), {
          userId: this.userId,
          fecha: fechaHoy,
          ...nuevo
        });
      } catch (e) {
        console.error("Error de backup en Firebase:", e);
      }
    }
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

  getPorcentajesMacros() {
    const gramosTotales = this.alimentosAgregados.reduce((totales, a) => {
      totales.grasas += a.grasasG || 0;
      totales.proteinas += a.proteinasG || 0;
      totales.carbohidratos += a.carbohidratosG || 0;
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
    const fibraTotal = this.alimentosAgregados.reduce((sum, a) => sum + (a.fibraG || 0), 0);
    const sodioTotal = this.alimentosAgregados.reduce((sum, a) => sum + (a.sodioMg || 0), 0);
    const potasioTotal = this.alimentosAgregados.reduce((sum, a) => sum + (a.potasioMg || 0), 0);

    return {
      sodio: Math.round(sodioTotal), 
      fibra: Math.round(fibraTotal), 
      potasio: Math.round(potasioTotal) 
    };
  }

  sumarAgua(ml: number) {
    const actual = this.aguaSubject.value;
    const nuevoTotal = actual + ml;
    this.aguaSubject.next(nuevoTotal);

    const fechaHoy = new Date().toLocaleDateString().replace(/\//g, '-');
    localStorage.setItem('agua_consumida', nuevoTotal.toString());
    localStorage.setItem('fecha_consumo', fechaHoy);
  }

  async vaciarContador() {
    this.alimentosAgregados = [];
    this.alimentosSubject.next([]);
    this.aguaSubject.next(0);
    
    localStorage.removeItem('alimentos_consumo');
    localStorage.removeItem('agua_consumida');
  }

}
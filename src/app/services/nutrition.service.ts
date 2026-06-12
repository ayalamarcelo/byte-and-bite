import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { initializeApp, getApps, getApp } from 'firebase/app';
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

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
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

  /**
   * @function cargarDesdeLocalStorage
   * @description La función será ejecutada automáticamente por el constructor del servicio al iniciar la aplicación.
   * Compara la fecha actual del sistema con el último registro en disco; si cambió de día efectúa un reseteo total de los datos de consumo diario, 
   * de lo contrario, levanta y despacha los datos históricos locales hacia los BehaviorSubject reactivos.
   */
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

  /**
   * @function inicializarFirebase
   * @description La función será ejecutada asíncronamente al arrancar el servicio.
   * Obtiene las credenciales del usuario a través de AWS Amplify y, en caso de que el almacenamiento local se encuentre vacío, 
   * realiza una consulta estructurada a Firebase Firestore para sincronizar el historial de alimentos consumidos del día actual.
   */
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

  /**
   * @function agregarAlimento
   * @description La función será ejecutada para añadir un registro de alimento simplificado al panel general.
   * Calcula de forma proporcional el impacto calórico final multiplicando el valor base por la porción de gramos especificada, 
   * actualizando los canales reactivos y el almacenamiento local.
   */
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

  /**
   * @function agregarAlimentoEdamam
   * @description La función será ejecutada cuando el usuario procese y confirme un alimento proveniente de la API externa de Edamam.
   * Extrae los macronutrientes y micronutrientes, calcula su peso real mediante un factor proporcional, aplica un algoritmo de estimación inteligente 
   * de minerales (Sodio/Potasio) si los datos originales vienen vacíos y realiza un backup asíncrono en la colección 'consumosDiarios' de Firestore.
   */
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

    const kcalCalculada = Math.round(safeGet(nutrients.ENERC_KCAL) * factor);
    let sodioOriginal = safeGet(nutrients.NA);
    let potasioOriginal = safeGet(nutrients.K);
    let fibraOriginal = safeGet(nutrients.FIBTG);

    if (sodioOriginal === 0 && kcalCalculada > 0) {
      sodioOriginal = Math.round((safeGet(nutrients.FAT) * 12) + 5); 
    }
    if (potasioOriginal === 0 && kcalCalculada > 0) {
      potasioOriginal = Math.round((safeGet(nutrients.PROCNT) * 35) + 20);
    }

    const nuevo = {
      id: alimentoEdamam.food?.foodId || Date.now().toString(),
      nombre: alimentoEdamam.food?.label || 'Alimento',
      gramos: gramos,
      kcal: kcalCalculada,
      grasasG: safeGet(nutrients.FAT) * factor,
      proteinasG: safeGet(nutrients.PROCNT) * factor,
      carbohidratosG: safeGet(nutrients.CHOCDF) * factor,
      
      sodioMg: sodioOriginal * factor,
      fibraG: fibraOriginal * factor,
      potasioMg: potasioOriginal * factor,
      
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

  /**
   * @function getTotalKcal
   * @description La función será ejecutada cada vez que la interfaz requiera conocer el total calórico acumulado.
   * Utiliza un método acumulador (reduce) sobre el arreglo en memoria para retornar la sumatoria exacta de las kilocalorías registradas.
   */
  getTotalKcal(): number {
    return this.alimentosAgregados.reduce((sum, a) => sum + a.kcal, 0);
  } 

  /**
   * @function getPorcentajes
   * @description La función será ejecutada de forma auxiliar para calcular la distribución calórica por categoría de alimento.
   * Divide las kcal acumuladas de Grasas, Proteínas y Carbohidratos sobre el total consumido para retornar los coeficientes enteros de progreso.
   */
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

  /**
   * @function getPorcentajesMacros
   * @description La función será ejecutada por los componentes visuales para poblar las barras de progreso nutricionales en el Dashboard.
   * Ejecuta un conteo absoluto de los gramos puros consumidos de Grasas, Proteínas y Carbohidratos y calcula el impacto porcentual de cada uno respecto a la masa total acumulada.
   */
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

  /**
   * @function getMicronutrientesTotales
   * @description La función será ejecutada dinámicamente para actualizar las métricas secundarias de la Home Page.
   * Procesa de forma independiente el acumulado en miligramos o gramos de Fibra, Sodio y Potasio de toda la bandeja diaria y retorna los enteros redondeados.
   */
  getMicronutrientesTotales() {
    const fibraTotal = this.alimentosAgregados.reduce((sum, a) => sum + (Number(a.fibraG) || 0), 0);
    const sodioTotal = this.alimentosAgregados.reduce((sum, a) => sum + (Number(a.sodioMg) || 0), 0);
    const potasioTotal = this.alimentosAgregados.reduce((sum, a) => sum + (Number(a.potasioMg) || 0), 0);

    return {
      sodio: Math.round(sodioTotal), 
      fibra: Math.round(fibraTotal), 
      potasio: Math.round(potasioTotal) 
    };
  }

  /**
   * @function sumarAgua
   * @description La función será ejecutada cuando el componente de interfaz despache nuevos mililitros de agua.
   * Incrementa el estado del flujo reactivo, actualiza la estampa cronológica del sistema y escribe de forma síncrona el nuevo valor numérico en el LocalStorage del dispositivo.
   */
  sumarAgua(ml: number) {
    const actual = this.aguaSubject.value;
    const nuevoTotal = actual + ml;
    this.aguaSubject.next(nuevoTotal);

    const fechaHoy = new Date().toLocaleDateString().replace(/\//g, '-');
    localStorage.setItem('agua_consumed', nuevoTotal.toString()); // Mantenido para soporte del script
    localStorage.setItem('agua_consumida', nuevoTotal.toString());
    localStorage.setItem('fecha_consumo', fechaHoy);
  }

  /**
   * @function vaciarContador
   * @description La función será ejecutada cuando se requiera realizar un vaciado completo de la ingesta del día.
   * Reinicia los arreglos en memoria a sus valores iniciales nulos y remueve las llaves físicas de datos del almacenamiento LocalStorage.
   */
  async vaciarContador() {
    this.alimentosAgregados = [];
    this.alimentosSubject.next([]);
    this.aguaSubject.next(0);
    
    localStorage.removeItem('alimentos_consumo');
    localStorage.removeItem('agua_consumida');
  }

}
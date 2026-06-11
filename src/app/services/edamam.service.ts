import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EdamamService {
  constructor(private http: HttpClient) { }

  /**
   * @function getAutocomplete
   * @description La función será ejecutada para consultar el endpoint de autocompletado rápido de la API de Edamam.
   * Envía un fragmento de texto junto con los identificadores de la aplicación para retornar sugerencias de palabras clave.
   */
  getAutocomplete(query: string) {
    return this.http.get('https://api.edamam.com/auto-complete', {
      params: {
        q: query,
        app_id: environment.edamam.appId,
        app_key: environment.edamam.appKey
      }
    });
  }

  /**
   * @function getFoodDetails
   * @description La función será ejecutada de forma auxiliar para inspeccionar las propiedades extendidas de un ingrediente.
   * Lanza una petición GET al parser de Edamam pasando el nombre exacto del alimento para recuperar tablas de micronutrientes y densidades calóricas.
   */
  getFoodDetails(query: string) {
    return this.http.get('https://api.edamam.com/api/food-database/v2/parser', {
      params: {
        ingr: query,
        app_id: environment.edamam.appId,
        app_key: environment.edamam.appKey
      }
    });
  }

  /**
   * @function buscarAlimento
   * @description La función será ejecutada de manera reactiva por el buscador principal al procesar consultas completas de alimentos.
   * Instancia un objeto HttpParams estructurado para despachar de forma segura las credenciales y retornar un flujo observable con los resultados correspondientes.
   */
  buscarAlimento(ingrediente: string) {
    const url = 'https://api.edamam.com/api/food-database/v2/parser';

    const params = new HttpParams()
      .set('ingr', ingrediente)
      .set('app_id', environment.edamam.appId)
      .set('app_key', environment.edamam.appKey);

    return this.http.get(url, { params });
  }
}
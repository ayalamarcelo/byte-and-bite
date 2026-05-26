import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EdamamService {
  private baseUrl = 'environment.edamam.baseUrl';
  
  // credenciales de Edamam
  private appId = environment.edamam.appId;
  private appKey = environment.edamam.appKey;
  private autocompleteUrl = environment.edamam.autocompleteUrl;

  constructor(private http: HttpClient) {}

  // para sugerir palabras mientras el usuario escribe
  obtenerSugerencias(texto: string): Observable<any> {
    const params = new HttpParams()
      .set('q', texto)
      .set('limit', '5') // se limita a 5 sugerencias
      .set('app_id', this.appId)
      .set('app_key', this.appKey);

    return this.http.get(this.autocompleteUrl, { params });
  }


  // es para buscar ingredientes o platos cuando eligen uno
  buscarRecetas(ingrediente: string): Observable<any> {
    const params = new HttpParams()
      .set('type', 'public')
      .set('q', ingrediente)
      .set('app_id', this.appId)
      .set('app_key', this.appKey);

    return this.http.get(this.baseUrl, { params });
  }

  // falta hacer las respectivas funcionalidades en las pantallas, si añaden una del tp añadan acá y en environments
}
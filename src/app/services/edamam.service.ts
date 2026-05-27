import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EdamamService {
  constructor(private http: HttpClient) { }

  getAutocomplete(query: string) {
    return this.http.get('https://api.edamam.com/auto-complete', {
      params: {
        q: query,
        app_id: environment.edamam.appId,
        app_key: environment.edamam.appKey
      }
    });
  }

  getFoodDetails(query: string) {
    return this.http.get('https://api.edamam.com/api/food-database/v2/parser', {
      params: {
        ingr: query,
        app_id: environment.edamam.appId,
        app_key: environment.edamam.appKey
      }
    });
  }

  buscarAlimento(ingrediente: string) {
    const url = 'https://api.edamam.com/api/food-database/v2/parser';

    const params = new HttpParams()
      .set('ingr', ingrediente)
      .set('app_id', environment.edamam.appId)
      .set('app_key', environment.edamam.appKey);

    return this.http.get(url, { params });
  }
}
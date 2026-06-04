import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  constructor(private translate: TranslateService) {
    this.translate.addLangs(['es', 'en']);
    this.translate.setDefaultLang('es');
  }

  /**
   * @function initLanguage
   * @description La función será ejecutada automáticamente al arrancar la aplicación (usualmente en el app.component.ts).
   * Recupera de forma síncrona el último código de idioma guardado en el LocalStorage y configura el motor de traducción con esa preferencia.
   */
  initLanguage() {
    const savedLang = localStorage.getItem('idioma') || 'es';
    this.translate.use(savedLang);
    return savedLang;
  }

  /**
   * @function setLanguage
   * @description La función será ejecutada cuando el usuario cambie explícitamente el idioma desde el selector en la pantalla de perfil.
   * Aplica la nueva traducción de forma dinámica en toda la interfaz y persiste el código lingüístico en el LocalStorage.
   */
  setLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('idioma', lang);
  }

  /**
   * @function getCurrentLang
   * @description Función que actúa como un puente de consulta directa para los componentes de la vista.
   * Retorna un String con el identificador del idioma que se encuentra activo en el motor de TranslateService en ese instante.
   */
  getCurrentLang(): string {
    return this.translate.currentLang;
  }
}
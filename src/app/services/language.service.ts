import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  constructor(private translate: TranslateService) {
    this.translate.addLangs(['es', 'en']);
    this.translate.setDefaultLang('es');
  }

  initLanguage() {
    const savedLang = localStorage.getItem('idioma') || 'es';
    this.translate.use(savedLang);
    return savedLang;
  }

  // para cambiar idioma
  setLanguage(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('idioma', lang);
  }

  // getter para saber el idioma actual
  getCurrentLang(): string {
    return this.translate.currentLang;
  }
}
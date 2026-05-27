import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HttpBackend } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// Importaciones para el sistema de traducción
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';

import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
registerLocaleData(localeEsAr);

// Cargador estático: Sin archivos externos, sin errores de red
export class FakeLoader implements TranslateLoader {
  getTranslation(lang: string) {
    const translations: any = {
      es: { WELCOME: "Bienvenido", HOME: "Inicio" },
      en: { WELCOME: "Welcome", HOME: "Home" }
    };
    return of(translations[lang] || translations['es']);
  }
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    FormsModule,
    AppRoutingModule,
    TranslateModule.forRoot({
      defaultLanguage: 'es',
      loader: {
        provide: TranslateLoader,
        useClass: FakeLoader
      }
    })
  ],
  exports: [TranslateModule],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: LOCALE_ID, useValue: 'es-AR' },
    provideHttpClient()
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
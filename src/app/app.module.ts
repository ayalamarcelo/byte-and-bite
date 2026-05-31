import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';

// Importaciones para el sistema de traducción
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { of } from 'rxjs';
import { TRANSLATIONS } from './i18n.data'; // Tu archivo externo

import { registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
registerLocaleData(localeEsAr);

// Cargador que utiliza los datos de tu archivo i18n.data.ts
export class FakeLoader implements TranslateLoader {
  getTranslation(lang: string) {
    return of(TRANSLATIONS[lang] || TRANSLATIONS['es']);
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
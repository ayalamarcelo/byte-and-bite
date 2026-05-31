import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Hub } from 'aws-amplify/utils';
import { LanguageService } from './services/language.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {

  constructor(private router: Router,
    private languageService: LanguageService
  ) { }

  ngOnInit() {
    // Escuchamos los eventos globales de autenticación de Amplify
    Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          console.log('Usuario ha iniciado sesión con Google/Cognito');
          this.router.navigate(['/tabs/home']);
          break;
        case 'signedOut':
          console.log('Sesión cerrada');
          this.router.navigate(['/login']);
          break;
      }
    });

    this.initializeApp();
  }

  // idioma se configura antes que el usuario vea la pantalla
  initializeApp() {
    this.languageService.initLanguage();
  }
}
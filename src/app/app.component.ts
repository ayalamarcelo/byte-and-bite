import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Hub } from 'aws-amplify/utils';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {

  constructor(private router: Router) { }

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
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomePage implements OnInit {

  porcentajeGrasas: number = 30;
  porcentajeProteinas: number = 60;
  porcentajeCarbos: number = 10;

  sodioMg: number = 1500;
  fibraG: number = 25;
  potasioMg: number = 3500;

  constructor() { }

  ngOnInit() {
  }

}
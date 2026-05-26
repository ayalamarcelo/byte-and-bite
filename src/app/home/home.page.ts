import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, DatePipe]
})
export class HomePage implements OnInit {

  percentageFats: number = 30;
  proteinPercentage: number = 60;
  percentageCarbo: number = 10;

  sodioMg: number = 1500;
  fibraG: number = 25;
  potasioMg: number = 3500;

  nameMonth: string = '';
  daysOfTheMonth: any[] = [];
  emptySpaces: number[] = [];
  rightNow: number = new Date().getDate();
  currentDate: Date = new Date();

  generarCalendario() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getFullYear() === 2026 && now.getMonth() === 4 ? 4 : now.getMonth();

    const options: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
    this.nameMonth = now.toLocaleDateString('es-ES', options);

    const numberOfDays = new Date(year, month + 1, 0).getDate();

    const firstDayOfTheWeek = new Date(year, month, 1).getDay();
    this.emptySpaces = Array(firstDayOfTheWeek).fill(0);

    this.daysOfTheMonth = [];
    for (let i = 1; i <= numberOfDays; i++) {
      let consumptionExample = 0;
      
      if (i === 1) consumptionExample = 2100; 
      if (i === 2) consumptionExample = 1500; 
      if (i === 3) consumptionExample = 1500; 
      if (i === 4) consumptionExample = 1500; 
      if (i === 5) consumptionExample = 2300; 
      if (i === 6) consumptionExample = 2300; 
      if (i === 7) consumptionExample = 2400; 
      if (i === 8) consumptionExample = 3400; 
      if (i === 9) consumptionExample = 1200; 
      if (i === 10) consumptionExample = 2100; 
      if (i === 11) consumptionExample = 2550; 
      if (i === 12) consumptionExample = 2670; 
      this.daysOfTheMonth.push({
        numero: i,
        consumido: consumptionExample,
        meta: 2000
      });
    }
  }

 goToProfile() {
  this.router.navigate(['/tabs/profile']); 
}

  constructor(private router: Router) { }

  ngOnInit() {
    this.generarCalendario();
  }
}
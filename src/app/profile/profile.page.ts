import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { IonicModule } from '@ionic/angular'; 
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false
  //imports: [IonicModule, CommonModule, FormsModule]
})
export class ProfilePage implements OnInit {
  constructor(private authService: AuthService) { }
  ngOnInit() { }

  async handleLogout() {
    await this.authService.logout();
  }
}
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WelcomePageRoutingModule } from './welcome-routing.module';

import { WelcomePage } from './welcome.page';
import { TermsPageModule } from '../terms/terms.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WelcomePageRoutingModule,
    TermsPageModule
  ],
  declarations: [WelcomePage]
})
export class WelcomePageModule { }

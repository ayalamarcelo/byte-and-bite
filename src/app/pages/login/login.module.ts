import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { LoginPageRoutingModule } from './login-routing.module';
import { LoginPage } from './login.page';

import { ConfirmSignupPageModule } from '../confirm-signup/confirm-signup.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoginPageRoutingModule,
    TranslateModule.forChild(),
    ConfirmSignupPageModule
  ],
  declarations: [
    LoginPage
  ]
})
export class LoginPageModule { }

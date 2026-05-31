import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmSignupPage } from '../confirm-signup/confirm-signup.page'

import { IonicModule } from '@ionic/angular';

import { LoginPageRoutingModule } from './login-routing.module';

import { LoginPage } from './login.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoginPageRoutingModule,
    TranslateModule.forChild(),
  ],
  declarations: [
    LoginPage,
    ConfirmSignupPage
  ]
})
export class LoginPageModule {}

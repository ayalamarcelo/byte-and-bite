import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConfirmSignupPage } from './confirm-signup.page';

const routes: Routes = [
  {
    path: '',
    component: ConfirmSignupPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfirmSignupPageRoutingModule {}

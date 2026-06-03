import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BookmarksPageRoutingModule } from './bookmarks-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { BookmarksPage } from './bookmarks.page'; 

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BookmarksPageRoutingModule,
    TranslateModule
  ],
  
  declarations: [BookmarksPage]
})
export class BookmarksPageModule {}
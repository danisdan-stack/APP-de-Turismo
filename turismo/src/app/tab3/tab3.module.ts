import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { Tab3PageRoutingModule } from './tab3-routing.module';
import { Tab3Page } from './tab3.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,  // ✅ IonicModule proporciona los componentes Ionic
    Tab3PageRoutingModule
  ],
  declarations: [Tab3Page]  // ✅ Declara el componente
})
export class Tab3PageModule {}
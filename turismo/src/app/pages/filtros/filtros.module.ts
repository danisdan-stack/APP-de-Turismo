import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FiltrosPageRoutingModule } from './filtros-routing.module';

import { FiltrosPage } from './filtros.page';
import { FiltrosModule } from '../../components/filtros/filtros.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FiltrosPageRoutingModule,
     FiltrosModule
  ],
  declarations: [FiltrosPage]
})
export class FiltrosPageModule {}

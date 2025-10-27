import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MapaPage } from './mapa.page'; 
import { IonicModule } from '@ionic/angular';
import {HttpClientModule} from '@angular/common/http'; 
import { MapaPageRoutingModule } from './mapa-routing.module';
import { FiltrosModule } from '../components/filtros/filtros.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MapaPageRoutingModule,
    FiltrosModule ,
       HttpClientModule,
  ],
  declarations: [MapaPage],
   providers: [
  
    
  ]
})
export class MapaPageModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FiltrosComponent } from './filtros.component';

@NgModule({
  declarations: [FiltrosComponent],
  imports: [
    CommonModule,    
    IonicModule,     
    RouterModule     
  ],
  exports: [FiltrosComponent] 
})
export class FiltrosModule { }
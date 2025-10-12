import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FiltrosComponent } from './filtros.component';

@NgModule({
  declarations: [FiltrosComponent],
  imports: [
    CommonModule,    // ← Para *ngIf, *ngFor
    IonicModule,     // ← Para componentes Ionic (ion-card, ion-button, etc.)
    RouterModule     // ← Para navegación con Router
  ],
  exports: [FiltrosComponent] // ← IMPORTANTE: para usar en otros módulos
})
export class FiltrosModule { }
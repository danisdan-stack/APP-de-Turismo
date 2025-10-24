import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-filtros-page',
  templateUrl: './filtros.page.html',
  standalone: false,
})
export class FiltrosPage {
  
  constructor(private router: Router) {}

  onFiltrosAplicados(filtros: any) {
    console.log('Redirigiendo al mapa con:', filtros);
    
    this.router.navigate(['/mapa'], {
      queryParams: filtros
    });
  }
  cambiarTab(event: any) {
  const tab = event.detail.value;
  
  // Mapear los valores del segment a las rutas correctas
  switch(tab) {
    case 'tab1':
      this.irATab1();
      break;
    case 'tab2':
      this.irATab2();
      break;
    case 'tab3':
      this.irATab3();
      break;
  }
}

  // 🔹 MÉTODOS DE NAVEGACIÓN ENTRE TABS
irATab1() {
  this.router.navigate(['/inicio']); 
}

irATab2() {
  this.router.navigate(['/favoritos']);
}

irATab3() {
  this.router.navigate(['/mi-cuenta']);
}

}
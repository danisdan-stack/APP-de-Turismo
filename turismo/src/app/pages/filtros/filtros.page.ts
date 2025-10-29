import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-filtros-page',
  templateUrl: './filtros.page.html',
  styleUrl :'./filtros.page.scss',
  standalone: false,
})
export class FiltrosPage {
  
  constructor(private router: Router) {}

  /**
   * @function onFiltrosAplicados
   * @description Maneja el evento cuando se aplican filtros desde el componente hijo y navega al mapa con los parámetros
   * @param {any} filtros - Objeto con los filtros seleccionados (provincia, categoría, paisaje)
   */
  onFiltrosAplicados(filtros: any) {
    console.log('Redirigiendo al mapa con:', filtros);
    
    this.router.navigate(['/mapa'], {
      queryParams: filtros
    });
  }
  /**
   * @function cambiarTab
   * @description Maneja el cambio de pestañas en la interfaz y redirige a la ruta correspondiente
   * @param {any} event - Evento del segmento/componente de pestañas con la pestaña seleccionada
   */
  cambiarTab(event: any) {
  const tab = event.detail.value;
  

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

 /**
   * @function irATab1
   * @description Navega a la página de inicio (Tab 1)
   */
irATab1() {
  this.router.navigate(['/inicio']); 
}
 /**
   * @function irATab2
   * @description Navega a la página de favoritos (Tab 2)
   */
irATab2() {
  this.router.navigate(['/favoritos']);
}
 /**
   * @function irATab3
   * @description Navega a la página de mi cuenta (Tab 3)
   */
irATab3() {
  this.router.navigate(['/mi-cuenta']);
}

}
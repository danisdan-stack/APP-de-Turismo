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
    
      this.router.navigate(['/mapa'], {  // ← '/mapa' 
      queryParams: filtros
    });
  }
}
import { Component, OnInit } from '@angular/core';
import { MeGustaService } from '../services/megusta';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false
})
export class Tab2Page implements OnInit {
  misFavoritos: any[] = [];
  cargando: boolean = true;

  constructor(
    private meGustaService: MeGustaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarMisFavoritos();
  }

  cargarMisFavoritos() {
    this.cargando = true;
    
    this.meGustaService.obtenerMisMeGusta().subscribe({
      next: (favoritos) => {
        this.misFavoritos = favoritos;
        this.cargando = false;
        console.log('✅ Favoritos cargados:', favoritos.length);
      },
      error: (error) => {
        console.error('❌ Error cargando favoritos:', error);
        this.cargando = false;
      }
    });
  }

  // ✅ IR AL MAPA CON EL PUNTO SELECCIONADO
  verEnMapa(favorito: any) {
    this.router.navigate(['/mapa'], {
      queryParams: {
        lat: favorito.ubicacion.latitud,
        lng: favorito.ubicacion.longitud,
        nombre: favorito.nombre_lugar,
        categoria: favorito.categoria,
        provincia: favorito.provincia,
        desdeFavoritos: true // Para saber que viene de favoritos
      }
    });
  }

  // ✅ ELIMINAR FAVORITO (para después)
  eliminarFavorito(favorito: any) {
    console.log('Eliminar favorito:', favorito.id);
    // Lo implementaremos después
  }



  direccionar(){
    console.log("te direcciono")
  }
  hola(){
    console.log("hola ")
  }

  irATab1() {
  this.router.navigate(['/inicio']); // o ['/filtros'] si prefieres
}

irATab2() {
  this.router.navigate(['/favoritos']);
}

irATab3() {
  this.router.navigate(['/mi-cuenta']);
}

}

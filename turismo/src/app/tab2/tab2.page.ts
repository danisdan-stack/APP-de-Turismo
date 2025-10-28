import { Component, OnInit } from '@angular/core';
import { MeGustaService } from '../services/megusta';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular'; // ✅ Añadir AlertController

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
    private router: Router,
    private alertController: AlertController // ✅ Inyectar AlertController
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
        desdeFavoritos: true
      }
    });
  }

  // ✅ ELIMINAR FAVORITO - IMPLEMENTADO
  async eliminarFavorito(favorito: any) {
    console.log('🗑️ Intentando eliminar favorito:', favorito.id);
    
    const alert = await this.alertController.create({
      header: 'Eliminar Favorito',
      message: `¿Estás seguro de que quieres eliminar "${favorito.nombre_lugar}" de tus favoritos?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            console.log('✅ Confirmado - Eliminando favorito...');
            await this.ejecutarEliminacion(favorito.id);
          }
        }
      ]
    });

    await alert.present();
  }

  // ✅ EJECUTAR ELIMINACIÓN
  private async ejecutarEliminacion(favoritoId: string) {
    try {
      const resultado = await this.meGustaService.eliminarMeGusta(favoritoId);
      
      if (resultado) {
        console.log('✅ Favorito eliminado exitosamente');
        this.mostrarMensajeExito();
        // Recargar la lista
        this.cargarMisFavoritos();
      } else {
        console.error('❌ Error al eliminar favorito');
        this.mostrarMensajeError();
      }
    } catch (error) {
      console.error('❌ Error eliminando favorito:', error);
      this.mostrarMensajeError();
    }
  }

  // ✅ MENSAJE DE ÉXITO
  private async mostrarMensajeExito() {
    const alert = await this.alertController.create({
      header: 'Eliminado',
      message: 'El favorito ha sido eliminado correctamente.',
      buttons: ['OK']
    });
    await alert.present();
  }

  // ✅ MENSAJE DE ERROR
  private async mostrarMensajeError() {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'No se pudo eliminar el favorito. Intenta nuevamente.',
      buttons: ['OK']
    });
    await alert.present();
  }

  direccionar(){
    console.log("te direcciono")
  }
  
  hola(){
    console.log("hola ")
  }

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
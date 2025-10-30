import { Component, OnInit } from '@angular/core';
import { MeGustaService } from '../services/megusta';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular'; 

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
    private alertController: AlertController 
  ) {}

  ngOnInit() {
    this.cargarMisFavoritos();
  }

  /**
   * @function cargarMisFavoritos
   * @description Carga la lista de lugares favoritos del usuario desde el servicio
   */
  cargarMisFavoritos() {
    this.cargando = true;
    this.meGustaService.obtenerMisMeGusta().subscribe({
      next: (favoritos) => {
        this.misFavoritos = favoritos;
        this.cargando = false;
        },
      error: (error) => {
        this.cargando = false;
      }
    });
  }

  /**
   * @function verEnMapa
   * @description Navega al mapa centrado en la ubicación del lugar favorito seleccionado
   * @param {any} favorito - Objeto con los datos del lugar favorito
   */
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

  /**
   * @function eliminarFavorito
   * @description Muestra una alerta de confirmación para eliminar un lugar de favoritos
   * @param {any} favorito - Objeto con los datos del lugar favorito a eliminar
   */
  async eliminarFavorito(favorito: any) {
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
            await this.ejecutarEliminacion(favorito.id);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * @function ejecutarEliminacion
   * @description Ejecuta la eliminación del favorito a través del servicio
   * @param {string} favoritoId - ID del favorito a eliminar
   * @private
   */
  private async ejecutarEliminacion(favoritoId: string) {
    try {
      const resultado = await this.meGustaService.eliminarMeGusta(favoritoId);
      if (resultado) {
        this.mostrarMensajeExito();
        this.cargarMisFavoritos();
      } else {
        this.mostrarMensajeError();
      }
    } catch (error) {
      this.mostrarMensajeError();
    }
  }

  /**
   * @function mostrarMensajeExito
   * @description Muestra una alerta indicando que la eliminación fue exitosa
   * @private
   */
  private async mostrarMensajeExito() {
    const alert = await this.alertController.create({
      header: 'Eliminado',
      message: 'El favorito ha sido eliminado correctamente.',
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * @function mostrarMensajeError
   * @description Muestra una alerta indicando que hubo un error en la eliminación
   * @private
   */
  private async mostrarMensajeError() {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'No se pudo eliminar el favorito. Intenta nuevamente.',
      buttons: ['OK']
    });
    await alert.present();
  }



  /**
   * @function irATab1
   * @description Navega a la pestaña de inicio
   */
  irATab1() {
    this.router.navigate(['/inicio']);
  }

  /**
   * @function irATab2
   * @description Navega a la pestaña de favoritos
   */

  irATab2() {
    this.router.navigate(['/favoritos']);
  }

    /**
   * @function irATab3
   * @description Navega a la pestaña de mi cuenta
   */
  irATab3() {
    this.router.navigate(['/mi-cuenta']);
  }
}
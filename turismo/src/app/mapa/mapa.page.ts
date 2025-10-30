import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { OverpassService, PuntoInteres, FiltrosBusqueda } from '../components/services/overpass.service';
import { MeGustaService } from '../services/megusta';
import { Localizacion } from '../services/localizacion';
import * as L from 'leaflet';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
  standalone: false,
})
export class MapaPage implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  puntos: PuntoInteres[] = [];
  cargando: boolean = false;
  error: string = '';
  filtrosActuales: FiltrosBusqueda = {};

  private map!: L.Map;
  private markers: L.Marker[] = [];
  private userMarker: L.Marker | null = null;

  constructor(
    private overpassService: OverpassService,
    private meGustaService: MeGustaService,
    private localizacion: Localizacion,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  /**
   * @function ngOnInit
   * @description Inicializa el componente, configura funciones globales y procesa parámetros de ruta
   */
  ngOnInit() {

    

    (window as any).centrarEnPuntoPopup = (lat: number, lon: number) => {
      this.centrarEnPuntoDesdePopup(lat, lon);
    };
    
    (window as any).guardarFavorito = (lat: number, lon: number, nombre: string, categoria: string, provincia: string) => {
      this.guardarFavorito(lat, lon, nombre, categoria, provincia);
    };
    

    (window as any).irAInicio = () => {
      this.router.navigate(['/inicio']);
    };
    
    (window as any).irAFavoritos = () => {
      this.router.navigate(['/favoritos']);
    };
    
    (window as any).irAMiCuenta = () => {
      this.router.navigate(['/mi-cuenta']);
    };
    
    this.configurarIconosLeaflet();
    
    setTimeout(() => {
      this.inicializarMapa();
    }, 100);
    
    this.route.queryParams.subscribe(params => {
      
      

      if (params['desdeFavoritos'] && params['lat'] && params['lng']) {

        this.mostrarPuntoFavorito(params);
      } else {
        const filtros: FiltrosBusqueda = {
          provincia: params['provincia'],
          categoria: params['categoria'],
          paisaje: params['paisaje']
        };

        if (filtros.provincia || filtros.paisaje) {
          this.filtrosActuales = filtros;
          this.buscarConFiltros(filtros);
        } else {
          this.puntos = [];
          this.limpiarMarcadores();
          if (this.map) {
            this.map.setView([-34.6037, -58.3816], 5);
          }
        }
      }
    });
  }

    /**
   * @function activarGPS
   * @description Muestra una alerta de confirmación para activar el GPS
   * @returns {Promise<void>}
   */
  async activarGPS() {
    const alert = await this.alertController.create({
      header: 'Activar GPS',
      message: '¿Deseas activar el GPS para ver tu ubicación en el mapa?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {

          }
        },
        {
          text: 'Activar',
          handler: () => {

            this.activarGPSConfirmado();
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * @function activarGPSConfirmado
   * @description Ejecuta la activación del GPS después de la confirmación del usuario
   * @private
   * @returns {Promise<void>}
   */
  private async activarGPSConfirmado() {
    try {
      const exito = await this.localizacion.cambiarEstadoGPS(true);
      if (exito) {
        this.showAlert('GPS Activado', 'La ubicación ha sido habilitada correctamente');
        setTimeout(() => {
          this.mostrarUbicacionUsuario2();
        }, 1000);
        
      } else {
        this.showAlert(
          'Permisos Denegados', 
          'No se pudieron obtener los permisos de ubicación. Verifica que tengas los permisos habilitados en tu dispositivo.'
        );
      }
    } catch (error) {
      this.showAlert('Error', 'Ocurrió un error al activar el GPS');
    }
  }

  /**
   * @function mostrarPuntoFavorito
   * @description Espera a que el mapa esté listo para mostrar un punto favorito
   * @param {any} params - Parámetros del punto favorito
   * @private
   */
  private mostrarPuntoFavorito(params: any) {
    const esperarMapa = setInterval(() => {
      if (this.map) {
        clearInterval(esperarMapa);
        this.mostrarPuntoFavoritoEnMapa(params);
      }
    }, 100);
  }

  /**
   * @function mostrarPuntoFavoritoEnMapa
   * @description Muestra un punto favorito específico en el mapa
   * @param {any} params - Parámetros del punto favorito
   * @private
   */
  private mostrarPuntoFavoritoEnMapa(params: any) {
    const puntoFavorito: PuntoInteres = {
      id: Date.now(),
      tipo: 'favorito',
      nombre: params['nombre'] || 'Sin nombre',
      categoria: params['categoria'] || 'Sin categoría',
      lat: parseFloat(params['lat']),
      lon: parseFloat(params['lng']),
      provincia: params['provincia'] || 'Sin provincia',
      tags: {}
    };
    this.limpiarMarcadores();
    if (puntoFavorito.lat && puntoFavorito.lon) {
      const marcador = L.marker([puntoFavorito.lat, puntoFavorito.lon])
        .addTo(this.map)
        .bindPopup(this.crearPopupContentFavorito(puntoFavorito))
        .openPopup();
      this.markers.push(marcador);
      this.map.setView([puntoFavorito.lat, puntoFavorito.lon], 14);
    } else {

    }
  }

  /**
   * @function crearPopupContentFavorito
   * @description Crea el contenido HTML para el popup de un punto favorito
   * @param {PuntoInteres} punto - Punto de interés favorito
   * @returns {string} HTML del popup
   * @private
   */
  private crearPopupContentFavorito(punto: PuntoInteres): string {
    return `
      <div style="text-align: center; min-width: 250px;">
        <strong style="font-size: 14px;">${punto.nombre || 'Sin nombre'}</strong><br>
        <em style="color: #666;">${punto.categoria}</em><br>
        <small>${punto.provincia || 'Provincia no especificada'}</small><br>
        <small style="color: #888;">${punto.lat.toFixed(4)}, ${punto.lon.toFixed(4)}</small>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
          <small style="color: #3880ff;">⭐ Este es uno de tus favoritos</small>
        </div>
        

        <div style="margin-top: 12px; padding: 8px 0; border-top: 1px solid #eee; display: flex; justify-content: space-between; gap: 4px;">
          <button onclick="irAInicio()" style="background: #3880ff; color: white; border: none; padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 10px; font-weight: bold; flex: 1;">🏠 Inicio</button>
          <button onclick="irAFavoritos()" style="background: #ff4081; color: white; border: none; padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 10px; font-weight: bold; flex: 1;">💖 Favoritos</button>
          <button onclick="irAMiCuenta()" style="background: #10dc60; color: white; border: none; padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 10px; font-weight: bold; flex: 1;">👤 Mi Cuenta</button>
        </div>
      </div>
    `;
  }
  /**
   * @function configurarIconosLeaflet
   * @description Configura los iconos por defecto de Leaflet
   * @private
   */
  private configurarIconosLeaflet() {
    const iconDefault = L.Icon.Default.prototype as any;
    delete iconDefault._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }
  /**
   * @function inicializarMapa
   * @description Inicializa el mapa Leaflet en el contenedor
   * @private
   */
  private inicializarMapa() {
    if (!this.mapContainer?.nativeElement) {
      return;
    }
    try {
      this.map = L.map(this.mapContainer.nativeElement).setView([-34.6037, -58.3816], 5);
      setTimeout(() => {
        this.map.invalidateSize();
      }, 300);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(this.map);
      setTimeout(() => {
        this.mostrarUbicacionUsuario();
      }, 2000);
    } catch (error) {

    }
  }
  /**
 * @function estaMostrandoFavorito
 * @description Verifica si actualmente se está mostrando un punto favorito
 * @returns {boolean}
 * @private
 */

  private estaMostrandoFavorito(): boolean {
    return this.route.snapshot.queryParams['desdeFavoritos'] === 'true';
  }
  /**
   * @function mostrarUbicacionUsuario
   * @description Muestra la ubicación actual del usuario en el mapa
   * @private
   * @returns {Promise<void>}
   */
  private async mostrarUbicacionUsuario() {
    try {
      if (this.estaMostrandoFavorito()) {
      return;
      }
      if (!this.localizacion.estaGPSHabilitado()) {
        return;
      }
      const ubicacion = await this.localizacion.getCurrentPosition();
      if (!ubicacion) {
        return;
      }
      if (this.userMarker) {
        this.map.removeLayer(this.userMarker);
      }
      const userIcon = this.crearIconoUsuario();
      this.userMarker = L.marker([ubicacion.lat, ubicacion.lng], {
        icon: userIcon,
        zIndexOffset: 1000
      })
      .addTo(this.map)
      .bindPopup('📍 ¡Estás aquí!')
      .openPopup();
      /*this.map.setView([ubicacion.lat, ubicacion.lng], 15, {
        animate: true,
        duration: 1
      });*/
    } catch (error: any) {
      if (error.message.includes('permission') || error.message.includes('permiso')) {
        this.showAlert(
          'Permisos Requeridos', 
          'Por favor, permite el acceso a la ubicación en la configuración de tu dispositivo.'
        );
      }
    }
  }

  private async mostrarUbicacionUsuario2() {
    try {

      if (!this.localizacion.estaGPSHabilitado()) {
        return;
      }
      const ubicacion = await this.localizacion.getCurrentPosition();
      if (!ubicacion) {
        return;
      }
      if (this.userMarker) {
        this.map.removeLayer(this.userMarker);
      }
      const userIcon = this.crearIconoUsuario();
      this.userMarker = L.marker([ubicacion.lat, ubicacion.lng], {
        icon: userIcon,
        zIndexOffset: 1000
      })
      .addTo(this.map)
      .bindPopup('📍 ¡Estás aquí!')
      .openPopup();
      this.map.setView([ubicacion.lat, ubicacion.lng], 15, {
        animate: true,
        duration: 1
      });
    } catch (error: any) {
      if (error.message.includes('permission') || error.message.includes('permiso')) {
        this.showAlert(
          'Permisos Requeridos', 
          'Por favor, permite el acceso a la ubicación en la configuración de tu dispositivo.'
        );
      }
    }
  }

  /**
   * @function crearIconoUsuario
   * @description Crea un icono personalizado para la ubicación del usuario
   * @returns {L.DivIcon} Icono personalizado de Leaflet
   * @private
   */
  private crearIconoUsuario(): L.DivIcon {
    return L.divIcon({
      html: `
        <div style="
          background: #3880ff;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `,
      className: 'user-location-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }
    /**
   * @function centrarEnMiUbicacion
   * @description Centra el mapa en la ubicación actual del usuario
   * @returns {Promise<void>}
   */
  async centrarEnMiUbicacion() {
    try {
      // ✅ VERIFICAR SI EL GPS ESTÁ HABILITADO
      if (!this.localizacion.estaGPSHabilitado()) {
        await this.mostrarAlertaGPSDeshabilitado();
        return;
      }
      await this.mostrarUbicacionUsuario();

    } catch (error: any) {
      this.mostrarErrorUbicacion(error);
    }
  }

  /**
   * @function mostrarAlertaGPSDeshabilitado
   * @description Muestra alerta cuando el GPS está deshabilitado
   * @private
   * @returns {Promise<void>}
   */
  private async mostrarAlertaGPSDeshabilitado() {
    const alert = await this.alertController.create({
      header: 'GPS Deshabilitado',
      message: 'El GPS está deshabilitado. Actívalo desde la configuración para ver tu ubicación.',
      buttons: [
        {
          text: 'Entendido',
          role: 'cancel'
        },
        {
          text: 'Activar GPS',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * @function mostrarErrorUbicacion
   * @description Muestra alerta de error al obtener la ubicación
   * @param {any} error - Error ocurrido
   * @private
   * @returns {Promise<void>}
   */
  private async mostrarErrorUbicacion(error: any) {
    const alert = await this.alertController.create({
      header: 'Error de Ubicación',
      message: `No se pudo obtener tu ubicación: ${error.message}. Asegúrate de permitir el acceso a la ubicación en tu dispositivo.`,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * @function showAlert
   * @description Muestra una alerta simple al usuario
   * @param {string} header - Encabezado de la alerta
   * @param {string} message - Mensaje de la alerta
   * @private
   * @returns {Promise<void>}
   */
  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  /**
   * @function buscarConFiltros
   * @description Realiza una búsqueda de puntos de interés con los filtros especificados
   * @param {FiltrosBusqueda} filtros - Filtros de búsqueda
   * @private
   * @returns {Promise<void>}
   */
  private async buscarConFiltros(filtros: FiltrosBusqueda) {
    this.cargando = true;
    this.error = '';
    try {
      const loading = await this.loadingController.create({
        message: this.generarMensajeBusqueda(filtros),
        spinner: 'crescent',
        duration: 30000
      });
      await loading.present();
      this.overpassService.buscarPuntos(filtros).subscribe({
        next: (puntos) => {

          this.puntos = puntos;
          this.actualizarMapaConPuntos(puntos);
          loading.dismiss();
          this.cargando = false;
        },
        error: (err) => {
          this.error = this.generarMensajeError(filtros);
          loading.dismiss();
          this.cargando = false;
          this.mostrarError(err);
        }
      });
    } catch (error) {
      this.cargando = false;
      this.mostrarError(error);
    }
  }
    /**
   * @function actualizarMapaConPuntos
   * @description Actualiza el mapa con los puntos de interés encontrados
   * @param {PuntoInteres[]} puntos - Array de puntos de interés
   * @private
   */
  private actualizarMapaConPuntos(puntos: PuntoInteres[]) {
    this.limpiarMarcadores();
    if (puntos.length === 0) {
      this.mostrarAlertaSinResultados();
      return;
    }
    puntos.forEach(punto => {
      if (punto.lat && punto.lon) {
        const marcador = L.marker([punto.lat, punto.lon])
          .addTo(this.map)
          .bindPopup(this.crearPopupContent(punto));
        this.markers.push(marcador);
      }
    });
    if (this.markers.length > 0) {
      setTimeout(() => {
        this.map.invalidateSize();
        this.ajustarVistaMapa();
      }, 100);
    }
  }

    /**
   * @function crearPopupContent
   * @description Crea el contenido HTML para el popup de un punto de interés
   * @param {PuntoInteres} punto - Punto de interés
   * @returns {string} HTML del popup
   * @private
   */
  private crearPopupContent(punto: PuntoInteres): string {
    const nombreSeguro = (punto.nombre || 'Sin nombre').replace(/'/g, "\\'");
    const categoriaSegura = (punto.categoria || '').replace(/'/g, "\\'");
    const provinciaSegura = (punto.provincia || '').replace(/'/g, "\\'");
    
    return `
      <div style="text-align: center; min-width: 220px;">
        <strong style="font-size: 14px;">${punto.nombre || 'Sin nombre'}</strong><br>
        <em style="color: #666;">${punto.categoria}</em><br>
        <small>${punto.provincia || 'Provincia no especificada'}</small><br>
        <small style="color: #888;">${punto.lat.toFixed(4)}, ${punto.lon.toFixed(4)}</small>
        

        <div style="margin-top: 12px; padding: 8px 0; border-top: 1px solid #eee;">
          <button 
            onclick="guardarFavorito(${punto.lat}, ${punto.lon}, '${nombreSeguro}', '${categoriaSegura}', '${provinciaSegura}')"
            style="background: #3880ff; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: bold; transition: background 0.3s; margin: 4px;"
            onmouseover="this.style.background='#2e6bd1'"
            onmouseout="this.style.background='#3880ff'"
          >
            💖 Guardar como favorito
          </button>

          <button 
            onclick="centrarEnPuntoPopup(${punto.lat}, ${punto.lon})"
            style="background: #10dc60; color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: bold; transition: background 0.3s; margin: 4px;"
            onmouseover="this.style.background='#0ec254'"
            onmouseout="this.style.background='#10dc60'"
          >
            📍 Centrar en mapa
          </button>
        </div>
      </div>
    `;
  }

    /**
   * @function guardarFavorito
   * @description Guarda un punto de interés como favorito
   * @param {number} lat - Latitud del punto
   * @param {number} lon - Longitud del punto
   * @param {string} nombre - Nombre del punto
   * @param {string} categoria - Categoría del punto
   * @param {string} provincia - Provincia del punto
   * @returns {Promise<void>}
   */
  async guardarFavorito(lat: number, lon: number, nombre: string, categoria: string, provincia: string) {
    const resultado = await this.meGustaService.guardarMeGusta({
      lat: lat,
      lng: lon, 
      nombre: nombre,
      categoria: categoria,
      provincia: provincia
    });
    if (resultado) {
      await this.mostrarConfirmacionFavorito(nombre, true);
    } else {
      await this.mostrarConfirmacionFavorito(nombre, false);
    }
  }
    /**
   * @function mostrarConfirmacionFavorito
   * @description Muestra confirmación de guardado de favorito
   * @param {string} nombrePunto - Nombre del punto
   * @param {boolean} exito - Indica si fue exitoso
   * @private
   * @returns {Promise<void>}
   */
  private async mostrarConfirmacionFavorito(nombrePunto: string, exito: boolean) {
    if (exito) {
      const alert = await this.alertController.create({
        header: '¡Agregado a Favoritos! 💖',
        message: `"${nombrePunto}" ha sido guardado en tus favoritos.`,
        buttons: ['OK']
      });
      await alert.present();
    } else {
      const alert = await this.alertController.create({
        header: 'Ya en Favoritos',
        message: `"${nombrePunto}" ya está en tu lista de favoritos.`,
        buttons: ['OK']
      });
      await alert.present();
    }
  }
  /**
   * @function ajustarVistaMapa
   * @description Ajusta la vista del mapa para mostrar todos los marcadores
   * @private
   */
  private ajustarVistaMapa() {
    if (this.markers.length === 0) return;

    try {
      if (this.markers.length === 1) {
        const punto = this.puntos[0];
        this.map.setView([punto.lat, punto.lon], 13);
      } else {
        const group = L.featureGroup(this.markers);
        this.map.fitBounds(group.getBounds().pad(0.1), {
          maxZoom: 15,
          animate: true,
          duration: 1
        });
      }
    } catch (error) {

    }
  }
  /**
   * @function limpiarMarcadores
   * @description Elimina todos los marcadores del mapa
   * @private
   */
  private limpiarMarcadores() {
    this.markers.forEach(marker => {
      if (this.map && this.map.hasLayer(marker)) {
        this.map.removeLayer(marker);
      }
    });
    this.markers = [];
  }

  /**
   * @function generarMensajeBusqueda
   * @description Genera el mensaje de búsqueda según los filtros aplicados
   * @param {FiltrosBusqueda} filtros - Filtros de búsqueda
   * @returns {string} Mensaje de búsqueda
   * @private
   */  
  private generarMensajeBusqueda(filtros: FiltrosBusqueda): string {
  if (filtros.paisaje) {
    if (filtros.paisaje === 'cerros_y_montañas') {
      return 'Buscando montañas y cerros en Argentina...';
    } else if (filtros.paisaje === 'rios_y_mar') {
      return 'Buscando ríos y mar en Argentina...';
    } else {
      return 'Buscando paisajes en Argentina...';
    }
  } else if (filtros.provincia && filtros.categoria) {
    const categoria = this.obtenerNombreCategoria(filtros.categoria);
    const provinciaFormateada = this.formatearProvincia(filtros.provincia);
    return `Buscando ${categoria} en ${provinciaFormateada}...`;
  } else if (filtros.provincia) {
    const provinciaFormateada = this.formatearProvincia(filtros.provincia);
    return `Buscando puntos en ${provinciaFormateada}...`;
  }
  return 'Buscando puntos de interés...';
}

  /**
   * @function generarMensajeError
   * @description Genera el mensaje de error según los filtros aplicados
   * @param {FiltrosBusqueda} filtros - Filtros de búsqueda
   * @returns {string} Mensaje de error
   * @private
   */  
  private generarMensajeError(filtros: FiltrosBusqueda): string {
    if (filtros.paisaje) {
      const paisaje = filtros.paisaje === 'montañas' ? 'montañas y cerros' : 'ríos y mar';
      return `No se encontraron resultados para ${paisaje}.`;
    } else if (filtros.provincia) {
      const provinciaFormateada = this.formatearProvincia(filtros.provincia);
      return `No se encontraron resultados en ${provinciaFormateada}.`;
    }
    return 'No se encontraron resultados.';
  }

  /**
   * @function formatearProvincia
   * @description Formatea el nombre de la provincia para mostrar
   * @param {string} provincia - Nombre de la provincia
   * @returns {string} Provincia formateada
   * @private
   */
  private formatearProvincia(provincia: string): string {
    return provincia
      .split('_')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
  }

  /**
   * @function obtenerNombreCategoria
   * @description Obtiene el nombre legible de la categoría
   * @param {string} categoria - Categoría
   * @returns {string} Nombre de la categoría
   * @private
   */
  private obtenerNombreCategoria(categoria: string): string {
    const nombres: { [key: string]: string } = {
      'naturaleza': 'naturaleza',
      'turismo': 'turismo', 
      'alojamiento': 'alojamiento',
      'montañas': 'montañas',
      'rios_mar': 'ríos y mar'
    };
    return nombres[categoria] || categoria;
  }

  /**
   * @function mostrarAlertaSinResultados
   * @description Muestra alerta cuando no se encuentran resultados
   * @private
   * @returns {Promise<void>}
   */
  private async mostrarAlertaSinResultados() {
    const alert = await this.alertController.create({
      header: 'Sin resultados',
      message: 'No se encontraron puntos de interés con los filtros seleccionados.',
      buttons: [
        {
          text: 'Aceptar',
          role: 'cancel'
        },
        {
          text: 'Volver a Filtros',
          handler: () => {
            this.router.navigate(['/inicio']);
          }
        }
      ]
    });
    await alert.present();
  }

  /**
   * @function mostrarError
   * @description Muestra alerta de error genérico
   * @param {any} error - Error ocurrido
   * @private
   * @returns {Promise<void>}
   */
  private async mostrarError(error: any) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'Ocurrió un error al buscar los puntos. Verifica tu conexión e intenta nuevamente.',
      buttons: ['Aceptar']
    });
    await alert.present();
  }

  /**
   * @function centrarEnPunto
   * @description Centra el mapa en un punto específico
   * @param {PuntoInteres} punto - Punto de interés
   * @private
   */
  private centrarEnPunto(punto: PuntoInteres) {
    if (this.map) {
      this.map.setView([punto.lat, punto.lon], 14, {
        animate: true,
        duration: 1
      });
    }
  }

  /**
   * @function volverAFiltros
   * @description Navega de vuelta a la página de filtros
   */
  volverAFiltros() {
    this.router.navigate(['/inicio'], {
      queryParams: {} // Limpiar parámetros
    });
  }

  /**
   * @function recargarBusqueda
   * @description Recarga la búsqueda con los filtros actuales
   */
  recargarBusqueda() {
    if (Object.keys(this.filtrosActuales).length > 0) {
      this.buscarConFiltros(this.filtrosActuales);
    }
  }

  /**
   * @function centrarMapa
   * @description Centra el mapa en la vista por defecto de Argentina
   */
  centrarMapa() {
    if (this.map) {
      this.map.setView([-34.6037, -58.3816], 5, {
        animate: true,
        duration: 1
      });
    }
  }

  /**
   * @function getResumenBusqueda
   * @description Genera un resumen de la búsqueda actual
   * @returns {string} Resumen de la búsqueda
   */
  getResumenBusqueda(): string {
    if (this.puntos.length === 0) return 'No hay resultados';
    
      if (this.filtrosActuales.paisaje) {

    if (this.filtrosActuales.paisaje === 'cerros_y_montañas') {
      return `${this.puntos.length} puntos de montañas y cerros encontrados`;
    } else if (this.filtrosActuales.paisaje === 'rios_y_mar') {
      return `${this.puntos.length} puntos de ríos y mar encontrados`;
    } else {
      return `${this.puntos.length} puntos de paisaje encontrados`;
    }
    } else if (this.filtrosActuales.provincia && this.filtrosActuales.categoria) {
      const categoria = this.obtenerNombreCategoria(this.filtrosActuales.categoria);
      const provincia = this.formatearProvincia(this.filtrosActuales.provincia);
      return `${this.puntos.length} ${categoria} en ${provincia}`;
    } else if (this.filtrosActuales.provincia) {
      const provincia = this.formatearProvincia(this.filtrosActuales.provincia);
      return `${this.puntos.length} puntos en ${provincia}`;
    }
    
    return `${this.puntos.length} puntos encontrados`;
  }

  /**
   * @function ngOnDestroy
   * @description Limpia recursos al destruir el componente
   */
  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    

    delete (window as any).centrarEnPuntoPopup;
    delete (window as any).guardarFavorito;
    delete (window as any).irAInicio;
    delete (window as any).irAFavoritos;
    delete (window as any).irAMiCuenta;
  }

  /**
   * @function centrarEnPuntoDesdePopup
   * @description Centra el mapa en un punto desde el popup
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @private
   */
  private centrarEnPuntoDesdePopup(lat: number, lon: number) {
    if (this.map) {
      this.map.setView([lat, lon], 14, {
        animate: true,
        duration: 1
      });
    }
  }
}
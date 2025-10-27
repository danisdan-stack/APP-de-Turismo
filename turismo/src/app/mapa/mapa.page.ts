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

  ngOnInit() {
    console.log('Página de mapa con Leaflet inicializada');
    
    // ✅ CONFIGURAR FUNCIONES GLOBALES PRIMERO
    (window as any).centrarEnPuntoPopup = (lat: number, lon: number) => {
      this.centrarEnPuntoDesdePopup(lat, lon);
    };
    
    (window as any).guardarFavorito = (lat: number, lon: number, nombre: string, categoria: string, provincia: string) => {
      this.guardarFavorito(lat, lon, nombre, categoria, provincia);
    };
    
    // ✅ NUEVAS FUNCIONES PARA NAVEGACIÓN DESDE POPUP
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
      console.log('Parámetros recibidos en mapa:', params);
      
      // ✅ DETECTAR SI VIENE DE FAVORITOS
      if (params['desdeFavoritos'] && params['lat'] && params['lng']) {
        console.log('📍 Viene de favoritos - mostrando punto específico');
        this.mostrarPuntoFavorito(params);
      } else {
        // Búsqueda normal con filtros
        const filtros: FiltrosBusqueda = {
          provincia: params['provincia'],
          categoria: params['categoria'],
          paisaje: params['paisaje']
        };

        if (filtros.provincia || filtros.paisaje) {
          this.filtrosActuales = filtros;
          this.buscarConFiltros(filtros);
        } else {
          console.log('No hay filtros - mostrando mapa vacío');
          this.puntos = [];
          this.limpiarMarcadores();
          if (this.map) {
            this.map.setView([-34.6037, -58.3816], 5);
          }
        }
      }
    });
  }

  // ✅ MÉTODO CORREGIDO - ESPERAR MAPA
  private mostrarPuntoFavorito(params: any) {
    const esperarMapa = setInterval(() => {
      if (this.map) {
        clearInterval(esperarMapa);
        this.mostrarPuntoFavoritoEnMapa(params);
      }
    }, 100);
  }

  // ✅ NUEVO MÉTODO SEPARADO PARA MOSTRAR EN MAPA
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

    console.log('📍 Mostrando punto favorito:', puntoFavorito);

    // Limpiar marcadores anteriores
    this.limpiarMarcadores();
    
    // Crear solo el marcador del favorito
    if (puntoFavorito.lat && puntoFavorito.lon) {
      const marcador = L.marker([puntoFavorito.lat, puntoFavorito.lon])
        .addTo(this.map)
        .bindPopup(this.crearPopupContentFavorito(puntoFavorito))
        .openPopup();

      this.markers.push(marcador);
      
      // Centrar el mapa en el punto favorito
      this.map.setView([puntoFavorito.lat, puntoFavorito.lon], 14);
      
      console.log('✅ Punto favorito mostrado y centrado en el mapa');
    } else {
      console.error('❌ Coordenadas inválidas para punto favorito');
    }
  }

  // ✅ NUEVO MÉTODO PARA POPUP DE FAVORITOS
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
        
        <!-- ✅ BOTONES DE NAVEGACIÓN -->
        <div style="margin-top: 12px; padding: 8px 0; border-top: 1px solid #eee; display: flex; justify-content: space-between; gap: 4px;">
          <button onclick="irAInicio()" style="background: #3880ff; color: white; border: none; padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 10px; font-weight: bold; flex: 1;">🏠 Inicio</button>
          <button onclick="irAFavoritos()" style="background: #ff4081; color: white; border: none; padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 10px; font-weight: bold; flex: 1;">💖 Favoritos</button>
          <button onclick="irAMiCuenta()" style="background: #10dc60; color: white; border: none; padding: 6px 12px; border-radius: 15px; cursor: pointer; font-size: 10px; font-weight: bold; flex: 1;">👤 Mi Cuenta</button>
        </div>
      </div>
    `;
  }

  private configurarIconosLeaflet() {
    const iconDefault = L.Icon.Default.prototype as any;
    delete iconDefault._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
    
    console.log('✅ Iconos de Leaflet configurados');
  }

  private inicializarMapa() {
    if (!this.mapContainer?.nativeElement) {
      console.error('Contenedor del mapa no encontrado');
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

      console.log('✅ Mapa Leaflet inicializado correctamente');

      // ✅ MOSTRAR UBICACIÓN DEL USUARIO SOLO SI ESTÁ HABILITADO
      setTimeout(() => {
        this.mostrarUbicacionUsuario();
      }, 2000);

    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }
  }

  // ✅ MÉTODO CORREGIDO: MOSTRAR UBICACIÓN DEL USUARIO
  private async mostrarUbicacionUsuario() {
    try {
      // ✅ VERIFICAR SI EL GPS ESTÁ HABILITADO
      if (!this.localizacion.estaGPSHabilitado()) {
        console.log('📍 GPS deshabilitado por el usuario - no se muestra ubicación');
        return;
      }

      console.log('📍 Obteniendo ubicación del usuario...');
      
      const ubicacion = await this.localizacion.getCurrentPosition();
      
      // ✅ VERIFICAR SI SE OBTUVO LA UBICACIÓN
      if (!ubicacion) {
        console.log('📍 No se pudo obtener la ubicación');
        return;
      }
      
      // Eliminar marcador anterior si existe
      if (this.userMarker) {
        this.map.removeLayer(this.userMarker);
      }

      // Crear icono personalizado para el usuario
      const userIcon = this.crearIconoUsuario();
      
      // Crear marcador del usuario
      this.userMarker = L.marker([ubicacion.lat, ubicacion.lng], {
        icon: userIcon,
        zIndexOffset: 1000
      })
      .addTo(this.map)
      .bindPopup('📍 ¡Estás aquí!')
      .openPopup();

      console.log('📍 Ubicación del usuario mostrada:', ubicacion);

    } catch (error: any) {
      console.error('❌ Error obteniendo ubicación:', error);
      // No mostrar alerta para no interrumpir la experiencia
    }
  }

  // ✅ MÉTODO: CREAR ICONO PERSONALIZADO PARA EL USUARIO
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

  // ✅ MÉTODO CORREGIDO: CENTRAR EN UBICACIÓN DEL USUARIO
  async centrarEnMiUbicacion() {
    try {
      // ✅ VERIFICAR SI EL GPS ESTÁ HABILITADO
      if (!this.localizacion.estaGPSHabilitado()) {
        await this.mostrarAlertaGPSDeshabilitado();
        return;
      }

      const ubicacion = await this.localizacion.getCurrentPosition();
      
      // ✅ VERIFICAR SI SE OBTUVO LA UBICACIÓN
      if (!ubicacion) {
        throw new Error('No se pudo obtener la ubicación');
      }
      
      this.map.setView([ubicacion.lat, ubicacion.lng], 15, {
        animate: true,
        duration: 1
      });

      // Asegurarse de que el marcador del usuario esté visible
      if (this.userMarker) {
        this.userMarker.openPopup();
      } else {
        this.mostrarUbicacionUsuario();
      }

      console.log('🎯 Mapa centrado en tu ubicación');

    } catch (error: any) {
      console.error('Error al centrar en ubicación:', error);
      this.mostrarErrorUbicacion(error);
    }
  }

  // ✅ NUEVO MÉTODO: ALERTA CUANDO EL GPS ESTÁ DESHABILITADO
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

  // ✅ NUEVO MÉTODO: MANEJO DE ERRORES DE UBICACIÓN
  private async mostrarErrorUbicacion(error: any) {
    const alert = await this.alertController.create({
      header: 'Error de Ubicación',
      message: `No se pudo obtener tu ubicación: ${error.message}. Asegúrate de permitir el acceso a la ubicación en tu dispositivo.`,
      buttons: ['OK']
    });
    await alert.present();
  }

  // ✅ MÉTODO showAlert QUE FALTABA
  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  // ... (el resto de tus métodos se mantienen igual)

  private async buscarConFiltros(filtros: FiltrosBusqueda) {
    console.log('Buscando con filtros:', filtros);
    
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
          console.log(`✅ ${puntos.length} puntos encontrados`);
          this.puntos = puntos;
          this.actualizarMapaConPuntos(puntos);
          loading.dismiss();
          this.cargando = false;
        },
        error: (err) => {
          console.error('❌ Error al buscar puntos:', err);
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

  private actualizarMapaConPuntos(puntos: PuntoInteres[]) {
    console.log('🔍 Actualizando mapa con puntos:', puntos.length);
    
    this.limpiarMarcadores();

    if (puntos.length === 0) {
      this.mostrarAlertaSinResultados();
      return;
    }

    puntos.forEach(punto => {
      if (punto.lat && punto.lon) {
        console.log('📍 Creando marcador en:', punto.lat, punto.lon, punto.nombre);
        
        const marcador = L.marker([punto.lat, punto.lon])
          .addTo(this.map)
          .bindPopup(this.crearPopupContent(punto));

        this.markers.push(marcador);
      }
    });

    console.log('📌 Total de marcadores creados:', this.markers.length);

    if (this.markers.length > 0) {
      setTimeout(() => {
        this.map.invalidateSize();
        this.ajustarVistaMapa();
      }, 100);
    }
  }

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
        
        <!-- ✅ BOTÓN PARA GUARDAR FAVORITO -->
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

  async guardarFavorito(lat: number, lon: number, nombre: string, categoria: string, provincia: string) {
    console.log('💾 Intentando guardar en Firestore...');
    
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
      console.error('Error al ajustar vista del mapa:', error);
    }
  }

  private limpiarMarcadores() {
    this.markers.forEach(marker => {
      if (this.map && this.map.hasLayer(marker)) {
        this.map.removeLayer(marker);
      }
    });
    this.markers = [];
  }

  private generarMensajeBusqueda(filtros: FiltrosBusqueda): string {
    if (filtros.paisaje) {
      const paisaje = filtros.paisaje === 'montañas' ? 'montañas y cerros' : 'ríos y mar';
      return `Buscando ${paisaje} en Argentina...`;
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

  private formatearProvincia(provincia: string): string {
    return provincia
      .split('_')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');
  }

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

  private async mostrarError(error: any) {
    console.error('Error en mapa:', error);
    
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'Ocurrió un error al buscar los puntos. Verifica tu conexión e intenta nuevamente.',
      buttons: ['Aceptar']
    });
    await alert.present();
  }

  private centrarEnPunto(punto: PuntoInteres) {
    if (this.map) {
      this.map.setView([punto.lat, punto.lon], 14, {
        animate: true,
        duration: 1
      });
    }
  }

  volverAFiltros() {
    this.router.navigate(['/inicio'], {
      queryParams: {} // Limpiar parámetros
    });
  }

  recargarBusqueda() {
    if (Object.keys(this.filtrosActuales).length > 0) {
      this.buscarConFiltros(this.filtrosActuales);
    }
  }

  centrarMapa() {
    if (this.map) {
      this.map.setView([-34.6037, -58.3816], 5, {
        animate: true,
        duration: 1
      });
    }
  }

  getResumenBusqueda(): string {
    if (this.puntos.length === 0) return 'No hay resultados';
    
    if (this.filtrosActuales.paisaje) {
      const paisaje = this.filtrosActuales.paisaje === 'montañas' ? 'montañas y cerros' : 'ríos y mar';
      return `${this.puntos.length} puntos de ${paisaje} encontrados`;
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

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
    
    // ✅ LIMPIAR FUNCIONES GLOBALES
    delete (window as any).centrarEnPuntoPopup;
    delete (window as any).guardarFavorito;
    delete (window as any).irAInicio;
    delete (window as any).irAFavoritos;
    delete (window as any).irAMiCuenta;
  }

  private centrarEnPuntoDesdePopup(lat: number, lon: number) {
    console.log('📍 Centrando en punto desde popup:', lat, lon);
    
    if (this.map) {
      this.map.setView([lat, lon], 14, {
        animate: true,
        duration: 1
      });
    }
  }
}
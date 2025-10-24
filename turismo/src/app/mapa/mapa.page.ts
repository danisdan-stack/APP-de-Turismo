import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, AlertController } from '@ionic/angular';
import { OverpassService, PuntoInteres, FiltrosBusqueda } from '../components/services/overpass.service';

// ✅ Leaflet directo
import * as L from 'leaflet';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
  standalone: false,
})
export class MapaPage implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  // Estado de la aplicación
  puntos: PuntoInteres[] = [];
  cargando: boolean = false;
  error: string = '';
  filtrosActuales: FiltrosBusqueda = {};

  // Variables de Leaflet directo
  private map!: L.Map;
  private markers: L.Marker[] = [];

  constructor(
    private overpassService: OverpassService,
    private loadingController: LoadingController,
    private alertController: AlertController,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    console.log('Página de mapa con Leaflet inicializada');
    
    // ✅ PASO 1: Exponer la función para el popup
    (window as any).guardarFavorito = (lat: number, lon: number, nombre: string, categoria: string, provincia: string) => {
      this.guardarFavorito(lat, lon, nombre, categoria, provincia);
    };
     (window as any).centrarEnPuntoPopup = (lat: number, lon: number) => {
    if (this.map) {
      this.map.setView([lat, lon], 14, {
        animate: true,
        duration: 1
      });
     
    }
  };
    
    // ✅ SOLUCIÓN: Configurar iconos antes de inicializar
    this.configurarIconosLeaflet();
    
    // Inicializar mapa después de que la vista esté lista
    setTimeout(() => {
      this.inicializarMapa();
    }, 100);
    
    this.route.queryParams.subscribe(params => {
      console.log('Parámetros recibidos en mapa:', params);
      
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
        // Centrar mapa en Argentina si no hay filtros
        if (this.map) {
          this.map.setView([-34.6037, -58.3816], 5);
        }
      }
    });
  }

  // ✅ MÉTODO NUEVO - Configurar iconos de Leaflet
  private configurarIconosLeaflet() {
    // Fix para los iconos de Leaflet
    const iconDefault = L.Icon.Default.prototype as any;
    delete iconDefault._getIconUrl;
    
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
    
    console.log('✅ Iconos de Leaflet configurados');
  }

  // === INICIALIZAR MAPA LEAFLET ===
  private inicializarMapa() {
    // Verificar que el contenedor existe
    if (!this.mapContainer?.nativeElement) {
      console.error('Contenedor del mapa no encontrado');
      return;
    }

    try {
      this.map = L.map(this.mapContainer.nativeElement).setView([-34.6037, -58.3816], 5);

      // ✅ Asegurar que el mapa se redimensione correctamente
      setTimeout(() => {
        this.map.invalidateSize();
      }, 300);

      // Capa base OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
      }).addTo(this.map);

      console.log('✅ Mapa Leaflet inicializado correctamente');
    } catch (error) {
      console.error('Error al inicializar el mapa:', error);
    }
  }

  // === BUSCAR CON FILTROS ===
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

  // === ACTUALIZAR MAPA CON PUNTOS (LEAFLET DIRECTO) ===
  private actualizarMapaConPuntos(puntos: PuntoInteres[]) {
    console.log('🔍 Actualizando mapa con puntos:', puntos.length);
    
    // Limpiar marcadores anteriores
    this.limpiarMarcadores();

    if (puntos.length === 0) {
      this.mostrarAlertaSinResultados();
      return;
    }

    // Crear marcadores Leaflet directo
    puntos.forEach(punto => {
      if (punto.lat && punto.lon) {
        console.log('📍 Creando marcador en:', punto.lat, punto.lon, punto.nombre);
        
        const marcador = L.marker([punto.lat, punto.lon])
          .addTo(this.map)
          .bindPopup(this.crearPopupContent(punto))
          .on('click', () => {
            
          });

        this.markers.push(marcador);
      }
    });

    console.log('📌 Total de marcadores creados:', this.markers.length);

    // Ajustar vista del mapa para mostrar todos los marcadores
    if (this.markers.length > 0) {
      // ✅ Forzar redimensionamiento del mapa
      setTimeout(() => {
        this.map.invalidateSize();
        this.ajustarVistaMapa();
      }, 100);
    }
  }

  // === CREAR CONTENIDO DEL POPUP ===
  private crearPopupContent(punto: PuntoInteres): string {
   


    // ✅ Escapar comillas en el nombre para evitar errores
    const nombreSeguro = (punto.nombre || 'Sin nombre').replace(/'/g, "\\'");
    
    return `
      <div style="text-align: center; min-width: 220px;">
        <strong style="font-size: 14px;">${punto.nombre || 'Sin nombre'}</strong><br>
        <em style="color: #666;">${punto.categoria}</em><br>
        <small>${punto.provincia || 'Provincia no especificada'}</small><br>
        <small style="color: #888;">${punto.lat.toFixed(4)}, ${punto.lon.toFixed(4)}</small>
        
        <!-- ✅ BOTÓN PARA GUARDAR FAVORITO -->
        <div style="margin-top: 12px; padding: 8px 0; border-top: 1px solid #eee;">
          <button 
            onclick="guardarFavorito(${punto.lat}, ${punto.lon}, '${nombreSeguro}', '${punto.categoria}', '${punto.provincia}')"
            style="
              background: #3880ff; 
              color: white; 
              border: none; 
              padding: 8px 16px; 
              border-radius: 20px; 
              cursor: pointer; 
              font-size: 12px;
              font-weight: bold;
              transition: background 0.3s;
            "
            onmouseover="this.style.background='#2e6bd1'"
            onmouseout="this.style.background='#3880ff'"
            
          >
            💖 Guardar como favorito
          </button>

           <button 
            onclick="centrarEnPuntoPopup(${punto.lat}, ${punto.lon})"
            style="
              background: #10dc60; 
              color: white; 
              border: none; 
              padding: 8px 16px; 
              border-radius: 20px; 
              cursor: pointer; 
              font-size: 12px;
              font-weight: bold;
              transition: background 0.3s;
              margin: 4px;
            "
            onmouseover="this.style.background='#0ec254'"
            onmouseout="this.style.background='#10dc60'"
          >
            📍 Centrar en mapa
          </button>
        </div>
      </div>
    `;
  }

  // === GUARDAR PUNTO FAVORITO (SIN LÓGICA POR AHORA) ===
  guardarFavorito(lat: number, lon: number, nombre: string, categoria: string, provincia: string) {
    console.log('🔔 BOTÓN CLICKEADO - Datos recibidos:');
    console.log('📍 Latitud:', lat);
    console.log('📍 Longitud:', lon);
    console.log('🏷️ Nombre:', nombre);
    console.log('📂 Categoría:', categoria);
    console.log('🗺️ Provincia:', provincia);
    
    // ✅ Por ahora solo mostramos un alerta de prueba
    this.mostrarConfirmacionFavorito(nombre);
  }

  // === MOSTRAR CONFIRMACIÓN ===
  private async mostrarConfirmacionFavorito(nombrePunto: string) {
    const alert = await this.alertController.create({
      header: '¡Funciona! 🎉',
      message: `Botón clickeado para: "${nombrePunto}"<br><br>✅ El botón es cliqueable<br>✅ Recibe los datos correctamente`,
      buttons: ['OK']
    });
    await alert.present();
  }

  // === AJUSTAR VISTA DEL MAPA ===
  private ajustarVistaMapa() {
    if (this.markers.length === 0) return;

    try {
      if (this.markers.length === 1) {
        // Centrar en el único punto
        const punto = this.puntos[0];
        this.map.setView([punto.lat, punto.lon], 13);
      } else {
        // Ajustar para mostrar todos los marcadores
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

  // === LIMPIAR MARCADORES ===
  private limpiarMarcadores() {
    this.markers.forEach(marker => {
      if (this.map && this.map.hasLayer(marker)) {
        this.map.removeLayer(marker);
      }
    });
    this.markers = [];
  }

  // === MÉTODOS AUXILIARES ===
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
            this.router.navigate(['/filtros']);
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

  

  // === MÉTODOS PÚBLICOS ===
  volverAFiltros() {
    this.router.navigate(['/filtros'], {
      queryParams: this.filtrosActuales
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
  }
}
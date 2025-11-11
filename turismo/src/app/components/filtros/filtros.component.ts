import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router'; 

export interface FiltrosSeleccionados {
  provincia?: string;
  categoria?: string;
  paisaje?: string;
}

@Component({
  selector: 'app-filtros',
  templateUrl: './filtros.component.html',
  styleUrls: ['./filtros.component.scss'],
  standalone: false
})
/**
 * @class FiltrosComponent
 * @description Componente para gestionar y aplicar filtros de búsqueda
 */
export class FiltrosComponent implements OnInit {
   @Output() filtrosAplicados = new EventEmitter<FiltrosSeleccionados>();
 
  modoSeleccion: 'normal' | 'paisaje' = 'normal';
  filtroActivo: string = '';
  
  selecciones: FiltrosSeleccionados = {};

  provincias = [
    'Ciudad de Buenos Aires','Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 
    'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 
    'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 
    'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 
    'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
  ];

  categorias = [
    { id: 'naturaleza', nombre: 'Naturaleza', icon: 'leaf' },
    { id: 'turismo', nombre: 'Turismo', icon: 'airplane' },
    { id: 'alojamiento', nombre: 'Alojamiento', icon: 'bed' }
  ];

paisajes = [
  { id: 'cerros_y_montañas', nombre: 'Montañas y Cerros', icon: 'terrain' },
  { id: 'rios_y_mar', nombre: 'Ríos y Mar', icon: 'water' }
];

  constructor(private router: Router) { } 
 
  /**
   * @function ngOnInit
   * @description Método del ciclo de vida de Angular - Se ejecuta al inicializar el componente
   */
  ngOnInit() {}

   /**
   * @function alternarFiltro
   * @description Activa o desactiva un tipo de filtro específico en la interfaz
   * @param {string} tipoFiltro - Tipo de filtro a alternar
   */
  alternarFiltro(tipoFiltro: string) {
    this.filtroActivo = this.filtroActivo === tipoFiltro ? '' : tipoFiltro;
  }
 /**
   * @function seleccionarProvincia
   * @description Establece la provincia seleccionada y limpia el filtro activo
   * @param {string} provincia - Nombre de la provincia seleccionada
   */
  seleccionarProvincia(provincia: string) {
    this.selecciones.provincia = provincia;
    this.filtroActivo = '';
  }
/**
   * @function seleccionarCategoria
   * @description Establece la categoría seleccionada, resetea paisaje y cambia a modo normal
   * @param {string} categoria - ID de la categoría seleccionada
   */
  seleccionarCategoria(categoria: string) {
    this.selecciones.categoria = categoria;
    this.selecciones.paisaje = undefined; 
    this.modoSeleccion = 'normal';
    this.filtroActivo = '';
  }
 /**
   * @function seleccionarPaisaje
   * @description Establece el paisaje seleccionado, resetea provincia/categoría y cambia a modo paisaje
   * @param {string} paisaje - ID del paisaje seleccionado
   */
  seleccionarPaisaje(paisaje: string) {
    this.selecciones.paisaje = paisaje;
    this.selecciones.provincia = undefined;
    this.selecciones.categoria = undefined; 
    this.modoSeleccion = 'paisaje';
    this.filtroActivo = '';
  }
 /**
   * @function buscar
   * @description Emite los filtros aplicados y navega al mapa 
   */
  buscar() {
    if (this.isBuscarHabilitado()) {

      
      this.filtrosAplicados.emit(this.selecciones);
    }
  }
 /**
   * @function limpiarFiltros
   * @description Limpia todas las selecciones y restablece el estado inicial
   */
  limpiarFiltros() {
    this.selecciones = {};
    this.modoSeleccion = 'normal';
    this.filtroActivo = '';
  }


  /**
   * @function getProvinciaSeleccionada
   * @description Obtiene el nombre de la provincia seleccionada o texto por defecto
   * @returns {string} Nombre de provincia o texto por defecto
   */
  getProvinciaSeleccionada(): string {
    return this.selecciones.provincia || 'Seleccionar Provincia';
  }

  /**
   * @function getCategoriaSeleccionada
   * @description Obtiene el nombre de la categoría seleccionada o texto por defecto
   * @returns {string} Nombre de categoría o texto por defecto
   */
  getCategoriaSeleccionada(): string {
    const categoria = this.categorias.find(c => c.id === this.selecciones.categoria);
    return categoria ? categoria.nombre : 'Seleccionar Filtros';
  }
 /**
   * @function getPaisajeSeleccionado
   * @description Obtiene el nombre del paisaje seleccionado o texto por defecto
   * @returns {string} Nombre de paisaje o texto por defecto
   */
  getPaisajeSeleccionado(): string {
    const paisaje = this.paisajes.find(p => p.id === this.selecciones.paisaje);
    return paisaje ? paisaje.nombre : 'Turismo por Paisaje';
  }

   /**
   * @function isBuscarHabilitado
   * @description Valida si el botón de búsqueda debe estar habilitado
   * @returns {boolean} True si hay paisaje seleccionado O (provincia Y categoría)
   */
  isBuscarHabilitado(): boolean {
    // Habilitar si:
    // 1. Tiene paisaje seleccionado (modo independiente)
    // 2. O tiene provincia Y categoría seleccionados (modo normal)
    return this.isPaisajeSeleccionado() || 
           (this.isProvinciaSeleccionada() && this.isCategoriaSeleccionada());
  }
 /**
   * @function isProvinciaSeleccionada
   * @description Verifica si hay una provincia seleccionada
   * @returns {boolean} True si hay provincia seleccionada
   */
  isProvinciaSeleccionada(): boolean {
    return !!this.selecciones.provincia;
  }
/**
   * @function isCategoriaSeleccionada
   * @description Verifica si hay una categoría seleccionada
   * @returns {boolean} True si hay categoría seleccionada
   */
  isCategoriaSeleccionada(): boolean {
    return !!this.selecciones.categoria;
  }
  /**
   * @function isPaisajeSeleccionado
   * @description Verifica si hay un paisaje seleccionado
   * @returns {boolean} True si hay paisaje seleccionado
   */
  isPaisajeSeleccionado(): boolean {
    return !!this.selecciones.paisaje;
  }

/**
   * @function isModoPaisaje
   * @description Verifica si el componente está en modo "Turismo por Paisaje"
   * @returns {boolean} True si está en modo paisaje
   */
  isModoPaisaje(): boolean {
    return this.modoSeleccion === 'paisaje';
  }

  /**
   * @function isModoNormal
   * @description Verifica si el componente está en modo "Categorías"
   * @returns {boolean} True si está en modo normal
   */
  isModoNormal(): boolean {
    return this.modoSeleccion === 'normal';
  }

  /**
   * @function getEstadoBusqueda
   * @description Genera un texto descriptivo del estado actual de búsqueda
   * @returns {string} Descripción del estado de búsqueda
   */
  getEstadoBusqueda(): string {
    if (this.isPaisajeSeleccionado()) {
      return 'Búsqueda por paisaje: ' + this.getPaisajeSeleccionado();
    } else if (this.isProvinciaSeleccionada() && this.isCategoriaSeleccionada()) {
      return 'Búsqueda en ' + this.getProvinciaSeleccionada() + ' - ' + this.getCategoriaSeleccionada();
    } else {
      return 'Seleccione criterios de búsqueda';
    }
  }
   /**
   * @function getIconoCategoriaSeleccionada
   * @description Obtiene el icono correspondiente a la categoría seleccionada
   * @returns {string} Nombre del icono o 'options' por defecto
   */
  getIconoCategoriaSeleccionada(): string {
    if (!this.selecciones.categoria) {
      return 'options'; 
    }
    
    const categoriaEncontrada = this.categorias.find(
      cat => cat.id === this.selecciones.categoria
    );
    
    return categoriaEncontrada ? categoriaEncontrada.icon : 'options';
  }
}
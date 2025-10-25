import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router'; // ← AGREGAR ESTE IMPORT

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
export class FiltrosComponent implements OnInit {
   @Output() filtrosAplicados = new EventEmitter<FiltrosSeleccionados>();
  // Estados de la UI
  modoSeleccion: 'normal' | 'paisaje' = 'normal';
  filtroActivo: string = '';
  
  // Selecciones del usuario
  selecciones: FiltrosSeleccionados = {};

  // Opciones disponibles
  provincias = [
    'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 
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
    { id: 'montañas', nombre: 'Montañas y Cerros', icon: 'terrain' },
    { id: 'agua', nombre: 'Ríos y Mar', icon: 'water' }
  ];

  constructor(private router: Router) { } // ← AGREGAR Router AL CONSTRUCTOR

  ngOnInit() {}

  // Métodos para controlar el flujo
  alternarFiltro(tipoFiltro: string) {
    this.filtroActivo = this.filtroActivo === tipoFiltro ? '' : tipoFiltro;
  }

  seleccionarProvincia(provincia: string) {
    this.selecciones.provincia = provincia;
    this.filtroActivo = '';
  }

  seleccionarCategoria(categoria: string) {
    this.selecciones.categoria = categoria;
    this.selecciones.paisaje = undefined; // Resetear paisaje
    this.modoSeleccion = 'normal';
    this.filtroActivo = '';
  }

  seleccionarPaisaje(paisaje: string) {
    this.selecciones.paisaje = paisaje;
    this.selecciones.provincia = undefined; // No requiere provincia
    this.selecciones.categoria = undefined; // Resetear categoría
    this.modoSeleccion = 'paisaje';
    this.filtroActivo = '';
  }

  buscar() {
    if (this.isBuscarHabilitado()) {
      console.log('Navegando al mapa con filtros:', this.selecciones);
      
      this.filtrosAplicados.emit(this.selecciones);
    }
  }

  limpiarFiltros() {
    this.selecciones = {};
    this.modoSeleccion = 'normal';
    this.filtroActivo = '';
  }

  // Métodos auxiliares para la UI
  getProvinciaSeleccionada(): string {
    return this.selecciones.provincia || 'Seleccionar Provincia';
  }

  getCategoriaSeleccionada(): string {
    const categoria = this.categorias.find(c => c.id === this.selecciones.categoria);
    return categoria ? categoria.nombre : 'Seleccionar Filtros';
  }

  getPaisajeSeleccionado(): string {
    const paisaje = this.paisajes.find(p => p.id === this.selecciones.paisaje);
    return paisaje ? paisaje.nombre : 'Turismo por Paisaje';
  }

  // Validaciones para habilitar/deshabilitar botones
  isBuscarHabilitado(): boolean {
    // Habilitar si:
    // 1. Tiene paisaje seleccionado (modo independiente)
    // 2. O tiene provincia Y categoría seleccionados (modo normal)
    return this.isPaisajeSeleccionado() || 
           (this.isProvinciaSeleccionada() && this.isCategoriaSeleccionada());
  }

  isProvinciaSeleccionada(): boolean {
    return !!this.selecciones.provincia;
  }

  isCategoriaSeleccionada(): boolean {
    return !!this.selecciones.categoria;
  }

  isPaisajeSeleccionado(): boolean {
    return !!this.selecciones.paisaje;
  }

  // Verificar si está en modo "Turismo por Paisaje"
  isModoPaisaje(): boolean {
    return this.modoSeleccion === 'paisaje';
  }

  // Verificar si está en modo "Categorías"
  isModoNormal(): boolean {
    return this.modoSeleccion === 'normal';
  }

  // Para mostrar estado actual
  getEstadoBusqueda(): string {
    if (this.isPaisajeSeleccionado()) {
      return 'Búsqueda por paisaje: ' + this.getPaisajeSeleccionado();
    } else if (this.isProvinciaSeleccionada() && this.isCategoriaSeleccionada()) {
      return 'Búsqueda en ' + this.getProvinciaSeleccionada() + ' - ' + this.getCategoriaSeleccionada();
    } else {
      return 'Seleccione criterios de búsqueda';
    }
  }
    // === AGREGAR ESTE NUEVO MÉTODO ===
  getIconoCategoriaSeleccionada(): string {
    if (!this.selecciones.categoria) {
      return 'options'; // Icono por defecto
    }
    
    const categoriaEncontrada = this.categorias.find(
      cat => cat.id === this.selecciones.categoria
    );
    
    return categoriaEncontrada ? categoriaEncontrada.icon : 'options';
  }
}
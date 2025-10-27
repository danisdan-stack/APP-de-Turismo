import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of, map, catchError } from 'rxjs';
import { PROVINCIAS, CATEGORIAS_OVERPASS, PAISAJES_OVERPASS, OVERPASS_CONFIG, TIPOS_ELEMENTOS } from '../constants/overpass.constants';
export interface PuntoInteres {
  id: number;
  tipo: string;
  nombre: string;
  categoria: string;
  lat: number;
  lon: number;
  tags?: any;
  provincia?: string;
}

export interface FiltrosBusqueda {
  provincia?: string;
  categoria?: string;
  paisaje?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OverpassService {

  constructor(private http: HttpClient) { }

  // ====== Obtener código ISO de la provincia ======
  private obtenerCodigoProvincia(nombre: string): string | undefined {
    const provincia = PROVINCIAS.find(p => 
      p.nombre.toLowerCase() === nombre.toLowerCase()
    );
    return provincia?.iso;
  }

  // ====== Construir query para categorías ======
  private construirQueryCategoria(codigoISO: string, categoria: string): string {
    const config = CATEGORIAS_OVERPASS[categoria as keyof typeof CATEGORIAS_OVERPASS];
    if (!config) return '';

    const queries = config.tags.map(tag => 
      TIPOS_ELEMENTOS.map(tipo => 
        `${tipo}(area.a)["${tag}"];`
      ).join('\n')
    ).join('\n');

    return queries;
  }

  // ====== Construir query para paisajes ======
  private construirQueryPaisaje(codigoISO: string, paisaje: string): string {
    const config = PAISAJES_OVERPASS[paisaje as keyof typeof PAISAJES_OVERPASS];
    if (!config) return '';

    const queries = config.tags.map(tag => 
      TIPOS_ELEMENTOS.map(tipo => 
        `${tipo}(area.a)["${tag}"];`
      ).join('\n')
    ).join('\n');

    return queries;
  }

  // ====== Generar query completa para Overpass ======
  private construirQueryOverpass(codigoISO: string, filtros: FiltrosBusqueda): string {
    let partes: string[] = [];

    // Query para categorías (modo normal)
    if (filtros.categoria) {
      const queryCategoria = this.construirQueryCategoria(codigoISO, filtros.categoria);
      if (queryCategoria) {
        partes.push(queryCategoria);
      }
    }

    // Query para paisajes (modo independiente)
    if (filtros.paisaje) {
      const queryPaisaje = this.construirQueryPaisaje(codigoISO, filtros.paisaje);
      if (queryPaisaje) {
        partes.push(queryPaisaje);
      }
    }

    // Si no hay partes válidas, retornar query vacía
    if (partes.length === 0) {
      return '';
    }

    // Query completa
    const query = `
      [out:json][timeout:${OVERPASS_CONFIG.timeout}];
      area["ISO3166-2"="${codigoISO}"]->.a;
      (
        ${partes.join('\n')}
      );
      out center ${OVERPASS_CONFIG.maxElements};
    `;

    console.log('Query Overpass generada:', query);
    return query;
  }

  // ====== Procesar elementos de Overpass ======
  private procesarElementos(elementos: any[], filtros: FiltrosBusqueda): PuntoInteres[] {
    return elementos
      .filter(el => el.lat && el.lon) // Solo elementos con coordenadas
      .map(el => {
        // Determinar categoría principal
        let categoriaPrincipal = 'otro';
        
        if (filtros.categoria) {
          categoriaPrincipal = filtros.categoria;
        } else if (filtros.paisaje) {
          categoriaPrincipal = filtros.paisaje;
        } else {
          // Intentar detectar categoría desde tags
          if (el.tags?.tourism) categoriaPrincipal = 'turismo';
          else if (el.tags?.natural) categoriaPrincipal = 'naturaleza';
          else if (el.tags?.amenity) categoriaPrincipal = 'alojamiento';
        }

        return {
          id: el.id,
          tipo: el.type,
          nombre: el.tags?.name || this.generarNombreDesdeTags(el.tags) || 'Sin nombre',
          categoria: categoriaPrincipal,
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          tags: el.tags,
          provincia: filtros.provincia
        };
      })
      .filter(punto => punto.nombre !== 'Sin nombre'); // Filtrar puntos sin nombre
  }

  // ====== Generar nombre desde tags cuando no hay name ======
  private generarNombreDesdeTags(tags: any): string {
    if (tags?.tourism) {
      return `${tags.tourism} ${tags.name || ''}`.trim();
    }
    if (tags?.natural) {
      return `${tags.natural} natural`.trim();
    }
    if (tags?.amenity) {
      return `${tags.amenity} ${tags.name || ''}`.trim();
    }
    return '';
  }

// ====== Método principal para buscar puntos ======
buscarPuntos(filtros: FiltrosBusqueda): Observable<PuntoInteres[]> {
  return new Observable(observer => {
    // Validar filtros
    if (!filtros.provincia && !filtros.paisaje) {
      observer.error('Se requiere al menos provincia o paisaje');
      return;
    }

    if (filtros.provincia) {
      // 🔹 MODO NORMAL: Búsqueda por provincia específica
      const codigo = this.obtenerCodigoProvincia(filtros.provincia);
      if (!codigo) {
        observer.error(`Provincia no válida: ${filtros.provincia}`);
        return;
      }

      const query = this.construirQueryOverpass(codigo, filtros);
      
      if (!query) {
        observer.error('No se pudo generar la query para los filtros seleccionados');
        return;
      }

      this.llamarOverpass(query).subscribe({
        next: (elementos) => {
          const puntos = this.procesarElementos(elementos, filtros);
          console.log(`✅ ${puntos.length} puntos encontrados en ${filtros.provincia}`);
          observer.next(puntos);
          observer.complete();
        },
        error: (error) => {
          console.error('❌ Error en Overpass:', error);
          observer.error(error);
        }
      });

    } else {
      // 🔹 MODO PAISAJE: Búsqueda en TODA ARGENTINA
      console.log('🔍 Buscando paisaje en toda Argentina...');
      
      const provincias = PROVINCIAS.map(p => p.iso);
      console.log('📍 Provincias a buscar:', provincias.length);

      // Array para almacenar todas las búsquedas
      const todasLasBusquedas: Observable<PuntoInteres[]>[] = [];

      // Crear una búsqueda para cada provincia
      provincias.forEach(provinciaISO => {
        const query = this.construirQueryOverpass(provinciaISO, filtros);
        
        if (query) {
          const busqueda = this.llamarOverpass(query).pipe(
            map(elementos => this.procesarElementos(elementos, filtros)),
            catchError(error => {
              console.warn(`⚠️ Provincia ${provinciaISO}: error -`, error.message);
              return of([]); // Retornar array vacío si hay error
            })
          );
          todasLasBusquedas.push(busqueda);
        }
      });

      // Combinar todas las búsquedas
      if (todasLasBusquedas.length === 0) {
        observer.error('No se pudieron generar queries para ninguna provincia');
        return;
      }

      // Esperar a que todas las búsquedas terminen
      forkJoin(todasLasBusquedas).subscribe({
        next: (resultadosArray) => {
          // ✅ CORREGIDO: Usar reduce en lugar de flat()
          const todosLosPuntos = resultadosArray.reduce((acc, val) => acc.concat(val), []);
          
          // ✅ CORREGIDO: Especificar tipo del parámetro
          const seen = new Set();
          const puntosUnicos = todosLosPuntos.filter((punto: PuntoInteres) => {
            const key = `${punto.lat.toFixed(4)}_${punto.lon.toFixed(4)}`;
            if (seen.has(key)) {
              return false;
            }
            seen.add(key);
            return true;
          });
          
          console.log(`🎯 RESULTADO FINAL: ${puntosUnicos.length} puntos únicos encontrados en toda Argentina`);
          observer.next(puntosUnicos);
          observer.complete();
        },
        error: (error) => {
          console.error('❌ Error en búsqueda nacional:', error);
          observer.error(error);
        }
      });
    }
  });
}
  // ====== Llamar a la API de Overpass ======
  private llamarOverpass(query: string): Observable<any[]> {
    const formData = new FormData();
    formData.append('data', query);

    return this.http.post<any>(OVERPASS_CONFIG.url, query, {
      headers: { 'Content-Type': 'text/plain' }
    }).pipe(
      map(response => response.elements || []),
      catchError(error => {
        console.error('Error en petición Overpass:', error);
        throw new Error('No se pudieron obtener los datos de Overpass');
      })
    );
  }

  // ====== Obtener lista de provincias ======
  getProvincias(): string[] {
    return PROVINCIAS.map(p => p.nombre);
  }

  // ====== Buscar puntos por paisaje en toda Argentina ======
  buscarPorPaisaje(paisaje: string): Observable<PuntoInteres[]> {
    return this.buscarPuntos({ paisaje });
  }

  // ====== Buscar puntos por categoría en provincia específica ======
  buscarPorCategoria(provincia: string, categoria: string): Observable<PuntoInteres[]> {
    return this.buscarPuntos({ provincia, categoria });
  }

  // ====== Método para obtener estadísticas ======
  getEstadisticasBusqueda(filtros: FiltrosBusqueda): Observable<{total: number, categorias: any}> {
    return this.buscarPuntos(filtros).pipe(
      map(puntos => {
        const categorias = puntos.reduce((acc: any, punto) => {
          acc[punto.categoria] = (acc[punto.categoria] || 0) + 1;
          return acc;
        }, {});

        return {
          total: puntos.length,
          categorias
        };
      })
    );
  }
}
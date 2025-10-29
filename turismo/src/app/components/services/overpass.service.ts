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
  /**
   * @function obtenerCodigoProvincia
   * @description Convierte el nombre de una provincia argentina a su código ISO correspondiente
   * @param {string} nombre - Nombre completo de la provincia (ej: "Mendoza")
   * @returns {string | undefined} Código ISO de la provincia (ej: "AR-M") o undefined si no se encuentra
   * @private
   */
  private obtenerCodigoProvincia(nombre: string): string | undefined {
    const provincia = PROVINCIAS.find(p => 
      p.nombre.toLowerCase() === nombre.toLowerCase()
    );
    return provincia?.iso;
  }

  /**
   * @function construirQueryCategoria
   * @description Construye una query Overpass específica para búsquedas por categoría turística
   * @param {string} codigoISO - Código ISO de la provincia (ej: "AR-M")
   * @param {string} categoria - Identificador de la categoría (ej: "naturaleza", "turismo")
   * @returns {string} Query Overpass QL formateada para la categoría especificada
   * @private
   */
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

 /**
   * @function construirQueryPaisaje
   * @description Construye una query Overpass específica para búsquedas por tipo de paisaje
   * @param {string} codigoISO - Código ISO de la provincia (ej: "AR-M")
   * @param {string} paisaje - Identificador del paisaje (ej: "cerros_y_montañas", "rios_y_mar")
   * @returns {string} Query Overpass QL formateada para el paisaje especificado
   * @private
   */
private construirQueryPaisaje(codigoISO: string, paisaje: string): string {
  const config = PAISAJES_OVERPASS[paisaje as keyof typeof PAISAJES_OVERPASS];
  if (!config) return '';

  const queries = config.tipos.map(tipoValor => {
    return config.tags.map(tagKey => {
      return TIPOS_ELEMENTOS.map(tipoElemento => 
        `${tipoElemento}(area.a)["${tagKey}"="${tipoValor}"];`
      ).join('\n');
    }).join('\n');
  }).join('\n');

  return queries;
}

   /**
   * @function construirQueryOverpass
   * @description Construye una query Overpass completa combinando filtros de categoría y/o paisaje
   * @param {string} codigoISO - Código ISO de la provincia objetivo
   * @param {FiltrosBusqueda} filtros - Objeto con los filtros de búsqueda aplicados
   * @returns {string} Query Overpass QL completa y formateada lista para ejecutar
   * @private
   */
  private construirQueryOverpass(codigoISO: string, filtros: FiltrosBusqueda): string {
    let partes: string[] = [];
    if (filtros.categoria) {
      const queryCategoria = this.construirQueryCategoria(codigoISO, filtros.categoria);
      if (queryCategoria) {
        partes.push(queryCategoria);
      }
    }
    if (filtros.paisaje) {
      const queryPaisaje = this.construirQueryPaisaje(codigoISO, filtros.paisaje);
      if (queryPaisaje) {
        partes.push(queryPaisaje);
      }
    }

    if (partes.length === 0) {
      return '';
    }
    const query = `
      [out:json][timeout:${OVERPASS_CONFIG.timeout}];
      area["ISO3166-2"="${codigoISO}"]->.a;
      (
        ${partes.join('\n')}
      );
      out center ${OVERPASS_CONFIG.maxElements};
    `;
    return query;
  }

   /**
   * @function procesarElementos
   * @description Transforma y filtra elementos crudos de Overpass a puntos de interés estructurados
   * @param {any[]} elementos - Array de elementos crudos obtenidos de la API Overpass
   * @param {FiltrosBusqueda} filtros - Filtros aplicados para contextualizar el procesamiento
   * @returns {PuntoInteres[]} Array de puntos de interés procesados y validados
   * @private
   */
  private procesarElementos(elementos: any[], filtros: FiltrosBusqueda): PuntoInteres[] {
    return elementos
      .filter(el => el.lat && el.lon) 
      .map(el => {
      
        let categoriaPrincipal = 'otro';
        
        if (filtros.categoria) {
          categoriaPrincipal = filtros.categoria;
        } else if (filtros.paisaje) {
          categoriaPrincipal = filtros.paisaje;
        } else {
       
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
      .filter(punto => punto.nombre !== 'Sin nombre');
  }

   /**
   * @function generarNombreDesdeTags
   * @description Genera un nombre legible para puntos que no tienen nombre en OpenStreetMap
   * @param {any} tags - Objeto de tags/metadatos del elemento OpenStreetMap
   * @returns {string} Nombre generado a partir de los tags disponibles
   * @private
   */
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

 /**
   * @function buscarPuntos
   * @description Método principal que ejecuta búsquedas de puntos de interés según los filtros aplicados
   * @param {FiltrosBusqueda} filtros - Criterios de búsqueda (provincia, categoría, paisaje)
   * @returns {Observable<PuntoInteres[]>} Observable que emite array de puntos de interés encontrados
   * @public
   */
buscarPuntos(filtros: FiltrosBusqueda): Observable<PuntoInteres[]> {
  return new Observable(observer => {
   
    if (!filtros.provincia && !filtros.paisaje) {
      observer.error('Se requiere al menos provincia o paisaje');
      return;
    }

    if (filtros.provincia) {
    
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
          observer.next(puntos);
          observer.complete();
        },
        error: (error) => {
          console.error('❌ Error en Overpass:', error);
          observer.error(error);
        }
      });

    } else {
      const provincias = PROVINCIAS.map(p => p.iso);
      const todasLasBusquedas: Observable<PuntoInteres[]>[] = [];


      provincias.forEach(provinciaISO => {
        const query = this.construirQueryOverpass(provinciaISO, filtros);
        
        if (query) {
          const busqueda = this.llamarOverpass(query).pipe(
            map(elementos => this.procesarElementos(elementos, filtros)),
            catchError(error => {
              console.warn(`⚠️ Provincia ${provinciaISO}: error -`, error.message);
              return of([]);
            })
          );
          todasLasBusquedas.push(busqueda);
        }
      });

   
      if (todasLasBusquedas.length === 0) {
        observer.error('No se pudieron generar queries para ninguna provincia');
        return;
      }

      forkJoin(todasLasBusquedas).subscribe({
        next: (resultadosArray) => {
          const todosLosPuntos = resultadosArray.reduce((acc, val) => acc.concat(val), []);

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
 /**
   * @function llamarOverpass
   * @description Ejecuta una petición HTTP a la API de Overpass con la query proporcionada
   * @param {string} query - Query Overpass QL completa a ejecutar
   * @returns {Observable<any[]>} Observable que emite los elementos crudos obtenidos de Overpass
   * @private
   */
  private llamarOverpass(query: string): Observable<any[]> {
    const formData = new FormData();
    formData.append('data', query);

    return this.http.post<any>(OVERPASS_CONFIG.url, query, {
      headers: { 'Content-Type': 'text/plain' }
    }).pipe(
      map(response => response.elements || []),
      catchError(error => {
        
        throw new Error('No se pudieron obtener los datos de Overpass');
      })
    );
  }
   /**
   * @function getProvincias
   * @description Obtiene la lista de nombres de todas las provincias argentinas disponibles
   * @returns {string[]} Array con los nombres de las 24 provincias argentinas
   * @public
   */
  getProvincias(): string[] {
    return PROVINCIAS.map(p => p.nombre);
  }

 /**
   * @function buscarPorPaisaje
   * @description Busca puntos de interés por tipo de paisaje en toda Argentina
   * @param {string} paisaje - Identificador del paisaje a buscar
   * @returns {Observable<PuntoInteres[]>} Observable con puntos de interés del paisaje especificado
   * @public
   */
  buscarPorPaisaje(paisaje: string): Observable<PuntoInteres[]> {
    return this.buscarPuntos({ paisaje });
  }

 /**
   * @function buscarPorCategoria
   * @description Busca puntos de interés por categoría en una provincia específica
   * @param {string} provincia - Nombre de la provincia donde buscar
   * @param {string} categoria - Identificador de la categoría a buscar
   * @returns {Observable<PuntoInteres[]>} Observable con puntos de interés de la categoría en la provincia
   * @public
   */
  buscarPorCategoria(provincia: string, categoria: string): Observable<PuntoInteres[]> {
    return this.buscarPuntos({ provincia, categoria });
  }

/**
   * @function getEstadisticasBusqueda
   * @description Obtiene estadísticas de una búsqueda (total de puntos y distribución por categoría)
   * @param {FiltrosBusqueda} filtros - Filtros de búsqueda para analizar
   * @returns {Observable<{total: number, categorias: any}>} Observable con estadísticas de la búsqueda
   * @public
   */
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
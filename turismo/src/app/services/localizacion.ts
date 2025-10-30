import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

export interface Ubicacion {
  lat: number;
  lng: number;
  precision?: number;
}

@Injectable({
  providedIn: 'root'
})
export class Localizacion {

  constructor() {}

  /**
   * @function estaGPSHabilitado
   * @description Verifica si el GPS está habilitado (sincronizado con localStorage)
   * @returns {boolean}
   */
  estaGPSHabilitado(): boolean {
    try {
      const estado = localStorage.getItem('gpsHabilitado');
      return estado === null ? true : JSON.parse(estado);
    } catch (error) {
      return true;
    }
  }

  /**
   * @function getCurrentPosition
   * @description Obtiene la ubicación actual solo si el GPS está habilitado
   * @returns {Promise<Ubicacion | null>}
   */
  async getCurrentPosition(): Promise<Ubicacion | null> {
    if (!this.estaGPSHabilitado()) {
      return null;
    }

    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      return {
        lat: coordinates.coords.latitude,
        lng: coordinates.coords.longitude,
        precision: coordinates.coords.accuracy
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * @function cambiarEstadoGPS
   * @description Cambia el estado del GPS y solicita permisos si se habilita
   * @param {boolean} habilitar - Estado deseado del GPS
   * @returns {Promise<boolean>}
   */
  async cambiarEstadoGPS(habilitar: boolean): Promise<boolean> {
    try {
      localStorage.setItem('gpsHabilitado', JSON.stringify(habilitar));
      if (habilitar) {
        const permisos = await this.requestPermissions();
        if (permisos === 'granted') {
          return true;
        } else {
          localStorage.setItem('gpsHabilitado', 'false');
          return false;
        }
      }
      return true;
    } catch (error) {
      return habilitar;
    }
  }

  /**
   * @function watchPosition
   * @description Inicia seguimiento continuo de ubicación solo si está habilitado
   * @param {Function} callback - Función a ejecutar cuando cambia la ubicación
   * @returns {any}
   */
  watchPosition(callback: (ubicacion: Ubicacion | null) => void) {
    if (!this.estaGPSHabilitado()) {
      return null;
    }
    return Geolocation.watchPosition({
      enableHighAccuracy: true,
      timeout: 10000
    }, (position) => {
      if (position && this.estaGPSHabilitado()) {
        callback({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          precision: position.coords.accuracy
        });
      } else {
        callback(null);
      }
    });
  }

  /**
   * @function checkPermissions
   * @description Verifica los permisos de ubicación
   * @returns {Promise<string>}
   */
  async checkPermissions(): Promise<string> {
    if (!this.estaGPSHabilitado()) {
      return 'denied';
    }

    const status = await Geolocation.checkPermissions();
    return status.location;
  }

  /**
   * @function requestPermissions
   * @description Solicita permisos de ubicación
   * @returns {Promise<string>}
   */
  async requestPermissions(): Promise<string> {
    if (!this.estaGPSHabilitado()) {
      return 'denied';
    }

    const status = await Geolocation.requestPermissions();
    return status.location;
  }

  /**
   * @function obtenerUbicacionSiHabilitada
   * @description Alias para obtener ubicación si está habilitada
   * @returns {Promise<Ubicacion | null>}
   */
  async obtenerUbicacionSiHabilitada(): Promise<Ubicacion | null> {
    return await this.getCurrentPosition();
  }

  /**
   * @function forzarActivacionGPS
   * @description Fuerza la activación del GPS
   * @returns {Promise<boolean>}
   */
  async forzarActivacionGPS(): Promise<boolean> {
    return await this.cambiarEstadoGPS(true);
  }
}
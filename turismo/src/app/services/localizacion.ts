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

  // ✅ VERIFICAR SI EL GPS ESTÁ HABILITADO (sincronizado con localStorage)
  estaGPSHabilitado(): boolean {
    try {
      const estado = localStorage.getItem('gpsHabilitado');
      // Si no existe en localStorage, por defecto es true
      return estado === null ? true : JSON.parse(estado);
    } catch (error) {
      console.error('Error leyendo estado GPS:', error);
      return true; // Valor por defecto seguro
    }
  }

  // ✅ OBTENER UBICACIÓN SOLO SI ESTÁ HABILITADO
  async getCurrentPosition(): Promise<Ubicacion | null> {
    if (!this.estaGPSHabilitado()) {
      console.log('📍 GPS deshabilitado - no se obtiene ubicación');
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
      console.error('Error obteniendo ubicación:', error);
      throw error;
    }
  }

  // ✅ CAMBIAR ESTADO DEL GPS
  async cambiarEstadoGPS(habilitar: boolean): Promise<boolean> {
    try {
      // Guardar en localStorage
      localStorage.setItem('gpsHabilitado', JSON.stringify(habilitar));
      
      if (habilitar) {
        // Si está activando, solicitar permisos
        const permisos = await this.requestPermissions();
        
        if (permisos === 'granted') {
          // Verificar que realmente funciona obteniendo ubicación
          await this.getCurrentPosition();
          return true; // Éxito
        } else {
          // Si deniega permisos, desactivar GPS
          localStorage.setItem('gpsHabilitado', 'false');
          return false; // Falló
        }
      }
      
      return true; // Éxito al desactivar
    } catch (error) {
      console.error('Error cambiando estado GPS:', error);
      // En caso de error, desactivar por seguridad
      localStorage.setItem('gpsHabilitado', 'false');
      return false;
    }
  }

  // 🔹 SEGUIMIENTO CONTINUO DE UBICACIÓN (solo si está habilitado)
  watchPosition(callback: (ubicacion: Ubicacion | null) => void) {
    if (!this.estaGPSHabilitado()) {
      console.log('GPS deshabilitado, no se inicia seguimiento');
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

  // 🔹 VERIFICAR PERMISOS
  async checkPermissions(): Promise<string> {
    if (!this.estaGPSHabilitado()) {
      return 'denied'; // Simular permisos denegados si el GPS está deshabilitado
    }

    const status = await Geolocation.checkPermissions();
    return status.location;
  }

  // 🔹 SOLICITAR PERMISOS
  async requestPermissions(): Promise<string> {
    if (!this.estaGPSHabilitado()) {
      return 'denied'; // Simular permisos denegados si el GPS está deshabilitado
    }

    const status = await Geolocation.requestPermissions();
    return status.location;
  }

  // 🔹 OBTENER UBICACIÓN SI ESTÁ HABILITADO (alias para claridad)
  async obtenerUbicacionSiHabilitada(): Promise<Ubicacion | null> {
    return await this.getCurrentPosition();
  }

  // 🔹 FORZAR ACTIVACIÓN DE GPS
  async forzarActivacionGPS(): Promise<boolean> {
    return await this.cambiarEstadoGPS(true);
  }
}
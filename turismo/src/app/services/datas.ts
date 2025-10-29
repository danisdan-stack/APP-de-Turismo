import { Injectable } from '@angular/core';

import { Firestore, collection, doc, setDoc } from '@angular/fire/firestore';

import { inject } from '@angular/core';

export interface UserProfile {
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private firestore: Firestore = inject(Firestore); 

  constructor() {}
    /**
   * @function saveUserProfile
   * @description Guarda el perfil del usuario en Firestore
   * @param {string} userId - ID del usuario
   * @param {UserProfile} data - Datos del perfil del usuario
   * @returns {Promise<void>}
   */

  async saveUserProfile(userId: string, data: UserProfile): Promise<void> {
    const docRef = doc(this.firestore, `usuario/${userId}`); 
    try {
      await setDoc(docRef, data, { merge: true }); 
      console.log('[DataService] Perfil guardado en:', `usuario/${userId}`);
    } catch (error) {
      console.error('[DataService] Error al guardar el perfil en Firestore:', error);
      throw new Error('No se pudo completar el guardado del perfil en la base de datos.');
    }
  }
}
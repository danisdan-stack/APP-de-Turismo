import { Injectable } from '@angular/core';
// --- Importaciones para la API Modular de Firestore ---
import { Firestore, collection, doc, setDoc } from '@angular/fire/firestore';
// También necesitarás 'inject' si no lo inyectas en el constructor
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
  // Inyectar Firestore de forma modular
  // Puedes hacerlo en el constructor como antes, o usando inject() en un field initializer:
  private firestore: Firestore = inject(Firestore); // <--- Uso modular de Firestore

  constructor() {}

  async saveUserProfile(userId: string, data: UserProfile): Promise<void> {
    const docRef = doc(this.firestore, `usuario/${userId}`); // Crear una referencia de documento
    try {
      await setDoc(docRef, data, { merge: true }); // Usar setDoc modular
      console.log('[DataService] Perfil guardado en:', `usuario/${userId}`);
    } catch (error) {
      console.error('[DataService] Error al guardar el perfil en Firestore:', error);
      throw new Error('No se pudo completar el guardado del perfil en la base de datos.');
    }
  }
}
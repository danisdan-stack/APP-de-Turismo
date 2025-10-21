import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';

export interface UserProfile {
  email: string;
  nombre: string;
  apellido: string;
  telefono: string;
  id: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private firestore: AngularFirestore) {}

  // Guarda el perfil en la colección 'usuario' con el uid como id del documento
  async saveUserProfile(userId: string, data: UserProfile): Promise<void> {
    const docPath = `usuario/${userId}`; // <-- aquí apuntas a la colección 'usuario'
    try {
      await this.firestore.doc(docPath).set(data, { merge: true });
      console.log(`[DataService] Perfil guardado en ${docPath}`);
    } catch (error) {
      console.error('[DataService] Error al guardar el perfil en Firestore:', error);
      throw new Error('No se pudo completar el guardado del perfil en la base de datos.');
    }
  }
}
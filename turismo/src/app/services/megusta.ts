import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  collectionData,
  query, 
  where, 
  orderBy,
  Timestamp 
} from '@angular/fire/firestore';
import { Observable, of, tap } from 'rxjs';
import { ProfileService } from './perfil';
import { AuthService } from './auth'; // ✅ Necesitamos AuthService para obtener el UID

@Injectable({
  providedIn: 'root'
})
export class MeGustaService {
  private authService = inject(AuthService); // ✅ Inyectar AuthService

  constructor(
    private firestore: Firestore,
    private profileService: ProfileService
  ) {}
  

  async guardarMeGusta(puntoData: any): Promise<boolean> {
    try {
      const uid = this.authService.getUserId(); // ✅ Obtener UID de AuthService
      
      if (!uid) {
        console.error('Usuario no logeado');
        return false;
      }

      // ✅ Obtener el perfil completo usando el UID
      const userProfile = await this.profileService.getUserProfile(uid);
      
      if (!userProfile) {
        console.error('No se pudo obtener el perfil del usuario');
        return false;
      }

      const datosParaGuardar = {
        usuarioId: userProfile.id, // ✅ ID del UserProfile
        categoria: puntoData.categoria,
        provincia: puntoData.provincia,
        nombre_lugar: puntoData.nombre,
        ubicacion: {
          latitud: puntoData.lat,
          longitud: puntoData.lng
        },
        fechaCreacion: Timestamp.now()
      };

      const docRef = await addDoc(
        collection(this.firestore, 'me_gusta'), 
        datosParaGuardar
      );

      console.log('✅ Guardado en Firestore con ID:', docRef.id);
      return true;

    } catch (error) {
      console.error('❌ Error guardando:', error);
      return false;
    }
  }

// ✅ VERSIÓN SIMPLIFICADA (mientras se crea el índice)
// ✅ OBTENER TODOS LOS "ME GUSTA" DEL USUARIO LOGGEADO - CON MÁS DEBUG
obtenerMisMeGusta(): Observable<any[]> {
  const uid = this.authService.getUserId();
  
  console.log('🔍 DEBUG - Usuario actual UID:', uid);
  console.log('🔍 DEBUG - Tipo de UID:', typeof uid);
  
  if (!uid) {
    console.log('❌ DEBUG - No hay UID, retornando array vacío');
    return of([]);
  }

  const q = query(
    collection(this.firestore, 'me_gusta'),
    where('usuarioId', '==', uid)
  );

  console.log('📡 DEBUG - Consulta creada, ejecutando...');
  
  return collectionData(q, { idField: 'id' }).pipe(
    tap(favoritos => {
      console.log('📊 DEBUG - Favoritos recibidos:', favoritos.length);
      if (favoritos.length > 0) {
        console.log('🔍 DEBUG - Primer favorito:', favoritos[0]);
        console.log('🔍 DEBUG - usuarioId del primer favorito:', favoritos[0].usuarioId);
      }
    })
  ) as Observable<any[]>;
}

  // ✅ ELIMINAR "ME GUSTA"
  async eliminarMeGusta(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(this.firestore, 'me_gusta', id));
      console.log('✅ Favorito eliminado:', id);
      return true;
    } catch (error) {
      console.error('❌ Error eliminando favorito:', error);
      return false;
    }
  }
}
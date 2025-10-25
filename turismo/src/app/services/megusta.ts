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
  Timestamp,
  getDocs  // ✅ IMPORTAR getDocs
} from '@angular/fire/firestore';
import { Observable, of, tap } from 'rxjs';
import { ProfileService } from './perfil';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class MeGustaService {
  private authService = inject(AuthService);

  constructor(
    private firestore: Firestore,
    private profileService: ProfileService
  ) {}

  // ✅ MÉTODO PARA VERIFICAR SI EL PUNTO YA ES FAVORITO
  private async verificarFavoritoExistente(usuarioId: string, lat: number, lng: number): Promise<boolean> {
    try {
      console.log('🔍 Verificando si punto ya es favorito...', { usuarioId, lat, lng });
      
      const q = query(
        collection(this.firestore, 'me_gusta'),
        where('usuarioId', '==', usuarioId),
        where('ubicacion.latitud', '==', lat),
        where('ubicacion.longitud', '==', lng)
      );

      const querySnapshot = await getDocs(q);
      const existe = !querySnapshot.empty;
      
      console.log('📊 Resultado verificación duplicado:', existe);
      return existe;

    } catch (error) {
      console.error('❌ Error verificando favorito existente:', error);
      // Si hay error, asumimos que no existe para permitir guardar
      return false;
    }
  }

  async guardarMeGusta(puntoData: any): Promise<boolean> {
    try {
      const uid = this.authService.getUserId();
      
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

      // ✅ VERIFICAR SI YA EXISTE ANTES DE GUARDAR
      const yaExiste = await this.verificarFavoritoExistente(
        userProfile.id, 
        puntoData.lat, 
        puntoData.lng
      );
      
      if (yaExiste) {
        console.log('⚠️ El punto ya está en favoritos, no se guardará duplicado');
        return false;
      }

      const datosParaGuardar = {
        usuarioId: userProfile.id,
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

  // ✅ OBTENER TODOS LOS "ME GUSTA" DEL USUARIO LOGGEADO
  obtenerMisMeGusta(): Observable<any[]> {
    const uid = this.authService.getUserId();
    
    console.log('🔍 DEBUG - Usuario actual UID:', uid);
    
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
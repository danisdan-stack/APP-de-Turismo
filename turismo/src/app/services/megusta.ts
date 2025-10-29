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

  Timestamp,
  getDocs 
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

    /**
   * @function verificarFavoritoExistente
   * @description Verifica si el punto ya está marcado como favorito
   * @param {string} usuarioId - ID del usuario
   * @param {number} lat - Latitud del punto
   * @param {number} lng - Longitud del punto
   * @returns {Promise<boolean>}
   */
  private async verificarFavoritoExistente(usuarioId: string, lat: number, lng: number): Promise<boolean> {
    try {
     
      
      const q = query(
        collection(this.firestore, 'me_gusta'),
        where('usuarioId', '==', usuarioId),
        where('ubicacion.latitud', '==', lat),
        where('ubicacion.longitud', '==', lng)
      );

      const querySnapshot = await getDocs(q);
      const existe = !querySnapshot.empty;
      
    
      return existe;

    } catch (error) {
     
      return false;
    }
  }

    /**
   * @function guardarMeGusta
   * @description Guarda un punto como favorito del usuario
   * @param {any} puntoData - Datos del punto a guardar
   * @returns {Promise<boolean>}
   */

  async guardarMeGusta(puntoData: any): Promise<boolean> {
    try {
      const uid = this.authService.getUserId();
      
      if (!uid) {
       
        return false;
      }

     
      const userProfile = await this.profileService.getUserProfile(uid);
      
      if (!userProfile) {
  
        return false;
      }

      
      const yaExiste = await this.verificarFavoritoExistente(
        userProfile.id, 
        puntoData.lat, 
        puntoData.lng
      );
      
      if (yaExiste) {
        
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

     
      return true;

    } catch (error) {
     
      return false;
    }
  }

  /**
   * @function obtenerMisMeGusta
   * @description Obtiene todos los favoritos del usuario logeado
   * @returns {Observable<any[]>}
   */

  obtenerMisMeGusta(): Observable<any[]> {
    const uid = this.authService.getUserId();
    
  
    
    if (!uid) {

      return of([]);
    }

    const q = query(
      collection(this.firestore, 'me_gusta'),
      where('usuarioId', '==', uid)
    );

    
    return collectionData(q, { idField: 'id' }).pipe(
      tap(favoritos => {
        
        if (favoritos.length > 0) {
 
        }
      })
    ) as Observable<any[]>;
  }

   /**
   * @function eliminarMeGusta
   * @description Elimina un favorito por su ID
   * @param {string} id - ID del favorito a eliminar
   * @returns {Promise<boolean>}
   */
  async eliminarMeGusta(id: string): Promise<boolean> {
    try {
      await deleteDoc(doc(this.firestore, 'me_gusta', id));
 
      return true;
    } catch (error) {
  
      return false;
    }
  }
}
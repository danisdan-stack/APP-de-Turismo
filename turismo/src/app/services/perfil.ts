import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth';
import { UserProfile } from './auth';
import { 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private firestore = inject(Firestore);
  private auth = inject(AuthService);
  private readonly collectionName = 'usuario';

  /**
   * @function saveUserProfile
   * @description Guarda el perfil completo del usuario en Firestore
   * @param {UserProfile} profile - Objeto con los datos del perfil del usuario
   * @returns {Promise<void>} Promesa que se resuelve cuando se guarda el perfil
   */
  async saveUserProfile(profile: UserProfile): Promise<void> {
    const userDocRef = doc(this.firestore, `${this.collectionName}/${profile.id}`);
    await setDoc(userDocRef, {
      ...profile,
      updatedAt: new Date()
    });
  }
  /**
   * @function getUserProfileById
   * @description Obtiene el perfil de usuario por ID combinando datos de Auth y Firestore
   * @param {string} uid - ID único del usuario
   * @returns {Promise<UserProfile | null>} Promesa con el perfil del usuario o null si no existe
   */
  async getUserProfileById(uid: string): Promise<UserProfile | null> {

  const firestoreProfile = await this.getUserProfile(uid); 
    if (!firestoreProfile) return null;
    const authProfile = await this.auth.getCurrentUserProfile();
    if (authProfile?.id === uid) {
      return {
        ...authProfile,
        ...firestoreProfile
      };
    }

  return firestoreProfile;
}


  /**
   * @function getUserProfile
   * @description Obtiene el perfil del usuario desde Firestore
   * @param {string} uid - ID único del usuario
   * @returns {Promise<UserProfile | null>} Promesa con el perfil del usuario o null si no existe
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDocRef = doc(this.firestore, `${this.collectionName}/${uid}`); 
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  }

  /**
   * @function updateUserProfile
   * @description Actualiza campos específicos del perfil del usuario en Firestore
   * @param {string} uid - ID único del usuario
   * @param {Partial<UserProfile>} updates - Objeto con los campos a actualizar
   * @returns {Promise<void>} Promesa que se resuelve cuando se actualiza el perfil
   */
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {

    const userDocRef = doc(this.firestore, `${this.collectionName}/${uid}`); 
    await updateDoc(userDocRef, {
    ...updates,
    updatedAt: new Date()
    });
  }
  /**
   * @function createUserProfileFromGoogle
   * @description Crea un perfil automáticamente para usuarios que se registran con Google
   * @param {any} user - Objeto de usuario de Google Auth
   * @returns {Promise<void>} Promesa que se resuelve cuando se crea el perfil
   */
async createUserProfileFromGoogle(user: any): Promise<void> {
  try {
    const profileData: UserProfile = {
      id: user.uid,
      email: user.email || '',
      nombre: user.displayName?.split(' ')[0] || 'Usuario',
      apellido: user.displayName?.split(' ')[1] || 'Google',
      telefono: user.phoneNumber || ''
    };

    await this.saveUserProfile(profileData);

  } catch (error) {

    throw error;
  }
}

  /**
   * @function getCompleteUserProfile
   * @description Obtiene el perfil completo combinando datos de Authentication y Firestore
   * @returns {Promise<UserProfile | null>} Promesa con el perfil completo del usuario o null si no existe
   */
  async getCompleteUserProfile(): Promise<UserProfile | null> {
    const authProfile = await this.auth.getCurrentUserProfile();
    if (!authProfile) return null;
    const firestoreProfile = await this.getUserProfile(authProfile.id);
    return {
      ...authProfile,
      ...firestoreProfile
    };
  }
}
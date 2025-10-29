import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from '@angular/fire/firestore';
import { AuthService } from './auth';

// 🔹 Importa UserProfile desde auth
import { UserProfile } from './auth';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  private firestore = inject(Firestore);
  private auth = inject(AuthService);
  

  private readonly collectionName = 'usuario';

  // 🔹 Guardar perfil completo en Firestore
  async saveUserProfile(profile: UserProfile): Promise<void> {
    const userDocRef = doc(this.firestore, `${this.collectionName}/${profile.id}`);
    await setDoc(userDocRef, {
      ...profile,
      updatedAt: new Date()
    });
  }
  
  async getUserProfileById(uid: string): Promise<UserProfile | null> {
    // Usa el método auxiliar corregido
    const firestoreProfile = await this.getUserProfile(uid); 
    if (!firestoreProfile) return null;

    const authProfile = await this.auth.getCurrentUserProfile();
    
    // Solo combinamos si el UID coincide
    if (authProfile?.id === uid) {
      return {
        ...authProfile,
        ...firestoreProfile
      };
    }
    
    return firestoreProfile;
  }


  // 🔹 Obtener perfil completo desde Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    // 🚨 CAMBIO: Usar this.collectionName
    const userDocRef = doc(this.firestore, `${this.collectionName}/${uid}`); 
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  }

  // 🔹 Actualizar campos específicos del perfil
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    // 🚨 CAMBIO: Usar this.collectionName
    const userDocRef = doc(this.firestore, `${this.collectionName}/${uid}`); 
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: new Date()
    });
  }
// En ProfileService - agrega este método:

// 🔹 CREAR PERFIL AUTOMÁTICAMENTE PARA USUARIOS DE GOOGLE
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
    console.log('✅ Perfil de Google creado automáticamente');
  } catch (error) {
    console.error('❌ Error creando perfil de Google:', error);
    throw error;
  }
}

  // 🔹 Obtener perfil completo combinando Auth y Firestore
  async getCompleteUserProfile(): Promise<UserProfile | null> {
    const authProfile = await this.auth.getCurrentUserProfile();
    if (!authProfile) return null;

    const firestoreProfile = await this.getUserProfile(authProfile.id);
    
    // Combinar ambos perfiles, dando prioridad a Firestore
    return {
      ...authProfile,
      ...firestoreProfile
    };
  }
}
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

  // 🔹 Guardar perfil completo en Firestore
  async saveUserProfile(profile: UserProfile): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${profile.uid}`);
    await setDoc(userDocRef, {
      ...profile,
      updatedAt: new Date()
    });
  }

  // 🔹 Obtener perfil completo desde Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  }

  // 🔹 Actualizar campos específicos del perfil
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: new Date()
    });
  }

  // 🔹 Obtener perfil completo combinando Auth y Firestore
  async getCompleteUserProfile(): Promise<UserProfile | null> {
    const authProfile = await this.auth.getCurrentUserProfile();
    if (!authProfile) return null;

    const firestoreProfile = await this.getUserProfile(authProfile.uid);
    
    // Combinar ambos perfiles, dando prioridad a Firestore
    return {
      ...authProfile,
      ...firestoreProfile
    };
  }
}
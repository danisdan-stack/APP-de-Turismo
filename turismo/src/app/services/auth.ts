import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  user,
  User,
  updateProfile
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

// 🔹 Define la interfaz UserProfile en este mismo archivo
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  photoURL?: string;
  tourismInterest?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private firebaseAuth = inject(Auth);

  authState$: Observable<User | null> = user(this.firebaseAuth);

  async register(email: string, password: string): Promise<any> {
    try {
      const result = await createUserWithEmailAndPassword(
        this.firebaseAuth, 
        email, 
        password
      );
      console.log("✅ Usuario registrado correctamente:", result.user?.email);
      return result;
    } catch (error: any) {
      console.error("❌ Error en el registro:", error);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<any> {
    try {
      const result = await signInWithEmailAndPassword(
        this.firebaseAuth, 
        email, 
        password
      );
      console.log("✅ Sesión iniciada:", result.user?.email);
      return result;
    } catch (error: any) {
      console.error("❌ Error en el inicio de sesión:", error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.firebaseAuth);
      console.log("👋 Sesión cerrada correctamente");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
    }
  }

  getAuthState() {
    return this.authState$;
  }

  getCurrentUser(): User | null {
    return this.firebaseAuth.currentUser;
  }

  // 🔹 Obtener perfil del usuario actual
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = this.firebaseAuth.currentUser;
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      firstName: user.displayName?.split(' ')[0] || '',
      lastName: user.displayName?.split(' ')[1] || '',
      phoneNumber: user.phoneNumber || '',
      photoURL: user.photoURL || '',
      tourismInterest: '' // Este campo vendría de Firestore
    };
  }

  // 🔹 Actualizar perfil del usuario
  async updateUserProfile(profileData: {
    displayName?: string;
    photoURL?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No user logged in');

    await updateProfile(user, {
      displayName: profileData.displayName || `${profileData.firstName} ${profileData.lastName}`.trim(),
      photoURL: profileData.photoURL
    });
  }
}
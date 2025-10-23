import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  user,
  User,
  updateProfile,
  onAuthStateChanged,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

// 🔹 Interfaz para el perfil de usuario
export interface UserProfile {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private firebaseAuth = inject(Auth);
  private userId: string | null = null;

  authState$: Observable<User | null> = user(this.firebaseAuth);
  currentUser: any;

  constructor() {
    // Escucha los cambios de sesión
    onAuthStateChanged(this.firebaseAuth, (user) => {
      if (user) {
        this.userId = user.uid;
        localStorage.setItem('userUID', user.uid);
        console.log('✅ UID guardado:', this.userId);
      } else {
        this.userId = null;
        localStorage.removeItem('userUID');
        console.log('ℹ️ Usuario desconectado');
      }
    });

    // Restaura el UID si ya hay sesión guardada
    const storedId = localStorage.getItem('userUID');
    if (storedId) {
      this.userId = storedId;
    }
  }

  // =====================================================
  // 🔹 Actualizar email del usuario autenticado
  // =====================================================
  async updateAuthEmail(newEmail: string, currentPassword: string): Promise<void> {
    const user = this.firebaseAuth.currentUser; // ✅ USAMOS firebaseAuth, NO this.auth
    if (!user) throw new Error('No hay usuario autenticado');

    try {
      // Reautenticación obligatoria antes de cambiar el email
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Luego actualizamos el email
      await updateEmail(user, newEmail);

      console.log(`✅ Email actualizado correctamente a: ${newEmail}`);
    } catch (error) {
      console.error('❌ Error al actualizar el email:', error);
      throw error;
    }
  }
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    try {
      // 1. Reautenticación obligatoria (por seguridad)
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Actualizar contraseña
      await updatePassword(user, newPassword);

      console.log('✅ Contraseña actualizada correctamente');
    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      throw error;
    }
  }

  // =====================================================
  // 🔹 Registro
  // =====================================================
  async register(email: string, password: string): Promise<any> {
    try {
      const result = await createUserWithEmailAndPassword(this.firebaseAuth, email, password);
      console.log("✅ Usuario registrado correctamente:", result.user?.email);
      return result;
    } catch (error: any) {
      console.error("❌ Error en el registro:", error);
      throw error;
    }
  }

  // =====================================================
  // 🔹 Inicio de sesión
  // =====================================================
  async login(email: string, password: string): Promise<any> {
    try {
      const result = await signInWithEmailAndPassword(this.firebaseAuth, email, password);
      if (result.user?.uid) {
        this.userId = result.user.uid;
        localStorage.setItem('userUID', result.user.uid);
      }
      console.log("✅ Sesión iniciada:", result.user?.email);
      return result;
    } catch (error: any) {
      console.error("❌ Error en el inicio de sesión:", error);
      throw error;
    }
  }

  // =====================================================
  // 🔹 Cierre de sesión
  // =====================================================
  async logout(): Promise<void> {
    try {
      await signOut(this.firebaseAuth);
      this.userId = null;
      localStorage.removeItem('userUID');
      console.log("👋 Sesión cerrada correctamente");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
    }
  }

  // =====================================================
  // 🔹 Obtener datos de sesión
  // =====================================================
  getAuthState() {
    return this.authState$;
  }

  getCurrentUser(): User | null {
    return this.firebaseAuth.currentUser;
  }

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = this.firebaseAuth.currentUser;
    if (!user) return null;

    return {
      id: user.uid,
      email: user.email || '',
      nombre: user.displayName?.split(' ')[0] || '',
      apellido: user.displayName?.split(' ')[1] || ''
    };
  }

  // =====================================================
  // 🔹 Actualizar nombre/apellido del perfil
  // =====================================================
  async updateUserProfile(profileData: {
    nombre?: string;
    apellido?: string;
  }): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No user logged in');

    const fullName = `${profileData.nombre || ''} ${profileData.apellido || ''}`.trim();

    await updateProfile(user, {
      displayName: fullName || null
    });
  }

  // =====================================================
  // 🔹 Obtener UID guardado
  // =====================================================
  getStoredUserId(): string | null {
    return localStorage.getItem('userUID');
  }

  getUserId(): string | null {
    return this.userId;
  }
}

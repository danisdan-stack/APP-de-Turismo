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
  updatePassword,
  deleteUser,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential   
} from '@angular/fire/auth';

import { 
  Firestore, 
  doc, 
  deleteDoc 
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

// 🔹 Interfaz para el perfil de usuario
export interface UserProfile {
  id: string;
  email: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private firebaseAuth = inject(Auth);
  private userId: string | null = null;
  private firestore = inject(Firestore);

  authState$: Observable<User | null> = user(this.firebaseAuth);
  currentUser: User | null = null;

  constructor() {
    // ✅ MEJORA: Mejor manejo del estado de autenticación
    onAuthStateChanged(this.firebaseAuth, (user) => {
      this.currentUser = user;
      
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
  // 🔹 REAUTENTICACIÓN
  // =====================================================
  async reauthenticate(password: string): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    if (!user.email) {
      throw new Error('El usuario no tiene email');
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      console.log('✅ Reautenticación exitosa');
    } catch (error: any) {
      console.error('❌ Error en reautenticación:', error);
      throw error;
    }
  }

  // =====================================================
  // 🔹 ELIMINAR CUENTA (Compatible con Google y Email)
  // =====================================================
  async deleteUserAccount(currentPassword?: string): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    try {
      const isGoogleUser = this.isGoogleUser();
      
      if (!isGoogleUser) {
        // ✅ PARA USUARIOS EMAIL: Reautenticación con contraseña
        if (!currentPassword) {
          throw new Error('Se requiere la contraseña actual para eliminar la cuenta');
        }
        
        if (!user.email) {
          throw new Error('El usuario no tiene email asociado');
        }

        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        console.log('✅ Contraseña validada correctamente');
      } else {
        // ✅ PARA USUARIOS GOOGLE: Reautenticación con popup de Google
        console.log('🔐 Iniciando reautenticación Google...');
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ 
          prompt: 'select_account',
          login_hint: user.email || '' 
        });
        await signInWithPopup(this.firebaseAuth, provider);
        console.log('✅ Reautenticación Google exitosa');
      }

      // 2. Eliminar de la base de datos
      await this.deleteUserFromDatabase(user.uid);

      // 3. Eliminar de Authentication
      await deleteUser(user);

      // 4. Limpiar datos locales
      this.userId = null;
      this.currentUser = null;
      localStorage.removeItem('userUID');
      
      console.log('✅ Cuenta eliminada completamente');
    } catch (error: any) {
      console.error('❌ Error al eliminar cuenta:', error);
      
      // ✅ MEJORA: Manejo específico de errores
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('Debes volver a iniciar sesión para realizar esta acción');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Contraseña incorrecta');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Error de conexión. Verifica tu internet');
      }
      
      throw error;
    }
  }

  // =====================================================
  // 🔹 ELIMINAR USUARIO DE LA BASE DE DATOS
  // =====================================================
  private async deleteUserFromDatabase(userId: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'usuario', userId);
      await deleteDoc(userDocRef);
      console.log('✅ Usuario eliminado de la base de datos');
    } catch (error) {
      console.error('❌ Error al eliminar de la base de datos:', error);
      // ✅ MEJORA: No lanzar error para que la cuenta se elimine de Auth igual
      // Puedes decidir si quieres lanzar el error o solo loguearlo
      // throw error;
    }
  }

  // =====================================================
  // 🔹 Actualizar email del usuario autenticado
  // =====================================================
  async updateAuthEmail(newEmail: string, currentPassword: string): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    try {
      if (this.isGoogleUser()) {
        throw new Error('Los usuarios de Google no pueden cambiar su email desde la aplicación');
      }

      if (!user.email) {
        throw new Error('El usuario no tiene email actual');
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);

      console.log(`✅ Email actualizado correctamente a: ${newEmail}`);
    } catch (error: any) {
      console.error('❌ Error al actualizar el email:', error);
      
      // ✅ MEJORA: Manejo específico de errores
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('El email ya está en uso por otra cuenta');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('El formato del email no es válido');
      } else if (error.code === 'auth/requires-recent-login') {
        throw new Error('Debes volver a iniciar sesión para cambiar tu email');
      }
      
      throw error;
    }
  }

  // =====================================================
  // 🔹 CAMBIAR CONTRASEÑA
  // =====================================================
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    try {
      if (this.isGoogleUser()) {
        throw new Error('Los usuarios de Google no pueden cambiar contraseña desde la aplicación');
      }

      if (!user.email) {
        throw new Error('El usuario no tiene email');
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      console.log('✅ Contraseña actualizada correctamente');
    } catch (error: any) {
      console.error('❌ Error al cambiar contraseña:', error);
      
      // ✅ MEJORA: Manejo específico de errores
      if (error.code === 'auth/weak-password') {
        throw new Error('La nueva contraseña es muy débil. Debe tener al menos 6 caracteres');
      } else if (error.code === 'auth/requires-recent-login') {
        throw new Error('Debes volver a iniciar sesión para cambiar tu contraseña');
      }
      
      throw error;
    }
  }

  // =====================================================
  // 🔹 Registro
  // =====================================================
  async register(email: string, password: string): Promise<UserCredential> {
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
  async login(email: string, password: string): Promise<UserCredential> {
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
      this.currentUser = null;
      localStorage.removeItem('userUID');
      console.log("👋 Sesión cerrada correctamente");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
      throw error;
    }
  }

  // =====================================================
  // 🔹 Obtener datos de sesión
  // =====================================================
  getAuthState(): Observable<User | null> {
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
      apellido: user.displayName?.split(' ')[1] || '',
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
    if (!user) throw new Error('No hay usuario autenticado');

    const fullName = `${profileData.nombre || ''} ${profileData.apellido || ''}`.trim();
    
    try {
      await updateProfile(user, {
        displayName: fullName || null
      });
      console.log('✅ Perfil actualizado correctamente');
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      throw error;
    }
  }

  // =====================================================
  // 🔹 LOGIN CON GOOGLE
  // =====================================================
  async loginWithGoogle(): Promise<UserCredential> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(this.firebaseAuth, provider);
      
      if (result.user?.uid) {
        this.userId = result.user.uid;
        localStorage.setItem('userUID', result.user.uid);
      }
      
      console.log('✅ Login con Google exitoso:', result.user?.email);
      return result;
      
    } catch (error: any) {
      console.error('❌ Error en login con Google:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('El popup de Google fue cerrado');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('El popup fue bloqueado. Permite ventanas emergentes');
      }
      
      throw error;
    }
  }

  // =====================================================
  // 🔹 VERIFICAR SI ES USUARIO DE GOOGLE
  // =====================================================
  isGoogleUser(): boolean {
    const user = this.firebaseAuth.currentUser;
    if (!user) return false;
    
    return user.providerData.some(provider => 
      provider.providerId === 'google.com'
    );
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

  // ✅ MEJORA: Nuevo método para verificar autenticación
  isAuthenticated(): boolean {
    return this.firebaseAuth.currentUser !== null;
  }

  // ✅ MEJORA: Obtener email del usuario actual
  getCurrentUserEmail(): string | null {
    return this.firebaseAuth.currentUser?.email || null;
  }
}
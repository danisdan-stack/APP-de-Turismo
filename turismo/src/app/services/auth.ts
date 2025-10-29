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
  UserCredential,
  sendPasswordResetEmail  // ✅ FALTABA ESTA IMPORTACIÓN
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  deleteDoc 
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

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
    onAuthStateChanged(this.firebaseAuth, (user) => {
      this.currentUser = user;
      
      if (user) {
        this.userId = user.uid;
        localStorage.setItem('userUID', user.uid);
      } else {
        this.userId = null;
        localStorage.removeItem('userUID');
      }
    });

    const storedId = localStorage.getItem('userUID');
    if (storedId) {
      this.userId = storedId;
    }
  }

  /**
   * @function sendPasswordReset
   * @description Envía email para restablecer contraseña
   * @param {string} email - Email del usuario
   * @returns {Promise<void>}
   */
  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(this.firebaseAuth, email);
  }

  /**
   * @function reauthenticate
   * @description Reautentica al usuario con su contraseña actual
   * @param {string} password - Contraseña actual del usuario
   * @returns {Promise<void>}
   */
  async reauthenticate(password: string): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) {
      throw new Error('No hay usuario autenticado');
    }

    if (!user.email) {
      throw new Error('El usuario no tiene email');
    }

    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  }

  /**
   * @function deleteUserAccount
   * @description Elimina la cuenta del usuario (compatible con Google y Email)
   * @param {string} currentPassword - Contraseña actual (solo para usuarios email)
   * @returns {Promise<void>}
   */
  async deleteUserAccount(currentPassword?: string): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const isGoogleUser = this.isGoogleUser();
    
    if (!isGoogleUser) {
      if (!currentPassword) {
        throw new Error('Se requiere la contraseña actual para eliminar la cuenta');
      }
      
      if (!user.email) {
        throw new Error('El usuario no tiene email asociado');
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
    } else {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ 
        prompt: 'select_account',
        login_hint: user.email || '' 
      });
      await signInWithPopup(this.firebaseAuth, provider);
    }

    await this.deleteUserFromDatabase(user.uid);
    await deleteUser(user);

    this.userId = null;
    this.currentUser = null;
    localStorage.removeItem('userUID');
  }

  /**
   * @function deleteUserFromDatabase
   * @description Elimina el usuario de la base de datos Firestore
   * @param {string} userId - ID del usuario a eliminar
   * @returns {Promise<void>}
   */
  private async deleteUserFromDatabase(userId: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'usuario', userId);
      await deleteDoc(userDocRef);
    } catch (error) {
      throw error;
    }
  }

  /**
   * @function updateAuthEmail
   * @description Actualiza el email del usuario autenticado
   * @param {string} newEmail - Nuevo email
   * @param {string} currentPassword - Contraseña actual
   * @returns {Promise<void>}
   */
  async updateAuthEmail(newEmail: string, currentPassword: string): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    if (this.isGoogleUser()) {
      throw new Error('Los usuarios de Google no pueden cambiar su email desde la aplicación');
    }

    if (!user.email) {
      throw new Error('El usuario no tiene email actual');
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updateEmail(user, newEmail);
  }

  /**
   * @function changePassword
   * @description Cambia la contraseña del usuario
   * @param {string} currentPassword - Contraseña actual
   * @param {string} newPassword - Nueva contraseña
   * @returns {Promise<void>}
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    if (this.isGoogleUser()) {
      throw new Error('Los usuarios de Google no pueden cambiar contraseña desde la aplicación');
    }

    if (!user.email) {
      throw new Error('El usuario no tiene email');
    }

    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  }

  /**
   * @function register
   * @description Registra un nuevo usuario con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<UserCredential>}
   */
  async register(email: string, password: string): Promise<UserCredential> {
    const result = await createUserWithEmailAndPassword(this.firebaseAuth, email, password);
    return result;
  }

  /**
   * @function login
   * @description Inicia sesión con email y contraseña
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {Promise<UserCredential>}
   */
  async login(email: string, password: string): Promise<UserCredential> {
    const result = await signInWithEmailAndPassword(this.firebaseAuth, email, password);
    if (result.user?.uid) {
      this.userId = result.user.uid;
      localStorage.setItem('userUID', result.user.uid);
    }
    return result;
  }

  /**
   * @function logout
   * @description Cierra la sesión del usuario
   * @returns {Promise<void>}
   */
  async logout(): Promise<void> {
    await signOut(this.firebaseAuth);
    this.userId = null;
    this.currentUser = null;
    localStorage.removeItem('userUID');
  }

  /**
   * @function getAuthState
   * @description Obtiene el estado de autenticación como Observable
   * @returns {Observable<User | null>}
   */
  getAuthState(): Observable<User | null> {
    return this.authState$;
  }

  /**
   * @function getCurrentUser
   * @description Obtiene el usuario actual
   * @returns {User | null}
   */
  getCurrentUser(): User | null {
    return this.firebaseAuth.currentUser;
  }

  /**
   * @function getCurrentUserProfile
   * @description Obtiene el perfil del usuario actual
   * @returns {Promise<UserProfile | null>}
   */
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

  /**
   * @function updateUserProfile
   * @description Actualiza el nombre y apellido del perfil
   * @param {Object} profileData - Datos del perfil
   * @param {string} profileData.nombre - Nuevo nombre
   * @param {string} profileData.apellido - Nuevo apellido
   * @returns {Promise<void>}
   */
  async updateUserProfile(profileData: {
    nombre?: string;
    apellido?: string;
  }): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No hay usuario autenticado');

    const fullName = `${profileData.nombre || ''} ${profileData.apellido || ''}`.trim();
    
    await updateProfile(user, {
      displayName: fullName || null
    });
  }

  /**
   * @function loginWithGoogle
   * @description Inicia sesión con Google Authentication
   * @returns {Promise<UserCredential>}
   */
  async loginWithGoogle(): Promise<UserCredential> {
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
    
    return result;
  }

  /**
   * @function isGoogleUser
   * @description Verifica si el usuario actual es de Google
   * @returns {boolean}
   */
  isGoogleUser(): boolean {
    const user = this.firebaseAuth.currentUser;
    if (!user) return false;
    
    return user.providerData.some(provider => 
      provider.providerId === 'google.com'
    );
  }

  /**
   * @function getStoredUserId
   * @description Obtiene el UID almacenado en localStorage
   * @returns {string | null}
   */
  getStoredUserId(): string | null {
    return localStorage.getItem('userUID');
  }

  /**
   * @function getUserId
   * @description Obtiene el ID del usuario actual
   * @returns {string | null}
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * @function isAuthenticated
   * @description Verifica si hay un usuario autenticado
   * @returns {boolean}
   */
  isAuthenticated(): boolean {
    return this.firebaseAuth.currentUser !== null;
  }

  /**
   * @function getCurrentUserEmail
   * @description Obtiene el email del usuario actual
   * @returns {string | null}
   */
  getCurrentUserEmail(): string | null {
    return this.firebaseAuth.currentUser?.email || null;
  }
}
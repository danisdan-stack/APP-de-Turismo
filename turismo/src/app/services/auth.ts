import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  user,
  User,
  updateProfile,
  onAuthStateChanged,updateEmail
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

// 🔹 Define la interfaz UserProfile
export interface UserProfile {
  id: string;
  email: string;
 
  nombre?: string;
  apellido?: string;
  /*phoneNumber?: string;
  photoURL?: string;
  tourismInterest?: string;*/
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private firebaseAuth = inject(Auth);
  private userId: string | null = null; // 👈 NUEVO: variable interna para guardar el UID

  authState$: Observable<User | null> = user(this.firebaseAuth);

  constructor() {
    // 👇 Escucha cambios de sesión y guarda automáticamente el UID
    onAuthStateChanged(this.firebaseAuth, (user) => {
      if (user) {
        this.userId = user.uid;
        localStorage.setItem('userUID', user.uid); // 🔹 unificamos nombre de clave
        console.log('✅ UID guardado:', this.userId);
      } else {
        this.userId = null;
        localStorage.removeItem('userUID');
        console.log('ℹ️ Usuario desconectado');
      }
    });

    // Si hay un UID guardado en localStorage (tras recarga), lo restaura
    const storedId = localStorage.getItem('userUID');
    if (storedId) {
      this.userId = storedId;
    }
  }

  // 🔹 Función pública para obtener el UID cuando lo necesites
  getStoredUserId(): string | null {
    return localStorage.getItem('userUID');
  }

  // 🔹 También te dejo una forma rápida de acceder al UID actual en memoria
  getUserId(): string | null {
    return this.userId;
  }
  async updateAuthEmail(newEmail: string): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No user logged in');

    // 🚨 Firebase chequeará automáticamente si el email ya está en uso.
    // Si el email ya existe, esta llamada fallará con el código 'auth/email-already-in-use'.
    try {
        await updateEmail(user, newEmail);
        console.log(`✅ Email de autenticación actualizado a: ${newEmail}`);
    } catch (error) {
        // Propaga el error para que Tab3Page pueda manejarlo (por ejemplo, mostrar el toast)
        throw error; 
    }
}

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

      // 🔹 Guarda el UID también al hacer login manual
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

  async logout(): Promise<void> {
    try {
      await signOut(this.firebaseAuth);
      this.userId = null; // limpia el UID
      localStorage.removeItem('userUID');
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

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const user = this.firebaseAuth.currentUser;
    if (!user) return null;

    return {
      id: user.uid,
      email: user.email || '',

      nombre: user.displayName?.split(' ')[0] || '',
      apellido: user.displayName?.split(' ')[1] || ''
      /*phoneNumber: user.phoneNumber || '',
      photoURL: user.photoURL || '',
      tourismInterest: ''*/
    };
  }

  async updateUserProfile(profileData: {
    // La entrada de datos solo necesita los campos de nombre y apellido
    nombre?: string;
    apellido?: string;
  }): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('No user logged in');

    // 1. Construir el nombre completo usando 'nombre' y 'apellido'
    // Usamos || '' para asegurarnos de que no haya 'undefined' si el campo falta.
    const fullName = `${profileData.nombre || ''} ${profileData.apellido || ''}`.trim();
    
    // 2. Llamar a updateProfile para actualizar el displayName de Firebase Auth
    // Nota: El objeto debe contener al menos displayName o photoURL, 
    // por lo que solo incluimos displayName.
    await updateProfile(user, {
      // Si fullName está vacío, usamos null para limpiar o no actualizar si es posible
      displayName: fullName || null 
    });
}
}
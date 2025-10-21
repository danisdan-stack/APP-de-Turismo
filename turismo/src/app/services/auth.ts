import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  user,
  User
} from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private firebaseAuth = inject(Auth); // No change here, as this refers to the imported Auth type

  /**
   * 🔹 Observable del estado de autenticación
   */
  authState$: Observable<User | null> = user(this.firebaseAuth);

  /**
   * 🔹 Registrar nuevo usuario
   */
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

  /**
   * 🔹 Iniciar sesión con email y contraseña
   */
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

  /**
   * 🔹 Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      await signOut(this.firebaseAuth);
      console.log("👋 Sesión cerrada correctamente");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
    }
  }

  /**
   * 🔹 Obtener el estado de autenticación (para compatibilidad)
   */
  getAuthState() {
    return this.authState$;
  }

  /**
   * 🔹 Obtener usuario actual (opcional)
   */
  getCurrentUser(): User | null {
    return this.firebaseAuth.currentUser;
  }
}
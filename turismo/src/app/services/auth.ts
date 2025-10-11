import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  constructor(private angularFireAuth: AngularFireAuth) {}

  /**
   * 🔹 Registrar nuevo usuario
   */
  async register(email: string, password: string): Promise<any> {
    try {
      const result = await this.angularFireAuth.createUserWithEmailAndPassword(email, password);
      console.log("✅ Usuario registrado correctamente:", result.user?.email);
      return result;
    } catch (error: any) {
      console.error("❌ Error en el registro:", error);
      throw error; // se lanza para poder manejarlo desde el componente
    }
  }

  /**
   * 🔹 Iniciar sesión con email y contraseña
   */
  async login(email: string, password: string): Promise<any> {
    try {
      const result = await this.angularFireAuth.signInWithEmailAndPassword(email, password);
      console.log("✅ Sesión iniciada:", result.user?.email);
      return result;
    } catch (error: any) {
      console.error("❌ Error en el inicio de sesión:", error);
      throw error; // se lanza para poder mostrar mensajes personalizados
    }
  }

  /**
   * 🔹 Cerrar sesión
   */
  async logout(): Promise<void> {
    try {
      await this.angularFireAuth.signOut();
      console.log("👋 Sesión cerrada correctamente");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
    }
  }

  /**
   * 🔹 Obtener el estado de autenticación
   * (emite un observable con el usuario logueado o null)
   */
  getAuthState() {
    return this.angularFireAuth.authState;
  }
}



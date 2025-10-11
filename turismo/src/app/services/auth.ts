import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  constructor (private angularFireAuth: AngularFireAuth){}
  async register(email: string, password: string): Promise<any> {
    try {
      return await this.angularFireAuth.createUserWithEmailAndPassword(email, password);
    } catch (error) {
      // Manejar errores como 'email-already-in-use', 'weak-password', etc.
      console.error("Error en el registro:", error);
      return null;
    }
  }

  // 2. Método para el Inicio de Sesión
  async login(email: string, password: string): Promise<any> {
    try {
      return await this.angularFireAuth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error("Error en el inicio de sesión:", error);
      return null;
    }
  }

  // 3. Método para obtener el estado de autenticación (si hay un usuario logeado)
  getAuthState() {
    return this.angularFireAuth.authState;
  }
}


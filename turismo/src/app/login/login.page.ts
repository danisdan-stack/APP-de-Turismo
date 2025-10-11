import { Component, OnInit } from '@angular/core';

//
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Auth} from '../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone:false,
})
export class LoginPage {
  // Variables para capturar los datos de los inputs del HTML
  email: string = '';
  password: string = '';
  
  constructor(
    private authService: Auth, // Servicio para interactuar con Firebase Auth
    private router: Router,          // Servicio para navegar entre páginas
    public alertController:AlertController
  ) { }

  // --- FUNCIÓN DE INICIO DE SESIÓN (Botón 'Iniciar sesión') ---
   async iniciarSesion() {
    if (!this.email || !this.password) {
      this.showAlert('Error', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }
    
    try {
      const userCredential = await this.authService.login(this.email, this.password);
      if (userCredential) {
        // Éxito
        this.router.navigateByUrl('/tabs/tab1'); // Redirigir a la página principal (ajustar según tu ruta)
      }
    } catch (error: any) { 
      let errorMessage = 'Error desconocido al iniciar sesión.';
      
      // Manejo de errores específicos de LOGIN
      switch (error.code) {
          case 'auth/wrong-password':
              errorMessage = 'Contraseña incorrecta.';
              break;
          case 'auth/user-not-found':
          case 'auth/invalid-credential':
              errorMessage = 'Usuario no encontrado. Revisa tu email.';
              break;
          case 'auth/invalid-email':
              errorMessage = 'El formato del correo es inválido.';
              break;
          default:
              // Manejo de errores genéricos (ej: red, servidor)
              errorMessage = 'Fallo en la conexión. Inténtalo más tarde.';
              console.error("Firebase Error:", error);
              break;
      }
      this.showAlert('Acceso Denegado', errorMessage);
    }
  }

  // --- FUNCIÓN DE REGISTRO (Botón 'Registrarse') ---
  async registrarse() {
    if (!this.email || !this.password) {
      this.showAlert('Error', 'Por favor, ingresa email y contraseña para registrarte.');
      return;
    }

    try {
      const userCredential = await this.authService.register(this.email, this.password);
      if (userCredential) {
        this.showAlert('¡Registro Exitoso!', 'Bienvenido a TurisMatch. Te hemos iniciado sesión automáticamente.');
        this.router.navigateByUrl('/home');
      }
    } catch (error: any) {
      let errorMessage = 'Error desconocido al registrarse.';
      
      // Manejo de errores específicos de REGISTRO
      switch (error.code) {
          case 'auth/email-already-in-use':
              errorMessage = 'Este correo ya está registrado.';
              break;
          case 'auth/weak-password':
              errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
              break;
          case 'auth/invalid-email':
              errorMessage = 'El formato del correo es inválido.';
              break;
          default:
              errorMessage = 'Fallo en el registro. Inténtalo más tarde.';
              console.error("Firebase Error:", error);
              break;
      }
      this.showAlert('Fallo de Registro', errorMessage);
    }
  }
  
  // --- FUNCIÓN AUXILIAR PARA MOSTRAR LA ALERTA (Va dentro de la clase) ---
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
        header: header,
        message: message,
        buttons: ['OK']
    });

    await alert.present();
  }
}
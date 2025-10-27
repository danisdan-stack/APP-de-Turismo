import { Component, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth';
import { ProfileService } from 'src/app/services/perfil'; // ✅ AGREGAR

// ✅ API MODULAR
import { Auth as FirebaseAuth, sendPasswordResetEmail } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  // Variables para capturar los datos de los inputs del HTML
  email: string = '';
  password: string = '';
  
  // ✅ Inyectar Firebase Auth modular (con alias para evitar conflicto)
  private firebaseAuth = inject(FirebaseAuth);

  constructor(
    private authService: AuthService,
    private profileService: ProfileService, // ✅ AGREGAR
    private router: Router,
    public alertController: AlertController
  ) { }

  // --- NUEVO MÉTODO: LOGIN CON GOOGLE ---
  async continuarConGoogle() {
    try {
      // 1. Login/Registro con Google
      const result = await this.authService.loginWithGoogle();
      
      // 2. Verificar si es primera vez (si no existe perfil en Firestore)
      const perfilExistente = await this.profileService.getUserProfile(result.user.uid);
      
      if (!perfilExistente) {
        // 3. Crear perfil automáticamente
        await this.profileService.createUserProfileFromGoogle(result.user);
        this.showAlert('¡Bienvenido!', 'Tu cuenta de Google ha sido registrada exitosamente.');
      } else {
        this.showAlert('¡Bienvenido de vuelta!', 'Sesión iniciada con Google.');
      }
      
      // 4. Redirigir a inicio
      this.router.navigate(['/inicio']);
      
    } catch (error: any) {
      console.error('Error con Google Auth:', error);
      
      let errorMessage = 'Error al iniciar sesión con Google.';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'El inicio de sesión fue cancelado.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'El popup fue bloqueado. Permite popups para este sitio.';
      }
      
      this.showAlert('Error Google', errorMessage);
    }
  }

  // --- FUNCIÓN DE INICIO DE SESIÓN (Botón 'Iniciar sesión') ---
  async iniciarSesion() {
    if (!this.email || !this.password) {
      this.showAlert('Error', 'Por favor, ingresa tu correo y contraseña.');
      return;
    }
    
    try {
      const userCredential = await this.authService.login(this.email, this.password);
      if (userCredential) {
        const uid = userCredential.user.uid;
        localStorage.setItem('userUID', uid);
        this.router.navigateByUrl('/inicio');
        return userCredential;
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
  
  // --- FUNCIÓN AUXILIAR PARA MOSTRAR LA ALERTA (Unificado) ---
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
        header: header,
        message: message,
        buttons: ['OK']
    });

    await alert.present();
  }

  irARegistro() {
    this.router.navigate(['/register']);
  }

  /**
   * Muestra el cuadro de diálogo y maneja la lógica de recuperación de contraseña.
   */
  async forgotPassword() {
    const alert = await this.alertController.create({
      header: 'Recuperar Contraseña',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Introduce tu correo electrónico',
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Enviar',
          handler: (data) => {
            this.sendResetEmail(data.email);
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Envía el correo de restablecimiento usando Firebase Auth MODULAR.
   */
  async sendResetEmail(email: string) {
    if (!email) {
      this.showAlert('Error', 'Debes introducir un correo electrónico.');
      return;
    }

    try {
      // ✅ Usar la función modular con el Firebase Auth inyectado
      await sendPasswordResetEmail(this.firebaseAuth, email);
      this.showAlert('Éxito', 'Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña.');
    } catch (error: any) {
      let message = 'Ocurrió un error desconocido. Inténtalo de nuevo.';

      if (error.code === 'auth/user-not-found') {
        message = 'El correo electrónico no se encuentra registrado en nuestro sistema. Por favor, verifica el mail ingresado.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Formato de correo electrónico inválido.';
      }
      
      this.showAlert('Error', message);
    }
  }
}
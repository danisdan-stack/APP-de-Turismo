import { Component, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth';
import { ProfileService } from 'src/app/services/perfil';
import { Localizacion } from 'src/app/services/localizacion'; // ✅ IMPORTAR SERVICIO


import { Auth as FirebaseAuth, sendPasswordResetEmail } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone:false

})
export class LoginPage {

  email: string = '';
  password: string = '';
  loading: boolean = false;
  gpsHabilitado: boolean = true;
  
  // ✅ Inyectar Firebase Auth modular (con alias para evitar conflicto)
  private firebaseAuth = inject(FirebaseAuth);

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private localizacion: Localizacion, // ✅ INYECTAR SERVICIO LOCALIZACION
    private router: Router,
    public alertController: AlertController
  ) { 
    this.limpiarFormulario();
  }

  ngOnInit() {
    this.limpiarFormulario();
    this.cargarEstadoGPS();
  }

  ionViewWillEnter() {
    this.limpiarFormulario();
    this.cargarEstadoGPS();
  }

  // ✅ MODIFICADO: USAR SERVICIO LOCALIZACION
  cargarEstadoGPS() {
    this.gpsHabilitado = this.localizacion.estaGPSHabilitado();
    console.log('📍 Estado GPS cargado desde servicio:', this.gpsHabilitado);
  }
  probarEstadoGPS() {
  console.log('📍 Estado actual GPS:', this.gpsHabilitado);
  console.log('📍 localStorage GPS:', localStorage.getItem('gpsHabilitado'));
  console.log('📍 Servicio GPS:', this.localizacion.estaGPSHabilitado());
  
  // Cambiar estado manualmente para probar
  this.gpsHabilitado = !this.gpsHabilitado;
  localStorage.setItem('gpsHabilitado', JSON.stringify(this.gpsHabilitado));
  console.log('📍 Nuevo estado GPS:', this.gpsHabilitado);
}

  // ✅ MODIFICADO: USAR SERVICIO LOCALIZACION
  // ✅ VERSIÓN MEJORADA en LoginPage
async onGPSChange(event: any) {
  const habilitado = event.detail.checked;
  
  // Actualizar UI inmediatamente para feedback visual
  this.gpsHabilitado = habilitado;
  
  try {
    const exito = await this.localizacion.cambiarEstadoGPS(habilitado);
    
    if (habilitado) {
      if (exito) {
        console.log('📍 GPS habilitado correctamente');
        this.showAlert('GPS Activado', 'Ubicación habilitada correctamente');
      } else {
        // Si falló la activación, revertir el checkbox
        this.gpsHabilitado = false;
        this.showAlert(
          'GPS No Disponible', 
          'No se pudieron obtener los permisos de ubicación. Verifica que tengas los permisos habilitados en tu dispositivo.'
        );
      }
    } else {
      console.log('📍 GPS deshabilitado correctamente');
      // No mostrar alerta al desactivar para mejor UX
    }
  } catch (error) {
    console.error('Error cambiando estado GPS:', error);
    // Revertir en caso de error
    this.gpsHabilitado = !habilitado;
    this.showAlert('Error', 'Ocurrió un error al cambiar el estado del GPS');
  }
}

  // ❌ ELIMINADO: solicitarPermisosGPS() - YA LO MANEJA EL SERVICIO

  async continuarConGoogle() {
    if (this.loading) return;
    
    this.loading = true;
    try {
      const result = await this.authService.loginWithGoogle();
      
      const perfilExistente = await this.profileService.getUserProfile(result.user.uid);
      
      if (!perfilExistente) {
        await this.profileService.createUserProfileFromGoogle(result.user);
        this.showAlert('¡Bienvenido!', 'Tu cuenta de Google ha sido registrada exitosamente.');
      } else {
        this.showAlert('¡Bienvenido de vuelta!', 'Sesión iniciada con Google.');
      }
      
      this.router.navigate(['/inicio']);
      
    } catch (error: any) {
      console.error('Error con Google Auth:', error);
      
      let errorMessage = 'Error al iniciar sesión con Google.';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'El inicio de sesión fue cancelado.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'El popup fue bloqueado. Permite popups para este sitio.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Error de conexión. Verifica tu internet.';
      }
      
      this.showAlert('Error Google', errorMessage);
    } finally {
      this.loading = false;
    }
  }
  /**
   * @function
   * @description
   * @returns 
   */


  async iniciarSesion() {
    if (this.loading) return;
    
    if (!this.email || !this.password) {
      this.showAlert('Campos requeridos', 'Por favor ingresa email y contraseña');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.showAlert('Email inválido', 'Por favor ingresa un email válido');
      return;
    }

    this.loading = true;
    
    try {
      await this.authService.login(this.email, this.password);
      this.showAlert('¡Bienvenido!', 'Sesión iniciada correctamente');
      
      this.limpiarFormulario();
      this.router.navigate(['/inicio']);
      
    } catch (error: any) {
      console.error('Error en login:', error);
      
      let errorMessage = 'No se pudo iniciar sesión. ';
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          errorMessage += 'Email o contraseña incorrectos.';
          this.password = '';
          break;
          
        case 'auth/user-not-found':
          errorMessage += 'No existe una cuenta con este email.';
          break;
          
        case 'auth/user-disabled':
          errorMessage += 'Esta cuenta ha sido deshabilitada.';
          break;
          
        case 'auth/too-many-requests':
          errorMessage += 'Demasiados intentos fallidos. Intenta más tarde o restablece tu contraseña.';
          this.password = '';
          break;
          
        case 'auth/network-request-failed':
          errorMessage += 'Error de conexión. Verifica tu internet.';
          break;
          
        case 'auth/invalid-email':
          errorMessage += 'El formato del email no es válido.';
          break;
          
        case 'auth/operation-not-allowed':
          errorMessage += 'El inicio de sesión con email/contraseña no está habilitado.';
          break;
          
        default:
          errorMessage += 'Error desconocido. Intenta nuevamente.';
          break;
      }
      
      this.showAlert('Error al iniciar sesión', errorMessage);
      
    } finally {
      this.loading = false;
    }
  }

  async registrarse() {
    if (this.loading) return;
    
    if (!this.email || !this.password) {
      this.showAlert('Campos requeridos', 'Por favor, ingresa email y contraseña para registrarte.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.showAlert('Email inválido', 'Por favor ingresa un email válido');
      return;
    }

    if (this.password.length < 6) {
      this.showAlert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    this.loading = true;

    try {
      const userCredential = await this.authService.register(this.email, this.password);
      if (userCredential) {
        this.showAlert('¡Registro Exitoso!', 'Bienvenido a TurisMatch. Te hemos iniciado sesión automáticamente.');
        
        this.limpiarFormulario();
        this.router.navigate(['/tabs']);
      }
    } catch (error: any) {
      console.error('Error en registro:', error);
      
      let errorMessage = 'Error al registrarse. ';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage += 'Este correo ya está registrado. ¿Quieres iniciar sesión?';
          break;
          
        case 'auth/weak-password':
          errorMessage += 'La contraseña debe tener al menos 6 caracteres.';
          break;
          
        case 'auth/invalid-email':
          errorMessage += 'El formato del correo es inválido.';
          break;
          
        case 'auth/operation-not-allowed':
          errorMessage += 'El registro con email/contraseña no está habilitado.';
          break;
          
        case 'auth/network-request-failed':
          errorMessage += 'Error de conexión. Verifica tu internet.';
          break;
          
        default:
          errorMessage += 'Error desconocido. Intenta nuevamente.';
          break;
      }
      
      this.showAlert('Fallo de Registro', errorMessage);
      
    } finally {
      this.loading = false;
    }
  }

  /**
    * @function
    * @description 
   */
  
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  async showAlertWithOptions(header: string, message: string, buttons: any[]) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: buttons
    });

    await alert.present();
  }
  /**
    * @function
    * @description
   */
  irARegistro() {
    this.router.navigate(['/register']);
  }

  /**
    * @function
    * @description
   */
  async forgotPassword() {
    const alert = await this.alertController.create({
      header: 'Recuperar Contraseña',
      inputs: [
        {
          name: 'email',
          type: 'email',
          placeholder: 'Introduce tu correo electrónico',
          value: this.email
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
    * @function
    * @description
   */
  async sendResetEmail(email: string) {
    if (!email) {
      this.showAlert('Error', 'Debes introducir un correo electrónico.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showAlert('Email inválido', 'Por favor ingresa un email válido');
      return;
    }

    try {

      await sendPasswordResetEmail(this.firebaseAuth, email);
      this.showAlert('Éxito', 'Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña.');
    } catch (error: any) {
      let message = 'Ocurrió un error desconocido. Inténtalo de nuevo.';

      if (error.code === 'auth/user-not-found') {
        message = 'El correo electrónico no se encuentra registrado en nuestro sistema. Por favor, verifica el mail ingresado.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Formato de correo electrónico inválido.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Error de conexión. Verifica tu internet.';
      }

      this.showAlert('Error', message);
    }
  }


  passwordVisible: boolean = false;
  /**
   * @function
   * @description
   */
  togglePassword() {
    this.passwordVisible = !this.passwordVisible;
  }

  limpiarFormulario() {
    this.email = '';
    this.password = '';
    console.log('✅ Formulario de login limpiado');
  }

  onKeyPress(event: any) {
    if (event.key === 'Enter') {
      this.iniciarSesion();
    }
  }
}
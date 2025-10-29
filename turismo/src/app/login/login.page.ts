import { Component, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth';
import { ProfileService } from 'src/app/services/perfil';
import { Localizacion } from 'src/app/services/localizacion';
import { Auth as FirebaseAuth, sendPasswordResetEmail } from '@angular/fire/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  gpsHabilitado: boolean = true;
  passwordVisible: boolean = false;

  private firebaseAuth = inject(FirebaseAuth);

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private localizacion: Localizacion,
    private router: Router,
    public alertController: AlertController
  ) {
    this.limpiarFormulario();
  }

  /**
   * @function ngOnInit
   * @description Inicializa el componente y carga el estado del GPS
   * @returns {void}
   */
  ngOnInit(): void {
    this.limpiarFormulario();
    this.cargarEstadoGPS();
  }

  /**
   * @function ionViewWillEnter
   * @description Se ejecuta antes de que la vista se muestre
   * @returns {void}
   */
  ionViewWillEnter(): void {
    this.limpiarFormulario();
    this.cargarEstadoGPS();
  }

  /**
   * @function cargarEstadoGPS
   * @description Carga el estado actual del GPS desde el servicio
   * @returns {void}
   */
  cargarEstadoGPS(): void {
    this.gpsHabilitado = this.localizacion.estaGPSHabilitado();
  }

  /**
   * @function onGPSChange
   * @description Maneja el cambio de estado del GPS
   * @param {any} event - Evento del toggle
   * @returns {Promise<void>}
   */
  async onGPSChange(event: any): Promise<void> {
    const habilitado = event.detail.checked;
    this.gpsHabilitado = habilitado;

    try {
      const exito = await this.localizacion.cambiarEstadoGPS(habilitado);

      if (habilitado) {
        if (exito) {
          this.showAlert('GPS Activado', 'Ubicación habilitada correctamente');
        } else {
          this.gpsHabilitado = false;
          this.showAlert(
            'GPS No Disponible',
            'No se pudieron obtener los permisos de ubicación. Verifica que tengas los permisos habilitados en tu dispositivo.'
          );
        }
      }
    } catch (error) {
      this.gpsHabilitado = !habilitado;
      this.showAlert('Error', 'Ocurrió un error al cambiar el estado del GPS');
    }
  }

  /**
   * @function continuarConGoogle
   * @description Inicia sesión con Google Authentication
   * @returns {Promise<void>}
   */
  async continuarConGoogle(): Promise<void> {
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
   * @function iniciarSesion
   * @description Inicia sesión con email y contraseña
   * @returns {Promise<void>}
   */
  async iniciarSesion(): Promise<void> {
    if (this.loading) return;

    if (!this.email || !this.password) {
      if (!this.email && !this.password) {
        this.showAlert('Campos requeridos', 'Por favor ingresa email y contraseña');
        return;
      }
      
      if (!this.email) {
        this.showAlert('Email requerido', 'Por favor ingresa tu email');
        return;
      }
      
      if (!this.password) {
        this.showAlert('Contraseña requerida', 'Por favor ingresa tu contraseña');
        return;
      }
    }

    this.email = this.email.trim();

    if (!this.email.includes('@')) {
      this.showAlert('Email inválido', 'El email debe contener @ (ejemplo: usuario@dominio.com)');
      return;
    }

    const parts = this.email.split('@');
    if (parts.length < 2 || !parts[1].includes('.')) {
      this.showAlert('Email inválido', 'El email debe tener un dominio válido (ejemplo: usuario@dominio.com)');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.email)) {
      this.showAlert('Email inválido', 'Por favor ingresa un email válido:\n• usuario@ejemplo.com\n• nombre.apellido@empresa.com.mx');
      return;
    }

    this.loading = true;

    try {
      await this.authService.login(this.email, this.password);
      this.showAlert('¡Bienvenido!', 'Sesión iniciada correctamente');
      this.limpiarFormulario();
      this.router.navigate(['/inicio']);

    } catch (error: any) {
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

  /**
   * @function registrarse
   * @description Registra un nuevo usuario con email y contraseña
   * @returns {Promise<void>}
   */
  async registrarse(): Promise<void> {
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
   * @function showAlert
   * @description Muestra un cuadro de diálogo de alerta
   * @param {string} header - Encabezado de la alerta
   * @param {string} message - Mensaje de la alerta
   * @returns {Promise<void>}
   */
  async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  /**
   * @function showAlertWithOptions
   * @description Muestra una alerta con botones personalizados
   * @param {string} header - Encabezado de la alerta
   * @param {string} message - Mensaje de la alerta
   * @param {any[]} buttons - Array de botones personalizados
   * @returns {Promise<void>}
   */
  async showAlertWithOptions(header: string, message: string, buttons: any[]): Promise<void> {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: buttons
    });

    await alert.present();
  }

  /**
   * @function irARegistro
   * @description Navega a la página de registro
   * @returns {void}
   */
  irARegistro(): void {
    this.router.navigate(['/register']);
  }

  /**
   * @function forgotPassword
   * @description Muestra un diálogo para recuperar contraseña
   * @returns {Promise<void>}
   */
  async forgotPassword(): Promise<void> {
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
   * @function sendResetEmail
   * @description Envía un email para restablecer la contraseña
   * @param {string} email - Email del usuario
   * @returns {Promise<void>}
   */
  async sendResetEmail(email: string): Promise<void> {
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

  /**
   * @function togglePassword
   * @description Alterna la visibilidad de la contraseña
   * @returns {void}
   */
  togglePassword(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  /**
   * @function limpiarFormulario
   * @description Limpia los campos del formulario
   * @returns {void}
   */
  limpiarFormulario(): void {
    this.email = '';
    this.password = '';
  }

  /**
   * @function onKeyPress
   * @description Maneja el evento de tecla presionada
   * @param {any} event - Evento del teclado
   * @returns {void}
   */
  onKeyPress(event: any): void {
    if (event.key === 'Enter') {
      this.iniciarSesion();
    }
  }
}
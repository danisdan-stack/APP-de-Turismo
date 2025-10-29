import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth';
import { DataService, UserProfile } from 'src/app/services/datas'; 

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {
  
  nombre = ''; 
  apellido = ''; 
  telefono = ''; 
  email = '';
  password = '';
  confirmPassword = '';
  
  loading = false;
  
  passwordRequirements = {
    minLength: false,
    hasUpperCase: false,
    hasNumber: false
  };

  constructor(
    private authService: AuthService, 
    private dataService: DataService, 
    private router: Router,
    private alertController: AlertController
  ) { }

  ngOnInit() {}

  /**
   * @function volverAlLogin
   * @description Navega de vuelta a la página de login
   */
  volverAlLogin(): void {
    this.router.navigate(['']);
  }

  /**
   * @function validarRegistro
   * @description Realiza validación completa del formulario de registro
   * @returns {Object} Objeto con estado de validación y mensaje de error si aplica
   */
  validarRegistro(): { valido: boolean, mensaje?: string } {
    const campos = [
      { valor: this.nombre, nombre: 'Nombre' },
      { valor: this.apellido, nombre: 'Apellido' },
      { valor: this.telefono, nombre: 'Teléfono' },
      { valor: this.email, nombre: 'Email' },
      { valor: this.password, nombre: 'Contraseña' },
      { valor: this.confirmPassword, nombre: 'Confirmar contraseña' }
    ];

    const camposVacios = campos.filter(campo => !campo.valor || String(campo.valor).trim() === '');
    
    if (camposVacios.length > 0) {
      const camposTexto = camposVacios.map(c => c.nombre).join('\n• ');
      return {
        valido: false,
        mensaje: `Completa los siguientes campos:\n\n• ${camposTexto}`
      };
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.email.trim())) {
      return {
        valido: false,
        mensaje: 'Ingresa un email válido:\n\nEjemplo: usuario@ejemplo.com'
      };
    }

    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nombreRegex.test(this.nombre.trim())) {
      return {
        valido: false,
        mensaje: 'Nombre inválido:\n\n• Solo letras y espacios\n• Sin números ni caracteres especiales'
      };
    }

    if (!nombreRegex.test(this.apellido.trim())) {
      return {
        valido: false,
        mensaje: 'Apellido inválido:\n\n• Solo letras y espacios\n• Sin números ni caracteres especiales'
      };
    }

    const telefonoRegex = /^[0-9]+$/;
    if (!telefonoRegex.test(this.telefono.trim())) {
      return {
        valido: false,
        mensaje: 'Teléfono inválido:\n\n• Solo números (0-9)\n• Sin letras ni caracteres especiales'
      };
    }

    if (this.telefono.trim().length < 8) {
      return {
        valido: false,
        mensaje: 'Teléfono muy corto:\n\nDebe tener al menos 8 dígitos'
      };
    }

    const passwordValidation = this.validarPasswordSegura();
    if (!passwordValidation.valida) {
      return {
        valido: false,
        mensaje: `Contraseña insegura:\n\n${passwordValidation.mensaje}`
      };
    }

    if (this.password !== this.confirmPassword) {
      return {
        valido: false,
        mensaje: 'Las contraseñas no coinciden\n\nVerifica que sean iguales en ambos campos'
      };
    }

    return { valido: true };
  }

  /**
   * @function validarPasswordSegura
   * @description Valida que la contraseña cumpla con los requisitos de seguridad
   * @returns {Object} Objeto con estado de validación y mensaje de error si aplica
   */
  validarPasswordSegura(): { valida: boolean, mensaje: string } {
    const requisitos = [
      { 
        cumple: this.password.length >= 6, 
        mensaje: '• Al menos 6 caracteres' 
      },
      { 
        cumple: /[A-Z]/.test(this.password), 
        mensaje: '• Al menos una letra mayúscula' 
      },
      { 
        cumple: /[0-9]/.test(this.password), 
        mensaje: '• Al menos un número' 
      }
    ];

    const requisitosFaltantes = requisitos.filter(req => !req.cumple);
    
    if (requisitosFaltantes.length > 0) {
      const mensajeRequisitos = requisitosFaltantes.map(req => req.mensaje).join('\n');
      return {
        valida: false,
        mensaje: `Tu contraseña debe contener:\n${mensajeRequisitos}`
      };
    }

    return { valida: true, mensaje: '' };
  }

  /**
   * @function onPasswordInput
   * @description Actualiza el estado de los requisitos de contraseña en tiempo real
   * @param {any} event - Evento del input
   */
  onPasswordInput(event: any): void {
    this.password = event.target.value;
    this.actualizarRequisitosPassword();
  }

  /**
   * @function actualizarRequisitosPassword
   * @description Actualiza el estado de los requisitos de contraseña
   */
  actualizarRequisitosPassword(): void {
    this.passwordRequirements = {
      minLength: this.password.length >= 6,
      hasUpperCase: /[A-Z]/.test(this.password),
      hasNumber: /[0-9]/.test(this.password)
    };
  }

  /**
   * @function onNombreInput
   * @description Filtra y limpia el input de nombre en tiempo real
   * @param {any} event - Evento del input
   */
  onNombreInput(event: any): void {
    const input = event.target as HTMLInputElement;
    const valorLimpio = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    this.nombre = valorLimpio;
    input.value = valorLimpio;
  }

  /**
   * @function onApellidoInput
   * @description Filtra y limpia el input de apellido en tiempo real
   * @param {any} event - Evento del input
   */
  onApellidoInput(event: any): void {
    const input = event.target as HTMLInputElement;
    const valorLimpio = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    this.apellido = valorLimpio;
    input.value = valorLimpio;
  }

  /**
   * @function onTelefonoInput
   * @description Filtra y limpia el input de teléfono en tiempo real
   * @param {any} event - Evento del input
   */
  onTelefonoInput(event: any): void {
    const input = event.target as HTMLInputElement;
    const valorLimpio = input.value.replace(/[^0-9]/g, '');
    this.telefono = valorLimpio;
    input.value = valorLimpio;
  }

  /**
   * @function onRegister
   * @description Procesa el registro del usuario
   */
  async onRegister(): Promise<void> {
    const validacion = this.validarRegistro();
    
    if (!validacion.valido) {
      this.showAlert('Completa el formulario', validacion.mensaje!);
      return;
    }

    this.loading = true;
    
    try {
      const userCredential = await this.authService.register(this.email, this.password);

      if (userCredential && userCredential.user) {
        const userId = userCredential.user.uid;
        
        const initialUserData: UserProfile = {
          email: this.email.trim(),
          nombre: this.nombre.trim(),
          apellido: this.apellido.trim(),
          telefono: this.telefono.trim(),
          id: userId,
        };
        
        await this.dataService.saveUserProfile(userId, initialUserData);
        
        try {
          await this.authService.updateUserProfile({
            nombre: this.nombre.trim(),
            apellido: this.apellido.trim()
          });
        } catch (profileError) {
        }
        
        this.showAlert('¡Registro Exitoso!', `Bienvenido ${this.nombre}.`);
        this.router.navigate(['/inicio']);
      }

    } catch (e: any) {
      let errorMessage = 'Fallo al registrar. Inténtalo de nuevo.';
      
      switch (e.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este correo ya está registrado.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo es inválido.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Error de conexión. Verifica tu internet.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Intenta más tarde.';
          break;
        default:
          errorMessage = 'Error inesperado. Intenta nuevamente.';
          break;
      }
      this.showAlert('Error de Registro', errorMessage);
    } finally {
      this.loading = false;
    }
  }

  /**
   * @function showAlert
   * @description Muestra un cuadro de diálogo de alerta
   * @param {string} header - Encabezado de la alerta
   * @param {string} message - Mensaje de la alerta
   */
  async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
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
  
  // Campos del formulario
  nombre = ''; 
  apellido = ''; 
  telefono = ''; 
  email = '';
  password = '';
  confirmPassword = '';
  
  loading = false;
  
  // ✅ Para mostrar requisitos de contraseña en tiempo real
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

  volverAlLogin() {
    this.router.navigate(['']);
  }

  /**
   * VALIDACIÓN COMPLETA DEL FORMULARIO
   * Retorna objeto con estado y mensaje de error si aplica
   */
  validarRegistro(): { valido: boolean, mensaje?: string } {
    // 1. Validar campos vacíos
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

    // 2. Validar formato de email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this.email.trim())) {
      return {
        valido: false,
        mensaje: 'Ingresa un email válido:\n\nEjemplo: usuario@ejemplo.com'
      };
    }

    // 3. Validar NOMBRE (solo letras y espacios)
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!nombreRegex.test(this.nombre.trim())) {
      return {
        valido: false,
        mensaje: 'Nombre inválido:\n\n• Solo letras y espacios\n• Sin números ni caracteres especiales'
      };
    }

    // 4. Validar APELLIDO (solo letras y espacios)
    if (!nombreRegex.test(this.apellido.trim())) {
      return {
        valido: false,
        mensaje: 'Apellido inválido:\n\n• Solo letras y espacios\n• Sin números ni caracteres especiales'
      };
    }

    // 5. Validar TELÉFONO (solo números)
    const telefonoRegex = /^[0-9]+$/;
    if (!telefonoRegex.test(this.telefono.trim())) {
      return {
        valido: false,
        mensaje: 'Teléfono inválido:\n\n• Solo números (0-9)\n• Sin letras ni caracteres especiales'
      };
    }

    // 6. Validar longitud mínima del teléfono
    if (this.telefono.trim().length < 7) {
      return {
        valido: false,
        mensaje: 'Teléfono muy corto:\n\nDebe tener al menos 8 dígitos'
      };
    }

    // 7. Validar CONTRASEÑA SEGURA
    const passwordValidation = this.validarPasswordSegura();
    if (!passwordValidation.valida) {
      return {
        valido: false,
        mensaje: `Contraseña insegura:\n\n${passwordValidation.mensaje}`
      };
    }

    // 8. Validar que las contraseñas coincidan
    if (this.password !== this.confirmPassword) {
      return {
        valido: false,
        mensaje: 'Las contraseñas no coinciden\n\nVerifica que sean iguales en ambos campos'
      };
    }

    return { valido: true };
  }

  /**
   * VALIDACIÓN DE CONTRASEÑA SEGURA
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
   * ACTUALIZAR ESTADO DE REQUISITOS EN TIEMPO REAL
   */
  onPasswordInput(event: any) {
    this.password = event.target.value;
    this.actualizarRequisitosPassword();
  }

  actualizarRequisitosPassword() {
    this.passwordRequirements = {
      minLength: this.password.length >= 6,
      hasUpperCase: /[A-Z]/.test(this.password),
      hasNumber: /[0-9]/.test(this.password)
    };
  }

  /**
   * MÉTODOS PARA VALIDACIÓN EN TIEMPO REAL - VERSIÓN CORREGIDA
   */
  onNombreInput(event: any) {
    const input = event.target as HTMLInputElement;
    const valorLimpio = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    
    // Forzar la actualización del input
    this.nombre = valorLimpio;
    input.value = valorLimpio;
    
    //console.log('Nombre actualizado:', this.nombre);
  }

  onApellidoInput(event: any) {
    const input = event.target as HTMLInputElement;
    const valorLimpio = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    
    // Forzar la actualización del input
    this.apellido = valorLimpio;
    input.value = valorLimpio;
    
    //console.log('Apellido actualizado:', this.apellido);
  }

  onTelefonoInput(event: any) {
    const input = event.target as HTMLInputElement;
    const valorLimpio = input.value.replace(/[^0-9]/g, '');
    
    // Forzar la actualización del input
    this.telefono = valorLimpio;
    input.value = valorLimpio;
    
    //console.log('Teléfono actualizado:', this.telefono);
  }

  async onRegister() {
    // ✅ VALIDACIÓN MEJORADA
    const validacion = this.validarRegistro();
    
    if (!validacion.valido) {
      this.showAlert('Completa el formulario', validacion.mensaje!);
      return;
    }

    // ✅ ACTIVAR LOADING
    this.loading = true;
    
    try {
      // --- PASO 1: REGISTRO EN FIREBASE AUTH ---
      const userCredential = await this.authService.register(this.email, this.password);

      if (userCredential && userCredential.user) {
        
        const userId = userCredential.user.uid; 
        console.log('✅ Usuario autenticado con UID:', userId);
        
        // --- PASO 2: PREPARAR DATOS PARA FIRESTORE ---
        const initialUserData: UserProfile = {
          email: this.email.trim(),
          nombre: this.nombre.trim(),
          apellido: this.apellido.trim(),
          telefono: this.telefono.trim(),
          id: userId,
        };
        
        // --- PASO 3: GUARDAR EL PERFIL EN FIRESTORE ---
        await this.dataService.saveUserProfile(userId, initialUserData); 
        
        // --- PASO 4: ACTUALIZAR PERFIL EN AUTH ---
        try {
          await this.authService.updateUserProfile({
            nombre: this.nombre.trim(),
            apellido: this.apellido.trim()
          });
          console.log('✅ Perfil de Auth actualizado');
        } catch (profileError) {
          console.warn('⚠️ No se pudo actualizar perfil de Auth:', profileError);
        }
        
        // --- PASO 5: ÉXITO Y REDIRECCIÓN ---
        this.showAlert('¡Registro Exitoso!', `Bienvenido ${this.nombre}.`);
        this.router.navigate(['/inicio']);
        
      }

    } catch (e: any) {
      let errorMessage = 'Fallo al registrar. Inténtalo de nuevo.';
      
      // Manejo de errores de Firebase Auth
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
          console.error('❌ Fallo al registrar:', e);
          errorMessage = 'Error inesperado. Intenta nuevamente.';
          break;
      }
      this.showAlert('Error de Registro', errorMessage);
    } finally {
      // ✅ DESACTIVAR LOADING SIEMPRE
      this.loading = false;
    }
  }

  /**
   * Muestra un cuadro de diálogo de alerta
   */
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
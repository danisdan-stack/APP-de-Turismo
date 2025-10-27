import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
// Asegúrate de que las rutas sean correctas
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
  
  // No necesitamos 'id' aquí, ya que se toma del UID de Firebase
  // id: string | null = null; 

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

  async onRegister() {
    
    // 1. VALIDACIÓN SIMPLE Y UNIFICADA: Chequea campos vacíos y coincidencia de contraseñas
    const camposRequeridos = [this.nombre, this.apellido, this.telefono, this.email, this.password, this.confirmPassword];
    
    // Chequeo de campos vacíos
    const camposVacios = camposRequeridos.some(campo => !campo || String(campo).trim() === '');
    
    if (camposVacios) {
      this.showAlert('Error de Registro', 'Por favor, completa todos los campos.');
      return;
    }

    // Chequeo de contraseñas
    if (this.password !== this.confirmPassword) {
      this.showAlert('Error de Contraseña', 'Las contraseñas no coinciden.');
      return;
    }
    
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
          // Se usa el UID de Firebase como ID principal del documento
          id: userId, 


        };
        
        // --- PASO 3: GUARDAR EL PERFIL EN FIRESTORE ---
        // Se usa el UID como clave del documento para asegurar unicidad
        await this.dataService.saveUserProfile(userId, initialUserData); 
        
        // --- PASO 4: ÉXITO Y REDIRECCIÓN ---
        this.showAlert('¡Registro Exitoso!', `Bienvenido ${this.nombre}.`);
        this.router.navigate(['/inicio']);
        
      }

    } catch (e: any) {
      let errorMessage = 'Fallo al registrar. Inténtalo de nuevo.';
      
      // Manejo de errores de Firebase Auth (más conciso)
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
        default:
          console.error('❌ Fallo al registrar:', e);
          break;
      }
      this.showAlert('Error de Autenticación', errorMessage);
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
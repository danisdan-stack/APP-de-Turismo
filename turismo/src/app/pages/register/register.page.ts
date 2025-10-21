import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular'; // Necesario para mostrar mensajes de forma amigable
import {Auth} from 'src/app/services/auth'
// ******* CORRECCIÓN DE IMPORTACIÓN Y TIPO *******
import { DataService, UserProfile } from 'src/app/services/data'; // Importa el Servicio y la Interfaz

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage implements OnInit {
  
  // Campos del formulario (coinciden con tu HTML y tu tabla)
  nombre = ''; 
  apellido = ''; 
  telefono = ''; 
  email = '';
  password = '';
  confirmPassword = '';
  // Campos adicionales de tu tabla de Firestore (de la imagen anterior)
  edad: number | null = null; 
  id: number | null = null; // NOTA: Este campo se usará para el ID interno, pero el UID será la clave principal.

  // Inyectamos todos los servicios necesarios
  constructor(
    private authService: Auth, 
    private dataService: DataService, // Servicio para guardar en Firestore
    private router: Router,
    private alertController: AlertController // Para las alertas de error/éxito
  ) { }

  ngOnInit() {}

  async onRegister() {
    // ******* INICIO DE LA VALIDACIÓN CORREGIDA (Líneas 59-70) *******
    // 1. VALIDACIÓN BÁSICA DE CAMPOS
    // Se utiliza String() para convertir cualquier valor (incluyendo null o 0) a su representación de cadena
    // y luego se usa .trim() para chequear que no solo sean espacios vacíos.
    if (
        String(this.nombre).trim() === '' || 
        String(this.apellido).trim() === '' || 
        String(this.telefono).trim() === '' || 
        String(this.email).trim() === '' ||
        String(this.password).trim() === '' ||
        String(this.confirmPassword).trim() === ''
        //this.edad === null // Chequea específicamente si edad es null
    ) {
        this.showAlert('Error de Registro', 'Por favor, completa todos los campos.');
        return;
    }
    
    // 3. VALIDACIÓN DE EDAD (La moví para después de la validación de campos vacíos)
    /*const edadNumero = Number(this.edad); // Aseguramos que sea un número para la validación

    if (isNaN(edadNumero) || edadNumero < 1 || edadNumero > 120) {
        this.showAlert('Error de Datos', 'Por favor, introduce una edad válida.');
        return;
    }

    // 2. VALIDACIÓN DE COINCIDENCIA DE CONTRASEÑAS (Mantenida)
    if (this.password !== this.confirmPassword) {
        this.showAlert('Error de Contraseña', 'Las contraseñas no coinciden.');
        return;
    }*/
    // ******* FIN DE LA VALIDACIÓN CORREGIDA *******
    
    try {
      // --- PASO A: REGISTRO EN FIREBASE AUTH ---
      const userCredential = await this.authService.register(this.email, this.password);

      if (userCredential && userCredential.user) {
        // --- PASO B: OBTENER EL UID SEGURO ---
        const userId = userCredential.user.uid; 
        console.log('✅ Usuario autenticado con UID:', userId);
        
        // --- PASO C: PREPARAR LOS DATOS PARA FIRESTORE (SIN CONTRASEÑA) ---
        // ******* CORRECCIÓN DEL TIPO: AHORA USA LA INTERFAZ UserProfile *******
        const initialUserData: UserProfile = {
          // Datos principales de tu tabla 'usuario'
          email: this.email,
          nombre: this.nombre,
          apellido: this.apellido,
          telefono: this.telefono,
          // Usamos la variable local edadNumero validada
          //edad: edadNumero, 
          id: 1, 
          
          // Campos de control

          // Esto es ahora un literal de tipo correcto
   
        };
        
        // --- PASO D: GUARDAR EL PERFIL EN FIRESTORE ---
        await this.dataService.saveUserProfile(userId, initialUserData); 
        
        // --- PASO E: ÉXITO Y REDIRECCIÓN ---
        this.showAlert('¡Registro Exitoso!', `Bienvenido ${this.nombre}.`);
        this.router.navigate(['/filtros']);
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

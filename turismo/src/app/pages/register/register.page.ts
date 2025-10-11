import { Component } from '@angular/core';
import { Auth } from '../../services/auth'; 

@Component({ 
  selector: 'app-registro', // El selector que se va a usar en otras páginas
  templateUrl: './register.page.html', // Indica  HTML
  styleUrls: ['./register.page.scss'], // Indica  CSS
  standalone:false
 })
export class RegisterPage  {
  // 1. Variables para almacenar los datos del formulario
  nombre = ''; 
  apellido = ''; 
  telefono = ''; 
  email = '';
  password = '';
  confirmPassword = '';

  constructor(private authService: Auth) { } // 2. Inyectas el servicio

  async onRegister() {
    try {
      // 3. Llama a la lógica de tu compañero
      await this.authService.register(this.email, this.password);
      // Éxito: Navegar al login o a la página principal
      console.log('Registro exitoso!');
      // TODO: Aquí deberías navegar a otra página usando el Router
    } catch (e: any) {
      // 4. Muestra el error de Firebase al usuario
      console.error('Fallo al registrar:', e.message);
      // TODO: Mostrar una alerta de Ionic con el mensaje de error (e.message)
    }
  }
}
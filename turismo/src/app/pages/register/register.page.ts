import { Component } from '@angular/core';
import { Auth } from '../../services/auth';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-registro', // El selector que se va a usar en otras páginas
  templateUrl: './register.page.html', // Indica  HTML
  styleUrls: ['./register.page.scss'], // Indica  CSS
  standalone: false
})
export class RegisterPage {
  // 1. Variables para almacenar los datos del formulario
  nombre = '';
  apellido = '';
  telefono = '';
  email = '';
  password = '';
  confirmPassword = '';
  router: any;

  constructor(private authService: Auth, private controladorAlerta: AlertController) { } // 2. Inyectas el servicio

  async onRegister() {
    try {
      // 3. Llama a la lógica de tu compañero
      await this.authService.register(this.email, this.password);// Éxito: Navegar al login o a la página principal
      console.log('Registro exitoso!');
      // TODO: Aquí deberías navegar a otra página usando el Router
    } catch (e: any) {
      // 4. Muestra el error de Firebase al usuario
      console.error('Fallo al registrar:', e.message);
      // TODO: Mostrar una alerta de Ionic con el mensaje de error (e.message)
    }
    if (this.password !== this.confirmPassword) { //Verificamos que las contraseñas coincidan
      await this.showAlert('Error', 'Las contraseñas ingresadas no coinciden.');
      return;
    }

    //Aca hacemos la verificacion de la contraseña para que sea más segura
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(this.password)) {
      await this.showAlert(
        'Contraseña Débil',
        'La contraseña debe tener al menos 6 caracteres, incluir una letra mayúscula (A-Z) y al menos un número (0-9).'
      );
      return;
    }
    if (!this.nombre || !this.apellido || !this.telefono || !this.email || !this.password || !this.confirmPassword) {
      this.showAlert('Error', 'Debes completar todos los campos del formulario para registrarte.');  
      return; 
    }
  }

  //Funcion que muestra alerta
  async showAlert(header: string, message: string) {
    const alert = await this.controladorAlerta.create({ // Usando la instancia inyectada
      header: header,
      message: message,
      buttons: ['Aceptar']
    });
    await alert.present();
  }
  irARegistro() {
    // Esto es para que el boton de registro nos redireccione a la pagina
    this.router.navigate(['/register']); 

}
}
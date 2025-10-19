import { Component, OnInit } from '@angular/core';
import { Auth } from '../../services/auth';

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

  
  constructor(private authService: Auth) { }

    ngOnInit() {}

  
  async onRegister() {
    try {
      
      if (this.password !== this.confirmPassword) {
        console.error('Las contraseñas no coinciden');
        return;
      }
      await this.authService.register(this.email, this.password);

      console.log('✅ Registro exitoso!');

    } catch (e: any) {
      console.error('❌ Fallo al registrar:', e.message);
    }
  }
}

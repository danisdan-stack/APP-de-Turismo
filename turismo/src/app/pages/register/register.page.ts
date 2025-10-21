import { Component, OnInit } from '@angular/core';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';

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
  //router: any;

  
  constructor(private authService: Auth, private router:Router) { }

    ngOnInit() {}

  
  async onRegister() {
    try {
      
      if (this.password !== this.confirmPassword) {
        console.error('Las contraseñas no coinciden');
        return;
      }
      await this.authService.register(this.email, this.password);

      console.log('✅ Registro exitoso!');
      this.router.navigate(['/filtros']);

    } catch (e: any) {
      console.error('❌ Fallo al registrar:', e.message);
    }
  }
}

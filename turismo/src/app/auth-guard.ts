import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from './services/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    // ✅ Usa el método síncrono isAuthenticated() de tu servicio
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      // ✅ Usa createUrlTree que es más seguro que navigateByUrl
      return this.router.createUrlTree(['/login']);
    }
  }
}
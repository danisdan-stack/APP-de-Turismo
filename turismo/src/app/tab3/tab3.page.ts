import { Component, OnInit } from '@angular/core';
import { AuthService, UserProfile } from '../services/auth';
import { ProfileService } from '../services/perfil';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router'; // ✅ Agregar Router

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: false
})
export class Tab3Page implements OnInit {

  userProfile: UserProfile | null = null;
  isEditing = false;
  loading = true;
  editedProfile: UserProfile | null = null;

  constructor(
    private auth: AuthService,
    private profileService: ProfileService,
    private alertController: AlertController,
    private router: Router // ✅ Agregar Router al constructor
  ) {}

  async ngOnInit() {
    await this.loadUserProfile();
  }

  async loadUserProfile() {
    try {
      this.loading = true;
      this.userProfile = await this.profileService.getCompleteUserProfile();
      this.editedProfile = this.userProfile ? { ...this.userProfile } : null;
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      this.loading = false;
    }
  }

  enableEditing() {
    this.isEditing = true;
    this.editedProfile = this.userProfile ? { ...this.userProfile } : null;
  }

  cancelEditing() {
    this.isEditing = false;
    this.editedProfile = this.userProfile ? { ...this.userProfile } : null;
  }

  async saveProfile() {
    if (!this.editedProfile || !this.userProfile) return;

    try {
      await this.auth.updateUserProfile({
        firstName: this.editedProfile.firstName,
        lastName: this.editedProfile.lastName,
        displayName: `${this.editedProfile.firstName} ${this.editedProfile.lastName}`
      });

      await this.profileService.updateUserProfile(this.userProfile.uid, {
        firstName: this.editedProfile.firstName,
        lastName: this.editedProfile.lastName,
        phoneNumber: this.editedProfile.phoneNumber,
        tourismInterest: this.editedProfile.tourismInterest
      });

      await this.loadUserProfile();
      this.isEditing = false;
      
      this.showAlert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showAlert('Error', 'No se pudo actualizar el perfil');
    }
  }

  // 🔹 MÉTODOS DE NAVEGACIÓN AGREGADOS
// ✅ CORRECTO - Métodos individuales
irATab1() {
  this.router.navigate(['/inicio']); // o ['/filtros'] si prefieres
}

irATab2() {
  this.router.navigate(['/favoritos']);
}

irATab3() {
  this.router.navigate(['/mi-cuenta']);
}


  async logout() {
    try {
      await this.auth.logout();
      // Opcional: redirigir al login después de logout
      // this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
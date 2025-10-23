import { Component, OnInit } from '@angular/core';
import { AuthService, UserProfile } from '../services/auth';
import { ProfileService } from '../services/perfil'; 
import { AlertController, ToastController } from '@ionic/angular'; 
import { Router } from '@angular/router';
import { updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: false
})
export class Tab3Page implements OnInit {

  userProfile: UserProfile | null = null;
  editedProfile: UserProfile | null = null;
  isEditing = false;
  loading = true;

  constructor(
    private auth: AuthService,
    private profileService: ProfileService,
    private alertController: AlertController,
    private router: Router,
    private toastController: ToastController
  ) {}

  // ----------------------------------------------------
  // 1. NG ON INIT Y LOAD PROFILE
  // ----------------------------------------------------
  async ngOnInit() {
    this.loading = true;

    this.auth.getAuthState().subscribe(async (user) => {
      if (user) {
        await this.loadUserProfile(user.uid);
      } else {
        console.warn('No hay usuario autenticado. Redirigiendo a /login.');
        this.loading = false;
        this.router.navigate(['/login']); 
      }
    });
  }

  async onLogout() {
    try {
      await this.auth.logout();
      this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error) {
      console.error('Error al intentar cerrar sesión:', error);
    }
  }

  async loadUserProfile(uid: string) {
    try {
      this.loading = true;
      const userData = await this.profileService.getUserProfileById(uid);

      this.userProfile = userData;
      this.editedProfile = userData ? { ...userData } : null;

      if (this.userProfile) {
        console.log('✅ Perfil cargado exitosamente:');
        console.log(`👤 UID: ${this.userProfile.id}`);
        console.log(`✍️ Nombre: ${this.userProfile.nombre} ${this.userProfile.apellido}`);
        console.log(`📧 Email: ${this.userProfile.email}`);
        console.log(`📧 Telefono: ${this.userProfile.telefono}`);


      } else {
        console.warn('No se encontró documento de perfil.');
      }

    } catch (error) {
      console.error('Error cargando perfil:', error);
      this.showAlert('Error', 'No se pudo cargar el perfil del usuario');
    } finally {
      this.loading = false;
    }
  }

  // ----------------------------------------------------
  // 2. EDICIÓN GLOBAL
  // ----------------------------------------------------
  enableEditing() {
    this.isEditing = true;
  }

  cancelEditing() {
    this.isEditing = false;
    this.editedProfile = this.userProfile ? { ...this.userProfile } : null;
  }

  async saveProfile() {
    if (!this.editedProfile || !this.userProfile || !this.editedProfile.nombre || !this.editedProfile.apellido) {
      this.showAlert('Advertencia', 'Por favor, complete el nombre y apellido.');
      return;
    }

    try {
      const uid = this.userProfile.id;

      await this.profileService.updateUserProfile(uid, {
        nombre: this.editedProfile.nombre,
        apellido: this.editedProfile.apellido,
        email: this.editedProfile.email,
      });

      await this.auth.updateUserProfile({
        nombre: this.editedProfile.nombre,
        apellido: this.editedProfile.apellido,
      });

      this.isEditing = false;
      await this.loadUserProfile(uid); 

      this.showAlert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      this.showAlert('Error', 'No se pudo actualizar el perfil');
    }
  }

  // ----------------------------------------------------
  // 3. EDICIÓN POR DIÁLOGOS
  // ----------------------------------------------------
  async editarNombre() {
    if (!this.editedProfile || !this.userProfile?.id) {
      this.showAlert('Error', 'No se puede editar, perfil o UID no disponible.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Editar Nombre',
      inputs: [
        {
          name: 'nuevoNombre',
          type: 'text',
          placeholder: 'Introduce tu nuevo nombre',
          value: this.editedProfile!.nombre 
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const nuevoNombre = data.nuevoNombre.trim();
            if (nuevoNombre && nuevoNombre !== this.editedProfile!.nombre) {
              this.updateFieldInDatabase('nombre', nuevoNombre);
            }
          }
        }
      ]
    });

    await alert.present();
  }
async editarTelefono() {
    if (!this.editedProfile || !this.userProfile?.id) {
      this.showAlert('Error', 'No se puede editar, perfil o UID no disponible.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Editar Teléfono',
      inputs: [
        {
          name: 'nuevoTelefono',
          type: 'text',
          placeholder: 'Introduce tu nuevo telefono',
          value: this.editedProfile!.telefono 
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const nuevoTelefono = data.nuevoTelefono.trim();
            if (nuevoTelefono && nuevoTelefono !== this.editedProfile!.telefono) {
              this.updateFieldInDatabase('telefono', nuevoTelefono);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async editarApellido() {
    if (!this.editedProfile || !this.userProfile?.id) {
      this.showAlert('Error', 'No se puede editar, perfil o UID no disponible.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Editar Apellido',
      inputs: [
        {
          name: 'nuevoApellido',
          type: 'text',
          placeholder: 'Introduce tu nuevo apellido',
          value: this.editedProfile!.apellido 
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const nuevoApellido = data.nuevoApellido.trim();
            if (nuevoApellido && nuevoApellido !== this.editedProfile!.apellido) {
              this.updateFieldInDatabase('apellido', nuevoApellido);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // ----------------------------------------------------
  // 🔹 NUEVO: EDITAR EMAIL (CON REAUTENTICACIÓN)
  // ----------------------------------------------------
// ----------------------------------------------------
// 🔹 EDITAR EMAIL (USANDO AuthService)
// ----------------------------------------------------
// ----------------------------------------------------
// 🔹 EDITAR EMAIL (USANDO AuthService)
// ----------------------------------------------------
async editarEmail() {
  if (!this.editedProfile || !this.userProfile?.id) {
    this.showAlert('Error', 'No se puede editar: perfil o UID no disponible.');
    return;
  }

  const alert = await this.alertController.create({
    header: 'Editar Email',
    inputs: [
      {
        name: 'nuevoEmail',
        type: 'email',
        placeholder: 'Introduce tu nuevo email',
        value: this.editedProfile!.email
      },
      {
        name: 'password',
        type: 'password',
        placeholder: 'Introduce tu contraseña actual',
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Guardar',
        handler: async (data) => {
          const nuevoEmail = data.nuevoEmail.trim();
          const password = data.password.trim();

          if (!nuevoEmail || !password) {
            this.showAlert('Advertencia', 'Debe ingresar el nuevo email y su contraseña actual.');
            return false;
          }

          if (nuevoEmail === this.editedProfile!.email) {
            this.showAlert('Aviso', 'El nuevo email es igual al actual.');
            return false;
          }

          try {
            // 🔹 Llamamos a AuthService para actualizar email
            await this.auth.updateAuthEmail(nuevoEmail, password);

            // 🔹 Actualizamos Firestore
            await this.profileService.updateUserProfile(this.userProfile!.id, { email: nuevoEmail });

            // 🔹 Actualizamos localmente
            this.userProfile = { ...this.userProfile!, email: nuevoEmail };
            this.editedProfile = { ...this.editedProfile!, email: nuevoEmail };

            // 🔹 Mostramos toast de éxito
            const toast = await this.toastController.create({
              message: `Email actualizado con éxito a: ${nuevoEmail}`,
              duration: 3000,
              color: 'success'
            });
            toast.present();

          } catch (error: any) {
            let errorMessage = 'Error desconocido al actualizar el email.';
            if (error.code === 'auth/email-already-in-use') errorMessage = 'El email ya está en uso por otra cuenta.';
            else if (error.code === 'auth/wrong-password') errorMessage = 'Contraseña incorrecta.';
            else if (error.code === 'auth/requires-recent-login') errorMessage = 'Debes iniciar sesión de nuevo para cambiar tu email.';

            console.error('Error al actualizar email:', error);
            this.showAlert('Error', errorMessage);
          }

          return true; // ✅ evita error TS7030
        }
      }
    ]
  });

  await alert.present();
}

async cambiarContrasena() {
  const alert = await this.alertController.create({
    header: 'Cambiar Contraseña',
    inputs: [
      {
        name: 'currentPassword',
        type: 'password',
        placeholder: 'Contraseña actual',
        attributes: {
          required: true
        }
      },
      {
        name: 'newPassword',
        type: 'password',
        placeholder: 'Nueva contraseña',
        attributes: {
          required: true,
          minlength: 6
        }
      },
      {
        name: 'confirmPassword',
        type: 'password',
        placeholder: 'Confirmar nueva contraseña',
        attributes: {
          required: true,
          minlength: 6
        }
      }
    ],
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Guardar',
        handler: async (data) => {
          const { currentPassword, newPassword, confirmPassword } = data;
          
          // Validaciones
          if (!currentPassword || !newPassword || !confirmPassword) {
            this.showAlert('Error', 'Todos los campos son obligatorios');
            return false;
          }

          if (newPassword.length < 6) {
            this.showAlert('Error', 'La nueva contraseña debe tener al menos 6 caracteres');
            return false;
          }

          if (newPassword !== confirmPassword) {
            this.showAlert('Error', 'Las contraseñas no coinciden');
            return false;
          }

          // Cambiar contraseña
          try {
            await this.auth.changePassword(currentPassword, newPassword);
            this.showAlert('Éxito', 'Contraseña actualizada correctamente');
            return true;
          } catch (error: any) {
            console.error('Error al cambiar contraseña:', error);
            
            let errorMessage = 'Error al cambiar contraseña';
            if (error.code === 'auth/wrong-password') {
              errorMessage = 'La contraseña actual es incorrecta';
            } else if (error.code === 'auth/weak-password') {
              errorMessage = 'La nueva contraseña es muy débil';
            } else if (error.code === 'auth/requires-recent-login') {
              errorMessage = 'Debes volver a iniciar sesión para realizar esta acción';
            }
            
            this.showAlert('Error', errorMessage);
            return false;
          }
        }
      }
    ]
  });

  await alert.present();
}

// Función auxiliar para mostrar alertas (si no la tienes)
async showAlert2(header: string, message: string) {
  const alert = await this.alertController.create({
    header,
    message,
    buttons: ['OK']
  });
  await alert.present();
}

  // ----------------------------------------------------
  // 🔹 FUNCIÓN CENTRAL: actualizar Auth + Firestore
  // ----------------------------------------------------
  private async updateEmailAndFirestore(newEmail: string, password: string) {
    const uid = this.userProfile!.id || this.userProfile!.id;

    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('No hay usuario autenticado.');

      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      await updateEmail(user, newEmail);
      await this.profileService.updateUserProfile(uid, { email: newEmail });

      this.userProfile = { ...this.userProfile!, email: newEmail };
      this.editedProfile = { ...this.editedProfile!, email: newEmail };

      const toast = await this.toastController.create({
        message: `Email actualizado con éxito a: ${newEmail}`,
        duration: 3000,
        color: 'success'
      });
      toast.present();

    } catch (error: any) {
      let errorMessage = 'Error desconocido al actualizar el email.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'El email ya está en uso por otra cuenta.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Debes iniciar sesión de nuevo para cambiar tu email.';
      }

      console.error('Error al actualizar email:', error);
      this.showAlert('Error', errorMessage);
    }
  }

  // ----------------------------------------------------
  // 4. FUNCIONES AUXILIARES
  // ----------------------------------------------------
  private async updateFieldInDatabase(field: 'nombre' | 'apellido' | 'email' | 'telefono', value: string) {
    const uid = this.userProfile!.id || this.userProfile!.id; 
    const dataToUpdate = { [field]: value };

    try {
      await this.profileService.updateUserProfile(uid, dataToUpdate);

      this.userProfile = { ...this.userProfile!, ...dataToUpdate };
      this.editedProfile = { ...this.editedProfile!, ...dataToUpdate };
      
      if (field === 'nombre' || field === 'apellido') {
        await this.auth.updateUserProfile({
          nombre: this.editedProfile.nombre,
          apellido: this.editedProfile.apellido,
        });
      }

      const toast = await this.toastController.create({
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} actualizado con éxito.`,
        duration: 2000,
        color: 'success'
      });
      toast.present();

    } catch (error) {
      console.error('Error al actualizar en Firestore:', error);
      this.showAlert('Error de Guardado', 'No se pudo actualizar el campo.');
    }
  }

  // ----------------------------------------------------
  // 5. UTILIDADES
  // ----------------------------------------------------
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async logout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }

  irATab1() { this.router.navigate(['/inicio']); }
  irATab2() { this.router.navigate(['/favoritos']); }
  irATab3() { this.router.navigate(['/mi-cuenta']); }
}

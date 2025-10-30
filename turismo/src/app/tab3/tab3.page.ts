import { Component, OnInit } from '@angular/core';
import { AuthService, UserProfile } from '../services/auth';
import { ProfileService } from '../services/perfil'; 
import { AlertController, ToastController } from '@ionic/angular'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  standalone: false
})
export class Tab3Page implements OnInit {

  userProfile: UserProfile | null = null;
  editedProfile: UserProfile = {
    id: '',
    email: '',
    nombre: '',
    apellido: '',
    telefono: ''
  };
  isEditing = false;
  loading = true;

  constructor(
    private auth: AuthService,
    private profileService: ProfileService,
    private alertController: AlertController,
    private router: Router,
    private toastController: ToastController
  ) {}
    /**
   * @function ngOnInit
   * @description Inicializa el componente y carga el perfil del usuario autenticado
   */
  async ngOnInit() {
    this.loading = true;

    this.auth.getAuthState().subscribe(async (user) => {
      if (user) {
        await this.loadUserProfile(user.uid);
      } else {
        this.loading = false;
        this.router.navigate(['/login']); 
      }
    });
  }

    /**
   * @function isGoogleUser
   * @description Verifica si el usuario actual está autenticado con Google
   * @returns {boolean} True si es usuario de Google, false en caso contrario
   */
  isGoogleUser(): boolean {
    return this.auth.isGoogleUser();
  }
    /**
   * @function onLogout
   * @description Cierra la sesión del usuario y redirige al login
   */
  async onLogout() {
    try {
      await this.auth.logout();
      this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error) {
      this.showAlert('Error', 'No se pudo Cerrar Sesión');
    }
  }
  /**
   * @function loadUserProfile
   * @description Carga el perfil del usuario desde Firestore y Authentication
   * @param {string} uid - ID único del usuario
   */
  async loadUserProfile(uid: string) {
    try {
      this.loading = true;
      const userData = await this.profileService.getUserProfileById(uid);
      this.userProfile = userData;
      this.editedProfile = userData ? { ...userData } : {
        id: uid,
        email: '',
        nombre: '',
        apellido: '',
        telefono: ''
      };

      if (this.userProfile) {

      } else {

        this.limpiarDatosUsuario();
      }

    } catch (error) {

      this.showAlert('Error', 'No se pudo cargar el perfil del usuario');

      this.limpiarDatosUsuario();
    } finally {
      this.loading = false;
    }
  }
  /**
   * @function enableEditing
   * @description Habilita el modo de edición del perfil
   */
  enableEditing() {
    this.isEditing = true;
  }
   /**
   * @function cancelEditing
   * @description Cancela el modo de edición y restaura los valores originales
   */
  cancelEditing() {
    this.isEditing = false;
    if (this.userProfile) {
      this.editedProfile = { ...this.userProfile };
    }
  }

  async saveProfile() {
    if (!this.userProfile || !this.editedProfile.nombre || !this.editedProfile.apellido) {
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
  // EDICIÓN POR DIÁLOGOS
  // ----------------------------------------------------
  async editarNombre() {
    if (!this.userProfile?.id) {
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
          value: this.editedProfile.nombre
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const nuevoNombre = data.nuevoNombre.trim();
            if (nuevoNombre && nuevoNombre !== this.editedProfile.nombre) {
              this.updateFieldInDatabase('nombre', nuevoNombre);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async editarTelefono() {
    if (!this.userProfile?.id) {
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
          value: this.editedProfile.telefono
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const nuevoTelefono = data.nuevoTelefono.trim();
            if (nuevoTelefono && nuevoTelefono !== this.editedProfile.telefono) {
              this.updateFieldInDatabase('telefono', nuevoTelefono);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async editarApellido() {
    if (!this.userProfile?.id) {
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
          value: this.editedProfile.apellido
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: (data) => {
            const nuevoApellido = data.nuevoApellido.trim();
            if (nuevoApellido && nuevoApellido !== this.editedProfile.apellido) {
              this.updateFieldInDatabase('apellido', nuevoApellido);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // ----------------------------------------------------
  // EDITAR EMAIL (BLOQUEAR PARA GOOGLE)
  // ----------------------------------------------------
 // EDITAR EMAIL (BLOQUEAR PARA GOOGLE)
async editarEmail() {
  if (this.auth.isGoogleUser()) {
    this.showAlert('No disponible', 'Los usuarios de Google no pueden cambiar su email desde la aplicación.');
    return;
  }

  // ✅ CORRECCIÓN: Validar que userProfile no sea null
  if (!this.userProfile || !this.userProfile.id) {
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
        value: this.editedProfile.email
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

          if (nuevoEmail === this.editedProfile.email) {
            this.showAlert('Aviso', 'El nuevo email es igual al actual.');
            return false;
          }

          try {
            // ✅ CORRECCIÓN: Usar la variable validada
            await this.auth.updateAuthEmail(nuevoEmail, password);
            await this.profileService.updateUserProfile(this.userProfile!.id, { email: nuevoEmail });

            // ✅ CORRECCIÓN: Asignación correcta manteniendo todos los campos
            this.userProfile = {
              ...this.userProfile!,
              email: nuevoEmail
            };
            this.editedProfile = {
              ...this.editedProfile,
              email: nuevoEmail
            };

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

          return true;
        }
      }
    ]
  });

  await alert.present();
}
  // ----------------------------------------------------
  // CAMBIAR CONTRASEÑA (BLOQUEAR PARA GOOGLE)
  // ----------------------------------------------------
  async cambiarContrasena() {
    if (this.auth.isGoogleUser()) {
      this.showAlert('No disponible', 'Los usuarios de Google no pueden cambiar contraseña desde la aplicación.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Cambiar Contraseña',
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: 'Contraseña actual',
          attributes: { required: true }
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'Nueva contraseña',
          attributes: { required: true, minlength: 6 }
        },
        {
          name: 'confirmPassword',
          type: 'password',
          placeholder: 'Confirmar nueva contraseña',
          attributes: { required: true, minlength: 6 }
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            const { currentPassword, newPassword, confirmPassword } = data;
            
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

  // ----------------------------------------------------
  // ELIMINAR CUENTA (COMPATIBLE CON GOOGLE Y EMAIL)
  // ----------------------------------------------------
  async eliminarCuenta() {
    const isGoogleUser = this.auth.isGoogleUser();
    
    if (isGoogleUser) {
      await this.eliminarCuentaGoogle();
    } else {
      await this.eliminarCuentaEmail();
    }
  }

  // ELIMINAR CUENTA PARA USUARIOS GOOGLE
  private async eliminarCuentaGoogle() {
    const alert = await this.alertController.create({
      header: 'Eliminar Cuenta Google',
      message: '¿Estás seguro de eliminar tu cuenta? Se abrirá una ventana de Google para confirmar tu identidad.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Continuar',
          handler: async () => {
            const confirmAlert = await this.alertController.create({
              header: '⚠️ ELIMINACIÓN PERMANENTE',
              message: '¿ESTÁS ABSOLUTAMENTE SEGURO? Se eliminará tu cuenta y todos los datos permanentemente.',
              buttons: [
                { text: 'Cancelar', role: 'cancel' },
                {
                  text: 'ELIMINAR DEFINITIVAMENTE',
                  cssClass: 'danger-button',
                  handler: async () => {
                    try {
                      await this.auth.deleteUserAccount();
                      
                      // ✅ LIMPIAR DATOS LOCALES INMEDIATAMENTE
                      this.limpiarDatosUsuario();
                      
                      const toast = await this.toastController.create({
                        message: 'Tu cuenta de Google ha sido eliminada exitosamente',
                        duration: 3000,
                        color: 'success'
                      });
                      await toast.present();
                      
                      this.router.navigate(['/login'], { replaceUrl: true });
                      
                    } catch (error: any) {
                      console.error('Error al eliminar cuenta Google:', error);
                      this.manejarErrorEliminacion(error);
                    }
                  }
                }
              ]
            });
            await confirmAlert.present();
          }
        }
      ]
    });
    await alert.present();
  }

  // ELIMINAR CUENTA PARA USUARIOS EMAIL
  private async eliminarCuentaEmail() {
    let currentPassword = '';
    
    // Primer alert: solicitar contraseña
    const passwordAlert = await this.alertController.create({
      header: 'Eliminar Cuenta',
      message: 'Para eliminar tu cuenta, ingresa tu contraseña actual:',
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: 'Contraseña actual',
          attributes: { required: true }
        }
      ],
      buttons: [
        { 
          text: 'Cancelar', 
          role: 'cancel' 
        },
        {
          text: 'Continuar',
          handler: (data) => {
            currentPassword = data.currentPassword?.trim();
            
            if (!currentPassword) {
              this.showAlert('Error', 'Debes ingresar tu contraseña actual');
              return false; // Mantener alert abierto
            }
            
            // Cerrar este alert y proceder a confirmación
            return true;
          }
        }
      ]
    });

    await passwordAlert.present();
    
    // Esperar a que se cierre el primer alert
    const { data } = await passwordAlert.onDidDismiss();
    
    if (data && data.role !== 'cancel' && currentPassword) {
      // Mostrar confirmación final
      await this.mostrarConfirmacionEliminacion(currentPassword);
    }
  }

  // MOSTRAR CONFIRMACIÓN FINAL
  private async mostrarConfirmacionEliminacion(currentPassword: string) {
    const confirmAlert = await this.alertController.create({
      header: '⚠️ ELIMINACIÓN PERMANENTE',
      message: '¿ESTÁS ABSOLUTAMENTE SEGURO? Se eliminará tu cuenta y todos los datos permanentemente. Esta acción NO se puede deshacer.',
      buttons: [
        { 
          text: 'Cancelar', 
          role: 'cancel' 
        },
        {
          text: 'ELIMINAR DEFINITIVAMENTE',
          cssClass: 'danger-button',
          handler: async () => {
            try {
              await this.auth.deleteUserAccount(currentPassword);
              
              // ✅ LIMPIAR DATOS LOCALES INMEDIATAMENTE
              this.limpiarDatosUsuario();
              
              const toast = await this.toastController.create({
                message: 'Tu cuenta ha sido eliminada exitosamente',
                duration: 3000,
                color: 'success'
              });
              await toast.present();
              
              this.router.navigate(['/login'], { replaceUrl: true });
              
            } catch (error: any) {
              console.error('Error al eliminar cuenta Email:', error);
              this.manejarErrorEliminacion(error);
            }
          }
        }
      ]
    });
    await confirmAlert.present();
  }

  // ✅ MÉTODO PARA LIMPIAR DATOS DEL USUARIO
  private limpiarDatosUsuario() {
    this.userProfile = null;
    this.editedProfile = {
      id: '',
      email: '',
      nombre: '',
      apellido: '',
      telefono: ''
    };
    this.isEditing = false;
    this.loading = false;
  }

  // MANEJAR ERRORES DE ELIMINACIÓN
  private manejarErrorEliminacion(error: any) {
    let errorMessage = 'Error al eliminar cuenta';
    
    if (error.code === 'auth/wrong-password') {
      errorMessage = 'Contraseña incorrecta. Intenta nuevamente.';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Debes volver a iniciar sesión para realizar esta acción';
    } else if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'La ventana de Google fue cerrada. Operación cancelada.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'El popup fue bloqueado. Permite ventanas emergentes para este sitio.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
    }
    
    this.showAlert('Error', errorMessage);
  }

  // ----------------------------------------------------
  // FUNCIONES AUXILIARES
  // ----------------------------------------------------
  private async updateFieldInDatabase(field: 'nombre' | 'apellido' | 'email' | 'telefono', value: string) {
    if (!this.userProfile) {
      console.error('No se puede actualizar: userProfile es null');
      return;
    }

    const uid = this.userProfile.id;
    const dataToUpdate = { [field]: value };

    try {
      await this.profileService.updateUserProfile(uid, dataToUpdate);

      this.userProfile = { ...this.userProfile, ...dataToUpdate };
      this.editedProfile = { ...this.editedProfile, ...dataToUpdate };
      
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
  // UTILIDADES
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
    // ✅ MEJORA: Limpiar datos antes de hacer logout
    this.limpiarDatosUsuario();
    await this.auth.logout();
    
    // ✅ NUEVO: Limpiar también el formulario de login
    this.limpiarFormularioLogin();
    
    this.router.navigate(['/login'], { replaceUrl: true });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    this.showAlert('Error', 'No se pudo cerrar sesión');
  }
}

// ✅ NUEVO MÉTODO: Limpiar formulario de login
private limpiarFormularioLogin() {
  // Esta función necesita comunicarse con el LoginPage
  // Podemos usar localStorage o un servicio compartido
  localStorage.removeItem('loginEmail');
  localStorage.removeItem('loginPassword');
  
  console.log('✅ Formulario de login limpiado');
}

  irATab1() { this.router.navigate(['/inicio']); }
  irATab2() { this.router.navigate(['/favoritos']); }
  irATab3() { this.router.navigate(['/mi-cuenta']); }
}
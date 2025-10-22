import { Component, OnInit } from '@angular/core';
import { AuthService, UserProfile } from '../services/auth';
import { ProfileService } from '../services/perfil'; // Asegúrate que esta ruta es correcta
import { AlertController, ToastController } from '@ionic/angular'; // 🚨 AGREGADO ToastController
import { Router } from '@angular/router';

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
    private toastController: ToastController // 🚨 Inyección para mensajes
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

  async loadUserProfile(uid: string) {
    try {
      this.loading = true;
      
      const userData = await this.profileService.getUserProfileById(uid);

      this.userProfile = userData;
      this.editedProfile = userData ? { ...userData } : null;

      // 💡 Visualización en consola (corregida para usar 'uid')
      if (this.userProfile) {
        console.log('✅ Perfil cargado exitosamente:');
        // Nota: Usar 'uid' si lo mapeaste en AuthService/ProfileService, o 'id' si solo existe en Firestore
        console.log(`👤 UID: ${this.userProfile.id || this.userProfile.id}`); 
        console.log(`✍️ Nombre Completo: ${this.userProfile.nombre} ${this.userProfile.apellido}`);
        console.log(`📧 Email: ${this.userProfile.email}`);
      } else {
        console.warn('El perfil de Firestore para el UID existe, pero no se encontró documento de perfil.');
      }

    } catch (error) {
      console.error('Error cargando perfil:', error);
      this.showAlert('Error', 'No se pudo cargar el perfil del usuario');
    } finally {
      this.loading = false;
    }
  }

// ----------------------------------------------------
// 2. EDICIÓN GLOBAL (Si la mantienes)
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
      // 🚨 CORREGIDO: Usamos userProfile.uid (si existe) o userProfile.id
      const uid = this.userProfile.id || this.userProfile.id; 

      // 1. Actualizar perfil en Firestore
      await this.profileService.updateUserProfile(uid, {
        nombre: this.editedProfile.nombre,
        apellido: this.editedProfile.apellido,
        email: this.editedProfile.email,
        // Añade 'telefono' aquí si lo tienes en tu interfaz
      });

      // 2. Actualizar en Auth (displayName)
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
// 3. EDICIÓN POR DIÁLOGO (editarNombre)
// ----------------------------------------------------

  async editarNombre() {
    if (!this.editedProfile || !this.userProfile?.id && !this.userProfile?.id) {
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
        {
          text: 'Cancelar',
          role: 'cancel',
        },
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

    async editarApellido() {
    if (!this.editedProfile || !this.userProfile?.id && !this.userProfile?.id) {
      this.showAlert('Error', 'No se puede editar, perfil o UID no disponible.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Editar Apellido',
      inputs: [
        {
          name: 'nuevoApellido',
          type: 'text',
          placeholder: 'Introduce tu nuevo nombre',
          value: this.editedProfile!.apellido 
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
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
  // 4. FUNCIÓN AUXILIAR CORREGIDA PARA ACTUALIZAR FIRESTORE
  // ----------------------------------------------------
  private async updateFieldInDatabase(field: 'nombre' | 'apellido' | 'telefono', value: string) {
    // 🚨 CORREGIDO: Usamos userProfile.uid (si existe) o userProfile.id
    const uid = this.userProfile!.id || this.userProfile!.id; 
    
    const dataToUpdate = { [field]: value };

    try {
        // 🚨 LLAMA A TU FUNCIÓN REAL DEL SERVICIO (updateUserProfile)
        await this.profileService.updateUserProfile(uid, dataToUpdate);

        // Actualizar la variable local y la copia editable
        this.userProfile = { ...this.userProfile!, ...dataToUpdate };
        this.editedProfile = { ...this.editedProfile!, ...dataToUpdate };
        
        // Opcional: Actualizar displayName de Auth
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
        this.showAlert('Error de Guardado', 'No se pudo actualizar el campo. Revisar reglas de seguridad.');
    }
  }

// ----------------------------------------------------
// 5. UTILIDADES (ALERTAS Y LOGOUT)
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

  // 🔹 Navegación opcional (mantener si usas el código de navegación manual en el HTML)
  irATab1() {
    this.router.navigate(['/inicio']);
  }

  irATab2() {
    this.router.navigate(['/favoritos']);
  }

  irATab3() {
    this.router.navigate(['/mi-cuenta']);
  }
}
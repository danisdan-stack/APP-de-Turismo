import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/auth-guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login', 
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
    
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterPageModule)

  },
 
  {
    path: 'inicio',
    loadChildren: () => import('./pages/filtros/filtros.module').then(m => m.FiltrosPageModule),
    canActivate: [AuthGuard]  
  },
  {
    path: 'mapa',
    loadChildren: () => import('./mapa/mapa.module').then(m => m.MapaPageModule),
    canActivate: [AuthGuard]  
  },
  {
    path: 'favoritos',
    loadChildren: () => import('./tab2/tab2.module').then(m => m.Tab2PageModule),
    canActivate: [AuthGuard] 
  },
  {
    path: 'mi-cuenta',
    loadChildren: () => import('./tab3/tab3.module').then(m => m.Tab3PageModule),
    canActivate: [AuthGuard]  
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
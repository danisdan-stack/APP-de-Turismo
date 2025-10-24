import { Component } from '@angular/core';
import { Router } from '@angular/router'; // ✅ Agregar Router
@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page {

  constructor(
     private router: Router 
  ) {
   
  }
  direccionar(){
    console.log("te direcciono")
  }
  hola(){
    console.log("hola ")
  }

  irATab1() {
  this.router.navigate(['/inicio']); // o ['/filtros'] si prefieres
}

irATab2() {
  this.router.navigate(['/favoritos']);
}

irATab3() {
  this.router.navigate(['/mi-cuenta']);
}

}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {

  logout(): void {
    // sua lógica de logout aqui
    console.log('Logout realizado');
    // exemplo: this.router.navigate(['/login']);
  }

}

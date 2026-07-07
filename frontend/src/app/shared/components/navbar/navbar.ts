import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '@core/api-service';
import { AuthService } from '@core/auth-service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  private router = inject(Router);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  nomeUsuario = '';
  statusUsuario = '';
  iniciaisUsuario = '';
  menuAberto = false;

  isAdmin = computed(() => this.apiService.hasRole('admin'));

  ngOnInit(): void {
    const dados = localStorage.getItem('usuario');
    if (dados) {
      const usuario = JSON.parse(dados);
      this.nomeUsuario = usuario.nome;
      this.statusUsuario = usuario.status;
      this.iniciaisUsuario = this.gerarIniciais(usuario.nome);
    }
  }

  gerarIniciais(nome: string): string {
    return nome.split(' ').slice(0, 2).map(n => n[0].toUpperCase()).join('');
  }

  toggleMenu(): void { this.menuAberto = !this.menuAberto; }
  fecharMenu(): void { this.menuAberto = false; }

  logout(): void {
    this.authService.logout();
  }
}

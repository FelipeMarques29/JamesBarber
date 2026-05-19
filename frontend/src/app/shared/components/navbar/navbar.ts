import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { ApiService } from '@core/api-service';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})

export class Navbar implements OnInit {
  private router = inject(Router);
  constructor(public apiService: ApiService) {}

  nomeUsuario: string = '';
  statusUsuario: string = '';
  iniciaisUsuario: string = '';

  ngOnInit(): void {
    const dados = localStorage.getItem('usuario');

    if (dados) {
      const usuario = JSON.parse(dados);
      this.nomeUsuario = usuario.nome;
      this.statusUsuario = usuario.status
      this.iniciaisUsuario = this.gerarIniciais(usuario.nome);
    }
  }

  gerarIniciais(nome: string): string {
    return nome
    .split(' ')
    .slice(0,2)
    .map(n => n[0].toUpperCase())
    .join('');
  }

  menuAberto = false;

  toggleMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  fecharMenu(): void {
    this.menuAberto = false;
  }

  logout(): void {
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }
}

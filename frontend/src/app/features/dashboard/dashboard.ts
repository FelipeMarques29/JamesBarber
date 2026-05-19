import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/api-service';
import { ClienteLista } from '@shared/models/cliente-model';

import { Navbar } from '@shared/components/navbar/navbar';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, Navbar, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})

export class Dashboard implements OnInit {
  private apiService = inject(ApiService);

  clientes: ClienteLista[] = [];
  carregando = false;
  busca = '';

  readonly funcoes = ['barbeiro', 'limpeza', 'balcao'];

  ngOnInit(): void {
    // não carrega nada ao abrir — espera o admin buscar
  }

  buscarCliente(): void {
    if (!this.busca.trim()) return;
    this.carregando = true;

    this.apiService.listarClientes(this.busca.trim()).subscribe({
      next: (res) => {
        this.clientes = res;
        this.carregando = false;
      },
      error: () => this.carregando = false
    });
  }

  promover(cliente: ClienteLista, status: 'funcionario' | 'admin' | 'cliente', funcao?: string): void {
    if (status === 'funcionario' && !funcao) {
      alert('Selecione a função do funcionário.');
      return;
    }

    this.apiService.promoverCliente(cliente.id, status, funcao).subscribe({
      next: () => {
        alert(`${cliente.nome} atualizado para ${status}!`);
        this.buscarCliente(); // recarrega a busca atual
      },
      error: (err) => alert('Erro: ' + (err.error?.detail || 'Falha na operação'))
    });
  }
}

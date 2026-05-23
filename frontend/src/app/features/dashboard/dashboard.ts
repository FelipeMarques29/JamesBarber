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
  todosClientes: ClienteLista[] = [];
  funcionarios: ClienteLista[] = [];

  carregandoClientes = false;
  carregandoTodosClientes = false;
  carregandoFuncionarios = false;

  mostrarTodosClientes = false;
  busca = '';
  viewClientes = '';
  viewFuncionarios = '';
  viewUsuarios = '';

  readonly funcoes = ['barbeiro', 'limpeza', 'balcao'];

  ngOnInit(): void {
    this.carregarFuncionarios();
  }

  buscarCliente(): void {
    if (!this.busca.trim()) return;
    this.carregandoClientes = true;

    this.apiService.listarClientes(this.busca.trim()).subscribe({
      next: (res) => {
        this.clientes = res;
        this.carregandoClientes = false;
      },
      error: () => (this.carregandoClientes = false),
    });
  }

  carregarFuncionarios(): void {
    this.carregandoFuncionarios = true;
    this.apiService.listarFuncionarios().subscribe({
      next: (res) => {
        this.funcionarios = res.filter(c => c.status === 'funcionario');
        this.carregandoFuncionarios = false;
      },
      error: () => (this.carregandoFuncionarios = false),
    });
  }

  toggleTodosClientes(): void {
    this.mostrarTodosClientes = !this.mostrarTodosClientes;
    if (this.mostrarTodosClientes && this.todosClientes.length === 0) {
      this.carregandoTodosClientes = true;
      this.apiService.listarTodosClientes().subscribe({
        next: (res) => {
          this.todosClientes = res.filter(c => c.status === 'cliente');
          this.carregandoTodosClientes = false;
        },
        error: () => (this.carregandoTodosClientes = false),
      });
    }
  }

  promover(cliente: ClienteLista, status: 'funcionario' | 'admin' | 'cliente', funcao?: string): void {
    if (status === 'funcionario' && !funcao) {
      alert('Selecione a função do funcionário.');
      return;
    }
    this.apiService.promoverCliente(cliente.id, status, funcao).subscribe({
      next: () => {
        alert(`${cliente.nome} atualizado para ${status}!`);
        this.buscarCliente();
        this.carregarFuncionarios();
        this.todosClientes = [];
        this.mostrarTodosClientes = false;
      },
      error: (err) => alert('Erro: ' + (err.error?.detail || 'Falha na operação')),
    });
  }

  onSelectUsuarios(valor: string): void {
    if (valor === 'clientes') {
      this.todosClientes = [];
      this.carregandoTodosClientes = true;
      this.apiService.listarTodosClientes().subscribe({
        next: (res) => {
          this.todosClientes = res.filter(c => c.status === 'cliente');
          this.carregandoTodosClientes = false;
        },
        error: () => (this.carregandoTodosClientes = false),
      });
  }

  if (valor === 'funcionarios') {
    this.funcionarios = [];
    this.carregandoFuncionarios = true;
    this.apiService.listarFuncionarios().subscribe({
      next: (res) => {
        this.funcionarios = res.filter(c => c.status === 'funcionario');
        this.carregandoFuncionarios = false;
      },
      error: () => (this.carregandoFuncionarios = false),
    });
    }
  }

}

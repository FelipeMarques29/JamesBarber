import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { RouterLink } from '@angular/router';
import { ApiService } from '@core/api-service';
import { ClienteLista } from '@shared/models/cliente-model';

import { Navbar } from '@shared/components/navbar/navbar';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, Navbar, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})

export class Dashboard implements OnInit {
  private apiService = inject(ApiService);

  clientes: ClienteLista[] = [];
  todosClientes: ClienteLista[] = [];
  funcionarios: ClienteLista[] = [];
  barbeiros: ClienteLista[] = [];

  carregandoClientes = false;
  carregandoTodosClientes = false;
  carregandoFuncionarios = false;
  carregandoBloqueios = false;

  bloqueios: any[] = [];
  novoBloqueio = {
    data: '',
    tipo: 'fechado', // fechado | folga
    barbeiro_id: '',
    dia_todo: true,
    hora_inicio: '08:00',
    hora_fim: '18:00'
  };

  mostrarTodosClientes = false;
  busca = '';
  viewClientes = '';
  viewFuncionarios = '';
  viewUsuarios = '';

  modalJornadaAberto = false;
  funcionarioSelecionado: ClienteLista | null = null;
  jornadaEdit = {
    jornada_inicio: '',
    jornada_fim: '',
    almoco_inicio: '',
    almoco_fim: ''
  };

  readonly funcoes = ['barbeiro', 'limpeza', 'balcao'];
  totalClientes: number = 0;
  ultimoClienteCarregado: string | null = null;
  haMaisClientes: boolean = true;

  ngOnInit(): void {
    this.carregarFuncionarios();
    this.carregarBarbeiros();
    this.carregarBloqueios();
    this.apiService.totalClientes().subscribe({
      next: (res) => this.totalClientes = res.total
    });
  }

  carregarBarbeiros(): void {
    this.apiService.listarBarbeiros().subscribe({
      next: (res) => this.barbeiros = res,
      error: () => { }
    });
  }

  abrirModalJornada(f: ClienteLista): void {
    this.funcionarioSelecionado = f;
    this.jornadaEdit = {
      jornada_inicio: f.jornada_inicio || '08:00',
      jornada_fim: f.jornada_fim || '18:00',
      almoco_inicio: f.almoco_inicio || '',
      almoco_fim: f.almoco_fim || ''
    };
    this.modalJornadaAberto = true;
  }

  fecharModalJornada(): void {
    this.modalJornadaAberto = false;
    this.funcionarioSelecionado = null;
  }

  salvarJornada(): void {
    if (!this.funcionarioSelecionado) return;
    this.apiService.atualizarJornada(this.funcionarioSelecionado.id, this.jornadaEdit).subscribe({
      next: () => {
        alert('Jornada atualizada!');
        this.fecharModalJornada();
        this.carregarFuncionarios();
        this.carregarBarbeiros();
      },
      error: () => alert('Erro ao atualizar jornada.')
    });
  }

  carregarBloqueios(): void {
    this.carregandoBloqueios = true;
    this.apiService.listarBloqueios().subscribe({
      next: (res) => {
        this.bloqueios = res;
        this.carregandoBloqueios = false;
      },
      error: () => this.carregandoBloqueios = false
    });
  }

  criarBloqueio(): void {
    if (!this.novoBloqueio.data) {
      alert('Selecione uma data!');
      return;
    }
    if (this.novoBloqueio.tipo === 'folga' && !this.novoBloqueio.barbeiro_id) {
      alert('Selecione o barbeiro para a folga!');
      return;
    }
    if (!this.novoBloqueio.dia_todo && (!this.novoBloqueio.hora_inicio || !this.novoBloqueio.hora_fim)) {
      alert('Informe o horário de início e fim!');
      return;
    }

    const payload = { ...this.novoBloqueio };
    if (payload.tipo === 'fechado') payload.barbeiro_id = '';

    this.apiService.criarBloqueio(payload).subscribe({
      next: () => {
        alert('Bloqueio criado com sucesso!');
        this.carregarBloqueios();
        this.novoBloqueio = {
          data: '',
          tipo: 'fechado',
          barbeiro_id: '',
          dia_todo: true,
          hora_inicio: '08:00',
          hora_fim: '18:00'
        };
      },
      error: () => alert('Erro ao criar bloqueio.')
    });
  }

  removerBloqueio(id: string): void {
    if (!confirm('Tem certeza que deseja remover este bloqueio?')) return;
    this.apiService.removerBloqueio(id).subscribe({
      next: () => {
        alert('Removido com sucesso!');
        this.carregarBloqueios();
      },
      error: () => alert('Erro ao remover.')
    });
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
      this.ultimoClienteCarregado = null;
      this.haMaisClientes = true;
      this.carregarMaisClientes();
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
      this.ultimoClienteCarregado = null;
      this.haMaisClientes = true;
      this.carregarMaisClientes();
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

  carregarMaisClientes(): void {
    if (!this.haMaisClientes || this.carregandoTodosClientes) return;
    this.carregandoTodosClientes = true;
    this.apiService.listarTodosClientes(20, this.ultimoClienteCarregado || undefined).subscribe({
      next: (res) => {
        const novos = res.filter(c => c.status === 'cliente');
        this.todosClientes = [...this.todosClientes, ...novos];
        if (res.length < 20) {
          this.haMaisClientes = false;
        } else {
          this.ultimoClienteCarregado = res[res.length - 1].id;
        }
        this.carregandoTodosClientes = false;
      },
      error: () => (this.carregandoTodosClientes = false),
    });
  }

}




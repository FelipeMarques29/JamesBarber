import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  clientes: ClienteLista[] = [];
  todosClientes: ClienteLista[] = [];
  funcionarios: ClienteLista[] = [];
  admins: ClienteLista[] = [];
  barbeiros: ClienteLista[] = [];

  carregandoClientes = false;
  carregandoTodosClientes = false;
  carregandoFuncionarios = false;
  carregandoAdmins = false;
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

  notificacao = { mostrar: false, mensagem: '', tipo: 'sucesso' };
  isAdmin = false;
  isFuncionario = false;
  faturamentoResumo = { total: 0, quantidade: 0 };
  carregandoFaturamento = false;

  mostrarNotificacao(mensagem: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
    this.notificacao = { mostrar: true, mensagem, tipo };
    setTimeout(() => this.notificacao.mostrar = false, 3000);
  }

  limparBusca(): void {
    this.busca = '';
    this.clientes = [];
  }

  ngOnInit(): void {
    this.isAdmin = this.apiService.hasRole('admin');
    this.isFuncionario = this.apiService.hasRole('funcionario');

    if (!this.isAdmin && !this.isFuncionario) {
      this.router.navigate(['/home']);
      return;
    }

    this.carregarResumoFaturamento();

    if (this.isAdmin) {
      this.carregarFuncionarios();
      this.carregarAdmins();
      this.carregarBarbeiros();
      this.carregarBloqueios();
      this.apiService.totalClientes().subscribe({
        next: (res) => {
          this.totalClientes = res.total;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cdr.detectChanges();
        }
      });
    }
  }

  carregarBarbeiros(): void {
    this.apiService.listarBarbeiros().subscribe({
      next: (res) => { this.barbeiros = res; this.cdr.detectChanges(); },
      error: () => { this.cdr.detectChanges(); }
    });
  }

  carregarResumoFaturamento(): void {
    const usuario = this.apiService.getUsuarioLogado();
    if (!usuario) return;

    this.carregandoFaturamento = true;
    const filtros = this.isAdmin ? undefined : { barbeiro_id: usuario.id };

    this.apiService.listarAgendamentos(filtros).subscribe({
      next: (res) => {
        const hoje = new Date().toISOString().split('T')[0];
        const concluidos = res.filter((ag: any) => {
          const diaAgendamento = new Date(ag.data_hora).toISOString().split('T')[0];
          return ag.status === 'Concluído' && diaAgendamento === hoje;
        });
        this.faturamentoResumo = {
          total: concluidos.reduce((s: number, ag: any) => s + (ag.valor_total ?? 0), 0),
          quantidade: concluidos.length,
        };
        this.carregandoFaturamento = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.carregandoFaturamento = false;
        this.cdr.detectChanges();
      },
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
        this.mostrarNotificacao('Jornada atualizada!');
        this.fecharModalJornada();
        this.carregarFuncionarios();
        this.carregarBarbeiros();
      },
      error: () => this.mostrarNotificacao('Erro ao atualizar jornada.', 'erro')
    });
  }

  carregarBloqueios(): void {
    this.carregandoBloqueios = true;
    this.apiService.listarBloqueios().subscribe({
      next: (res) => {
        this.bloqueios = res;
        this.carregandoBloqueios = false;
        this.cdr.detectChanges();
      },
      error: () => { this.carregandoBloqueios = false; this.cdr.detectChanges(); }
    });
  }

  criarBloqueio(): void {
    if (!this.novoBloqueio.data) {
      this.mostrarNotificacao('Selecione uma data!', 'erro');
      return;
    }
    if (this.novoBloqueio.tipo === 'folga' && !this.novoBloqueio.barbeiro_id) {
      this.mostrarNotificacao('Selecione o barbeiro para a folga!', 'erro');
      return;
    }
    if (!this.novoBloqueio.dia_todo && (!this.novoBloqueio.hora_inicio || !this.novoBloqueio.hora_fim)) {
      this.mostrarNotificacao('Informe o horário de início e fim!', 'erro');
      return;
    }

    const payload = { ...this.novoBloqueio };
    if (payload.tipo === 'fechado') payload.barbeiro_id = '';

    this.apiService.criarBloqueio(payload).subscribe({
      next: () => {
        this.mostrarNotificacao('Bloqueio criado com sucesso!');
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
      error: () => this.mostrarNotificacao('Erro ao criar bloqueio.', 'erro')
    });
  }

  removerBloqueio(id: string): void {
    if (!confirm('Tem certeza que deseja remover este bloqueio?')) return;
    this.apiService.removerBloqueio(id).subscribe({
      next: () => {
        this.mostrarNotificacao('Removido com sucesso!');
        this.carregarBloqueios();
      },
      error: () => this.mostrarNotificacao('Erro ao remover.', 'erro')
    });
  }

  buscarCliente(): void {
    if (!this.busca.trim()) return;
    this.carregandoClientes = true;

    this.apiService.listarClientes(this.busca.trim()).subscribe({
      next: (res) => {
        this.clientes = res;
        this.carregandoClientes = false;
        this.cdr.detectChanges();
      },
      error: () => { this.carregandoClientes = false; this.cdr.detectChanges(); },
    });
  }

  carregarFuncionarios(): void {
    this.carregandoFuncionarios = true;
    this.apiService.listarFuncionarios().subscribe({
      next: (res) => {
        this.funcionarios = res.filter(c => c.status === 'funcionario' && !c.is_admin && (c.status as string) !== 'admin');
        this.carregandoFuncionarios = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.carregandoFuncionarios = false;
        this.mostrarNotificacao('Erro ao carregar funcionários: ' + (err.error?.detail || err.message), 'erro');
        this.cdr.detectChanges();
      }
    });
  }

  carregarAdmins(): void {
    this.carregandoAdmins = true;
    this.apiService.listarAdmins().subscribe({
      next: (res) => {
        this.admins = res.filter(c => c.is_admin === true || c.status === 'admin');
        this.carregandoAdmins = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.carregandoAdmins = false;
        this.mostrarNotificacao('Erro ao carregar admins: ' + (err.error?.detail || err.message), 'erro');
        this.cdr.detectChanges();
      }
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

  promover(cliente: ClienteLista, status: 'funcionario' | 'admin' | 'cliente', funcao?: string, isAdmin = status === 'admin'): void {
    if (status !== 'cliente' && !funcao) {
      this.mostrarNotificacao('Selecione a função do funcionário.', 'erro');
      return;
    }
    this.apiService.promoverCliente(cliente.id, status, funcao, isAdmin).subscribe({
      next: () => {
        this.mostrarNotificacao(`${cliente.nome} atualizado com sucesso!`);
        this.buscarCliente();
        this.carregarFuncionarios();
        this.carregarAdmins();
        this.carregarBarbeiros();
        this.todosClientes = [];
        this.mostrarTodosClientes = false;
      },
      error: (err) => this.mostrarNotificacao('Erro: ' + (err.error?.detail || 'Falha na operação'), 'erro'),
    });
  }

  salvarPermissao(usuario: ClienteLista, isAdminChecked: boolean, funcao: string): void {
    if (!funcao) {
      this.mostrarNotificacao('Selecione a função do funcionário.', 'erro');
      return;
    }

    const status: 'funcionario' | 'admin' = isAdminChecked ? 'admin' : 'funcionario';
    this.promover(usuario, status, funcao, isAdminChecked);
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
          this.funcionarios = res.filter(c => c.status === 'funcionario' && !c.is_admin);
          this.carregandoFuncionarios = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.carregandoFuncionarios = false;
          this.mostrarNotificacao('Erro ao carregar func: ' + (err.error?.detail || err.message), 'erro');
          this.cdr.detectChanges();
        }
      });
    }

    if (valor === 'admins') {
      this.admins = [];
      this.carregandoAdmins = true;
      this.apiService.listarAdmins().subscribe({
        next: (res) => {
          this.admins = res.filter(c => c.is_admin === true || c.status === 'admin');
          this.carregandoAdmins = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.carregandoAdmins = false;
          this.mostrarNotificacao('Erro ao carregar admins: ' + (err.error?.detail || err.message), 'erro');
          this.cdr.detectChanges();
        }
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.carregandoTodosClientes = false;
        this.mostrarNotificacao('Erro ao carregar clientes: ' + (err.error?.detail || err.message), 'erro');
        this.cdr.detectChanges();
      }
    });
  }

}




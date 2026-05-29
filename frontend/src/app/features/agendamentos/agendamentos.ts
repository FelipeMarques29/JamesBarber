import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';

import { ApiService } from '@core/api-service';
import { Navbar } from '@shared/components/navbar/navbar';
import { DadosPanel } from '@shared/components/dados-panel/dados-panel';
import { Agendamento, AgendamentoCreate } from '@shared/models/agendamento-model';
import { Servico } from '@shared/models/servicos-model';
import { ClienteLista } from '@shared/models/cliente-model';


@Component({
  selector: 'app-agendamentos',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Navbar, DadosPanel],
  templateUrl: './agendamentos.html',
  styleUrl: './agendamentos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class Agendamentos implements OnInit {
  private apiService = inject(ApiService);

  // estado do usuário
  isAdmin = computed(() => this.apiService.hasRole('admin'));
  isFuncionario = computed(() => this.apiService.hasRole('funcionario'));
  usuario = computed(() => this.apiService.getUsuarioLogado());

  // listas
  agendamentos = signal<Agendamento[]>([]);
  barbeiros = signal<ClienteLista[]>([]);
  servicos = signal<Servico[]>([]);
  horariosLivres = signal<string[]>([]);

  // loading
  carregando = signal(true);
  carregandoHorarios = signal(false);
  salvando = signal(false);

  // modal
  modalAberto = signal(false);

  // form
  form: AgendamentoCreate = this.formVazio();
  dataSelecionada = '';

  // filtro agenda (funcionario)
  filtroData   = signal('');
  filtroStatus = signal('');
  filtroBarbeiro = signal('');

  readonly statusList = ['Agendado', 'Em andamento', 'Concluído', 'Cancelado'];

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    const u = this.usuario();
    if (!u) return;

    if (this.apiService.hasRole('admin')) {
      // admin vê todos os agendamentos
      this.apiService.listarAgendamentos().subscribe({
        next: (dados) => { this.agendamentos.set(dados); this.carregando.set(false); },
        error: () => this.carregando.set(false)
      });
    } else if (this.apiService.hasRole('funcionario')) {
      // funcionário vê só os dele como barbeiro
      this.apiService.listarAgendamentos({ barbeiro_id: u.id }).subscribe({
        next: (dados) => { this.agendamentos.set(dados); this.carregando.set(false); },
        error: () => this.carregando.set(false)
      });
    } else {
      // cliente vê os seus
      this.apiService.listarAgendamentos({ cliente_id: u.id }).subscribe({
        next: (dados) => { this.agendamentos.set(dados); this.carregando.set(false); },
        error: () => this.carregando.set(false)
      });
    }

    this.apiService.listarBarbeiros().subscribe({
      next: (dados) => this.barbeiros.set(dados.filter(b => b.funcao === 'barbeiro'))
    });

    this.apiService.listarServicos().subscribe({
      next: (dados) => this.servicos.set(dados)
    });
  }

  onBarbeiroOuDataMudou(): void {
    if (!this.form.barbeiro_id || !this.dataSelecionada) return;
    this.carregandoHorarios.set(true);
    this.horariosLivres.set([]);
    this.form.data_hora = '';

    this.apiService.horariosLivres(this.form.barbeiro_id, this.dataSelecionada).subscribe({
      next: (res) => {
        this.horariosLivres.set(res.horarios_livres);
        this.carregandoHorarios.set(false);
      },
      error: () => this.carregandoHorarios.set(false)
    });
  }

  selecionarHorario(hora: string): void {
    const data = new Date(`${this.dataSelecionada}T${hora}:00`);
    const offset = -data.getTimezoneOffset();
    const sinal = offset >= 0 ? '+' : '-';
    const hh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const mm = String(Math.abs(offset) % 60).padStart(2, '0');
    this.form.data_hora = `${this.dataSelecionada}T${hora}:00${sinal}${hh}:${mm}`;
  }

  horarioSelecionado(hora: string): boolean {
    return this.form.data_hora === `${this.dataSelecionada}T${hora}:00`;
  }

  abrirModal(): void {
    this.form = this.formVazio();
    this.form.cliente_id = this.usuario()?.id ?? '';
    this.dataSelecionada = '';
    this.horariosLivres.set([]);
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
  }

  salvar(): void {
    if (!this.form.barbeiro_id || !this.form.servico_id || !this.form.data_hora) return;
    this.salvando.set(true);

    this.apiService.criarAgendamento(this.form).subscribe({
      next: () => {
        this.fecharModal();
        this.carregarDados();
        this.salvando.set(false);
      },
      error: (err) => {
        alert(err?.error?.detail ?? 'Erro ao agendar.');
        this.salvando.set(false);
      }
    });
  }

  cancelar(id: string): void {
    if (!confirm('Deseja cancelar este agendamento?')) return;
    this.apiService.cancelarAgendamento(id).subscribe({
      next: () => this.carregarDados()
    });
  }

  agendamentosFiltrados = computed(() => {
    return this.agendamentos()
      .filter(ag => {
        const dataOk     = this.filtroData()     ? ag.data_hora.startsWith(this.filtroData())  : true;
        const statusOk   = this.filtroStatus()   ? ag.status === this.filtroStatus()            : true;
        const barbeiroOk = this.filtroBarbeiro() ? ag.barbeiro_id === this.filtroBarbeiro()     : true;
        return dataOk && statusOk && barbeiroOk;
      })
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
  });

  nomeServico(id: string): string {
    return this.servicos().find(s => s.id === id)?.nome ?? id;
  }

  formatarPreco(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarDataHora(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  corStatus(status: string): string {
    const map: Record<string, string> = {
      'Agendado': 'status-agendado',
      'Em andamento': 'status-andamento',
      'Concluído': 'status-concluido',
      'Cancelado': 'status-cancelado',
    };
    return map[status] ?? '';
  }

  dataMinima(): string {
    return new Date().toISOString().split('T')[0];
  }

  private formVazio(): AgendamentoCreate {
    return { barbeiro_id: '', cliente_id: '', servico_id: '', data_hora: '' };
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '@core/api-service';
import { AgendamentoService } from './agendamento-service';
import { Navbar } from '@shared/components/navbar/navbar';
import { MiniCalendario } from '@shared/components/mini-calendario/mini-calendario';
import { Agendamento, AgendamentoCreate } from '@shared/models/agendamento-model';


@Component({
  selector: 'app-agendamentos',
  imports: [CommonModule, FormsModule, Navbar, MiniCalendario],
  templateUrl: './agendamentos.html',
  styleUrl: './agendamentos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class Agendamentos implements OnInit {
  private apiService = inject(ApiService);
  protected agendamentoService = inject(AgendamentoService);

  isAdmin = computed(() => this.apiService.hasRole('admin'));
  isFuncionario = computed(() => this.apiService.hasRole('funcionario'));
  usuario = computed(() => this.apiService.getUsuarioLogado());

  modalAberto = signal(false);
  agendamentoSelecionado = signal<Agendamento | null>(null);
  modoEdicaoId = signal<string | null>(null);
  dataSelecionada = '';
  form: AgendamentoCreate = this.formVazio();

  readonly statusList = ['Agendado', 'Em andamento', 'Concluído', 'Cancelado'];

  // todos os horários de trabalho, gerado dinamicamente com base no barbeiro selecionado no modal
  todosHorarios = signal<string[]>([]);

  // grade de horários para a visualização admin (fixo de 08:00 às 22:00, ou o máximo necessário)
  readonly gradeHorarios = this.gerarHorarios('08:00', '22:00');

  ngOnInit(): void {
    this.recarregar();
  }

  private recarregar(forcar = false): void {
    const u = this.usuario();
    if (!u) return;
    const role = this.isAdmin() ? 'admin' : this.isFuncionario() ? 'funcionario' : 'cliente';
    this.agendamentoService.carregarDados(u.id, role, forcar);
  }

  onDataEscolhida(chave: string): void {
    this.dataSelecionada = chave;
    this.onBarbeiroOuDataMudou();
  }

  onBarbeiroOuDataMudou(): void {
    if (!this.form.barbeiro_id || !this.dataSelecionada) return;
    this.form.data_hora = '';

    // Gerar horários com base na jornada do barbeiro
    const barbeiro = this.agendamentoService.barbeiros().find(b => b.id === this.form.barbeiro_id);
    const hInicioStr = barbeiro?.jornada_inicio || '08:00';
    const hFimStr = barbeiro?.jornada_fim || '18:00';
    this.todosHorarios.set(this.gerarHorarios(hInicioStr, hFimStr));

    this.agendamentoService.buscarHorarios(this.form.barbeiro_id, this.dataSelecionada);
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
    return this.form.data_hora.startsWith(`${this.dataSelecionada}T${hora}:00`);
  }

  // horário não está entre os livres retornados pelo backend → ocupado
  horarioOcupado(hora: string): boolean {
    return !this.agendamentoService.horariosLivres().includes(hora);
  }

  private gerarHorarios(inicioStr = '08:00', fimStr = '18:00'): string[] {
    const slots: string[] = [];
    const [iniH, iniM] = inicioStr.split(':').map(Number);
    const [fimH, fimM] = fimStr.split(':').map(Number);

    let currentH = iniH;
    let currentM = iniM;

    while (currentH < fimH || (currentH === fimH && currentM < fimM)) {
      const hh = String(currentH).padStart(2, '0');
      const mm = String(currentM).padStart(2, '0');
      slots.push(`${hh}:${mm}`);

      currentM += 30;
      if (currentM >= 60) {
        currentH += 1;
        currentM -= 60;
      }
    }
    return slots;
  }

  abrirModal(): void {
    this.modoEdicaoId.set(null);
    this.form = this.formVazio();
    this.form.cliente_id = this.usuario()?.id ?? '';
    this.dataSelecionada = '';
    this.agendamentoService.horariosLivres.set([]);
    this.todosHorarios.set([]);
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
  }

  salvar(): void {
    if (!this.form.barbeiro_id || !this.form.servico_id || !this.form.data_hora) return;
    
    const idEdicao = this.modoEdicaoId();
    if (idEdicao) {
      this.agendamentoService.atualizar(idEdicao, { data_hora: this.form.data_hora }).subscribe({
        next: () => {
          this.fecharModal();
          this.recarregar(true);
        },
        error: (err) => alert(err?.error?.detail ?? 'Erro ao reagendar.'),
      });
    } else {
      this.agendamentoService.criar(this.form).subscribe({
        next: () => {
          this.fecharModal();
          this.recarregar(true); // força, mas busca só o delta (incremental)
        },
        error: (err) => alert(err?.error?.detail ?? 'Erro ao agendar.'),
      });
    }
  }

  cancelar(id: string): void {
    if (!confirm('Deseja cancelar este agendamento?')) return;
    this.fecharOpcoesAdmin();
    // o service já atualiza o status localmente (update otimista) -> não precisa recarregar
    this.agendamentoService.cancelar(id).subscribe({
      error: () => alert('Erro ao cancelar.'),
    });
  }

  abrirOpcoesAdmin(ag: Agendamento): void {
    if (this.isAdmin() || this.isFuncionario()) {
      this.agendamentoSelecionado.set(ag);
    }
  }

  fecharOpcoesAdmin(): void {
    this.agendamentoSelecionado.set(null);
  }

  marcarComoConcluido(ag: Agendamento): void {
    this.agendamentoService.atualizar(ag.id, { status: 'Concluído' }).subscribe({
      next: () => this.fecharOpcoesAdmin(),
      error: () => alert('Erro ao concluir agendamento.'),
    });
  }

  abrirModalReagendar(ag: Agendamento): void {
    this.fecharOpcoesAdmin();
    this.form = {
      barbeiro_id: ag.barbeiro_id,
      cliente_id: ag.cliente_id,
      servico_id: ag.servico_id,
      data_hora: '' // obriga a escolher nova data
    };
    this.modoEdicaoId.set(ag.id);
    this.dataSelecionada = '';
    this.agendamentoService.horariosLivres.set([]);
    this.todosHorarios.set([]);
    this.modalAberto.set(true);
  }

  nomeServico(id: string): string {
    return this.agendamentoService.servicos().find(s => s.id === id)?.nome ?? id;
  }

  formatarPreco(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarDataHora(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
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

  // dia visualizado na grade (admin)
  diaGrade = signal(new Date().toISOString().split('T')[0]);

  diaAnterior(): void {
    const d = new Date(this.diaGrade() + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    this.diaGrade.set(d.toISOString().split('T')[0]);
  }

  diaProximo(): void {
    const d = new Date(this.diaGrade() + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    this.diaGrade.set(d.toISOString().split('T')[0]);
  }

  formatarDiaGrade(): string {
    const d = new Date(this.diaGrade() + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  agendamentosDoBarbeiro(barbeiroId: string): Agendamento[] {
    return this.agendamentoService.agendamentos().filter(ag => {
      const diaAg = new Date(ag.data_hora).toISOString().split('T')[0];
      return ag.barbeiro_id === barbeiroId && diaAg === this.diaGrade();
    });
  }

  posicaoBloco(ag: Agendamento): { top: string; height: string } {
    const data = new Date(ag.data_hora);
    const minutosDesdoInicio = (data.getHours() - 8) * 60 + data.getMinutes();
    const top = (minutosDesdoInicio / 30) * 3.5;
    const height = (ag.duracao_minutos / 30) * 3.5;
    return { top: `${top}rem`, height: `${height}rem` };
  }

  formatarHora(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  setFiltroStatus(valor: string): void {
    this.agendamentoService.filtroStatus.set(valor);
  }

  setFiltroData(valor: string): void {
    this.agendamentoService.filtroData.set(valor);
    if (valor) this.diaGrade.set(valor);
  }
}

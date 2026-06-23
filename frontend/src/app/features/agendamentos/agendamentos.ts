import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ApiService } from '@core/api-service';
import { AgendamentoService } from './agendamento-service';
import { Navbar } from '@shared/components/navbar/navbar';
import { DadosPanel } from '@shared/components/dados-panel/dados-panel';
import { MiniCalendario } from '@shared/components/mini-calendario/mini-calendario';
import { AgendamentoCreate } from '@shared/models/agendamento-model';
import { Servico } from '@shared/models/servicos-model';
import { ClienteLista } from '@shared/models/cliente-model';


@Component({
  selector: 'app-agendamentos',
  imports: [CommonModule, FormsModule, Navbar, DadosPanel, MiniCalendario],
  templateUrl: './agendamentos.html',
  styleUrl: './agendamentos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class Agendamentos implements OnInit {
  private apiService = inject(ApiService);
  protected agendamentoService = inject(AgendamentoService);

  isAdmin       = computed(() => this.apiService.hasRole('admin'));
  isFuncionario = computed(() => this.apiService.hasRole('funcionario'));
  usuario       = computed(() => this.apiService.getUsuarioLogado());

  modalAberto     = signal(false);
  dataSelecionada = '';
  form: AgendamentoCreate = this.formVazio();

  readonly statusList = ['Agendado', 'Em andamento', 'Concluído', 'Cancelado'];

  // todos os horários de trabalho (08:00 → 17:30, mesmos slots do backend)
  readonly todosHorarios = this.gerarHorarios();

  ngOnInit(): void {
    const u = this.usuario();
    if (!u) return;
    const role = this.isAdmin() ? 'admin' : this.isFuncionario() ? 'funcionario' : 'cliente';
    this.agendamentoService.carregarDados(u.id, role);
  }

  onDataEscolhida(chave: string): void {
    this.dataSelecionada = chave;
    this.onBarbeiroOuDataMudou();
  }

  onBarbeiroOuDataMudou(): void {
    if (!this.form.barbeiro_id || !this.dataSelecionada) return;
    this.form.data_hora = '';
    this.agendamentoService.buscarHorarios(this.form.barbeiro_id, this.dataSelecionada);
  }

  selecionarHorario(hora: string): void {
    const data   = new Date(`${this.dataSelecionada}T${hora}:00`);
    const offset = -data.getTimezoneOffset();
    const sinal  = offset >= 0 ? '+' : '-';
    const hh     = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
    const mm     = String(Math.abs(offset) % 60).padStart(2, '0');
    this.form.data_hora = `${this.dataSelecionada}T${hora}:00${sinal}${hh}:${mm}`;
  }

  horarioSelecionado(hora: string): boolean {
    return this.form.data_hora.startsWith(`${this.dataSelecionada}T${hora}:00`);
  }

  // horário não está entre os livres retornados pelo backend → ocupado
  horarioOcupado(hora: string): boolean {
    return !this.agendamentoService.horariosLivres().includes(hora);
  }

  private gerarHorarios(): string[] {
    const slots: string[] = [];
    for (let h = 8; h < 18; h++) {
      const hh = String(h).padStart(2, '0');
      slots.push(`${hh}:00`, `${hh}:30`);
    }
    return slots;
  }

  abrirModal(): void {
    this.form = this.formVazio();
    this.form.cliente_id = this.usuario()?.id ?? '';
    this.dataSelecionada = '';
    this.agendamentoService.horariosLivres.set([]);
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
  }

  salvar(): void {
    if (!this.form.barbeiro_id || !this.form.servico_id || !this.form.data_hora) return;
    this.agendamentoService.criar(this.form).subscribe({
      next: () => {
        this.fecharModal();
        this.ngOnInit();
      },
      error: (err) => alert(err?.error?.detail ?? 'Erro ao agendar.'),
    });
  }

  cancelar(id: string): void {
    if (!confirm('Deseja cancelar este agendamento?')) return;
    this.agendamentoService.cancelar(id).subscribe({
      next: () => this.ngOnInit(),
    });
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
      'Agendado':     'status-agendado',
      'Em andamento': 'status-andamento',
      'Concluído':    'status-concluido',
      'Cancelado':    'status-cancelado',
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

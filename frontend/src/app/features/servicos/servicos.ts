import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
// import { HttpClient } from '@angular/common/http';

import { Servico, ServicoCreate, ServicoUpdate, TipoServico } from '@shared/models/servicos-model';
import { Navbar } from '@shared/components/navbar/navbar';
import { ApiService } from '@core/api-service';

@Component({
  selector: 'app-servicos',
  imports: [CommonModule, RouterModule, FormsModule, Navbar],
  templateUrl: './servicos.html',
  styleUrl: './servicos.css',
})

export class Servicos implements OnInit {

  servicos = signal<Servico[]>([]);
  carregando = signal(true);
  erro = signal<string | null>(null);

  modalAberto = signal(false);
  salvando = signal(false);
  editandoId = signal<string | null>(null);

  form: ServicoCreate = this.formVazio();

  readonly tiposServico: TipoServico[] = [
    'corte', 'barba', 'corte_barba', 'hidratacao', 'coloracao', 'sobrancelha'
  ];

  readonly iconesPorTipo: Record<TipoServico, string> = {
    corte: 'scissors',
    barba: 'razor',
    corte_barba: 'scissors',
    hidratacao: 'bottle',
    coloracao: 'barber-pole',
    sobrancelha: 'eyebrow'
  };

  private apiService = inject(ApiService);

  isAdmin = computed(() => this.apiService.hasRole('admin'));
  isFuncionario = computed(() => this.apiService.hasRole('funcionario'));

  ngOnInit(): void {
    this.carregarServicos();
  }

  carregarServicos(): void {
    this.carregando.set(true);
    this.apiService.listarServicos().subscribe({
      next: (dados: Servico[]) => {
        this.servicos.set(dados);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os serviços.');
        this.carregando.set(false);
      }
    });
  }

  abrirModalNovo(): void {
    this.editandoId.set(null);
    this.form = this.formVazio();
    this.modalAberto.set(true);
  }

  abrirModalEditar(servico: Servico): void {
    this.editandoId.set(servico.id);
    this.form = {
      nome: servico.nome,
      descricao: servico.descricao,
      tipo: servico.tipo,
      preco: servico.preco,
      duracao_minutos: servico.duracao_minutos,
    };
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.editandoId.set(null);
    this.form = this.formVazio();
  }

  salvar(): void {
    this.salvando.set(true);
    const id = this.editandoId();

    const req = id
      ? this.apiService.atualizarServico(id, this.form)
      : this.apiService.criarServico(this.form);

    req.subscribe({
      next: () => {
        this.fecharModal();
        this.carregarServicos();
        this.salvando.set(false);
      },
      error: () => {
        this.salvando.set(false);
      }
    });
  }

  deletar(id: string): void {
    if (!confirm('Deseja deletar este serviço?')) return;
    this.apiService.deletarServico(id).subscribe({
      next: () => this.carregarServicos()
    });
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarDuracao(minutos: number): string {
    if (minutos < 60) return `${minutos} min`;
    const h = Math.floor(minutos / 60);
    const m = minutos % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  private formVazio(): ServicoCreate {
    return { nome: '', descricao: null, tipo: 'corte', preco: 0, duracao_minutos: 30 };
  }
}

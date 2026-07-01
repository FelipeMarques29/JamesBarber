// servicos.ts
import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Servico, ServicoCreate } from '@shared/models/servicos-model';
import { Navbar } from '@shared/components/navbar/navbar';
import { ApiService } from '@core/api-service';
import { ServicosService } from './servicos-service';

@Component({
  selector: 'app-servicos',
  imports: [CommonModule, RouterModule, FormsModule, Navbar],
  templateUrl: './servicos.html',
  styleUrl: './servicos.css',
})
export class Servicos implements OnInit {
  private apiService = inject(ApiService);
  protected servicosService = inject(ServicosService);

  modalAberto = signal(false);
  salvando = signal(false);
  editandoId = signal<string | null>(null);

  form: ServicoCreate = this.formVazio();

  isAdmin = computed(() => this.apiService.hasRole('admin'));
  isFuncionario = computed(() => this.apiService.hasRole('funcionario'));

  ngOnInit(): void {
    this.servicosService.carregarServicos();
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
      ? this.servicosService.atualizarServico(id, this.form)
      : this.servicosService.criarServico(this.form);

    req.subscribe({
      next: () => {
        this.fecharModal();
        this.salvando.set(false);
      },
      error: () => {
        this.salvando.set(false);
      }
    });
  }

  deletar(id: string): void {
    if (!confirm('Deseja deletar este serviço?')) return;
    this.servicosService.deletarServico(id).subscribe();
  }

  private formVazio(): ServicoCreate {
    return { nome: '', descricao: null, tipo: 'corte', preco: 0 };
  }
}

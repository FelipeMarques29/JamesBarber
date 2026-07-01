// servicos-service.ts
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { Servico, ServicoCreate, ServicoUpdate, TipoServico } from '@shared/models/servicos-model';
import { ApiService } from '@core/api-service';

@Injectable({
  providedIn: 'root',
})
export class ServicosService {
  private apiService = inject(ApiService);

  private _servicos = signal<Servico[]>([]);
  private _carregando = signal(true);
  private _erro = signal<string | null>(null);

  readonly servicos = this._servicos.asReadonly();
  readonly carregando = this._carregando.asReadonly();
  readonly erro = this._erro.asReadonly();

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

  carregarServicos(): void {
    this._carregando.set(true);
    this._erro.set(null);
    this.apiService.listarServicos().subscribe({
      next: (dados) => {
        this._servicos.set(dados);
        this._carregando.set(false);
      },
      error: () => {
        this._erro.set('Não foi possível carregar os serviços.');
        this._carregando.set(false);
      }
    });
  }

  criarServico(dados: ServicoCreate): Observable<Servico> {
    return this.apiService.criarServico(dados).pipe(
      tap(() => this.carregarServicos())
    );
  }

  atualizarServico(id: string, dados: ServicoUpdate): Observable<Servico> {
    return this.apiService.atualizarServico(id, dados).pipe(
      tap(() => this.carregarServicos())
    );
  }

  deletarServico(id: string): Observable<void> {
    return this.apiService.deletarServico(id).pipe(
      tap(() => this.carregarServicos())
    );
  }

  formatarPreco(preco: number): string {
    return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
}

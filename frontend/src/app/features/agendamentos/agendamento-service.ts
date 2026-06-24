import { Injectable, inject, signal, computed } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from '@core/api-service';
import { Agendamento, AgendamentoCreate, StatusAgendamento } from '@shared/models/agendamento-model';
import { Servico } from '@shared/models/servicos-model';
import { ClienteLista } from '@shared/models/cliente-model';

@Injectable({ providedIn: 'root' })
export class AgendamentoService {
  private api = inject(ApiService);


  agendamentos   = signal<Agendamento[]>([]);
  barbeiros      = signal<ClienteLista[]>([]);
  servicos       = signal<Servico[]>([]);
  horariosLivres = signal<string[]>([]);

  carregando         = signal(false);
  carregandoHorarios = signal(false);
  salvando           = signal(false);

  filtroData     = signal('');
  filtroStatus   = signal('');
  filtroBarbeiro = signal('');

  agendamentosFiltrados = computed(() =>
    this.agendamentos()
      .filter(ag => {
        const diaAg = ag.data_hora.split('T')[0];
        const dataOk     = this.filtroData()     ? diaAg === this.filtroData()                : true;
        const statusOk   = this.filtroStatus()   ? ag.status === this.filtroStatus()          : true;
        const barbeiroOk = this.filtroBarbeiro() ? ag.barbeiro_id === this.filtroBarbeiro()   : true;
        return dataOk && statusOk && barbeiroOk;
      })
  );


  carregarDados(usuarioId: string, role: string): void {
    const params = role === 'admin'       ? {}
                : role === 'funcionario' ? { barbeiro_id: usuarioId }
                :                          { cliente_id: usuarioId };

    this.carregando.set(true);

    this.api.listarAgendamentos(params).subscribe({
      next: (dados) => { this.agendamentos.set(dados); this.carregando.set(false); },
      error: ()     => this.carregando.set(false),
    });

    // só busca barbeiros e serviços se ainda não tiver
    if (this.barbeiros().length === 0) {
      this.api.listarBarbeiros().subscribe({
        next: (dados) => this.barbeiros.set(dados.filter(b => b.funcao === 'barbeiro')),
      });
    }

    if (this.servicos().length === 0) {
      this.api.listarServicos().subscribe({
        next: (dados) => this.servicos.set(dados),
      });
    }
  }

  buscarHorarios(barbeiroId: string, data: string): void {
    this.carregandoHorarios.set(true);
    this.horariosLivres.set([]);
    this.api.horariosLivres(barbeiroId, data).subscribe({
      next: (res) => { this.horariosLivres.set(res.horarios_livres); this.carregandoHorarios.set(false); },
      error: ()   => this.carregandoHorarios.set(false),
    });
  }


  criar(form: AgendamentoCreate) {
    this.salvando.set(true);
    return this.api.criarAgendamento(form).pipe(
      tap({
        next:  () => this.salvando.set(false),
        error: () => this.salvando.set(false),
      })
    );
  }

  cancelar(id: string) {
    return this.api.cancelarAgendamento(id).pipe(
      tap(() => {
        this.agendamentos.update(lista =>
          lista.map(ag => ag.id === id ? { ...ag, status: 'Cancelado' as StatusAgendamento } : ag)
        );
      })
    );
  }
}

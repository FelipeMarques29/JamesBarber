import { Injectable, inject, signal, computed } from '@angular/core';
import { tap } from 'rxjs';
import { ApiService } from '@core/api-service';
import { Agendamento, AgendamentoCreate, StatusAgendamento } from '@shared/models/agendamento-model';
import { Servico } from '@shared/models/servicos-model';
import { ClienteLista } from '@shared/models/cliente-model';

@Injectable({ providedIn: 'root' })
export class AgendamentoService {
  private api = inject(ApiService);
  private readonly CACHE_TTL_MS = 300_000; // 5 minutos

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

  private contextoAtual: string | null = null;
  private ultimaSincronizacao = signal<string | null>(null);

  agendamentosFiltrados = computed(() => {
    // 1. Primeiro fazemos o filtro normal
    const filtrados = this.agendamentos().filter(ag => {
      const diaAg = ag.data_hora.split('T')[0];
      const dataOk     = this.filtroData()     ? diaAg === this.filtroData()               : true;
      const statusOk   = this.filtroStatus()   ? ag.status === this.filtroStatus()         : true;
      const barbeiroOk = this.filtroBarbeiro() ? ag.barbeiro_id === this.filtroBarbeiro()  : true;

      return dataOk && statusOk && barbeiroOk;
    });

    // 2. Depois garantimos a ordenação decrescente (do mais recente para o mais antigo)
    return filtrados.sort((a, b) => {
      const tempoA = new Date(a.data_hora).getTime();
      const tempoB = new Date(b.data_hora).getTime();
      return tempoB - tempoA;
    });
  });

  carregarDados(usuarioId: string, role: string, forcar = false): void {
    const contexto = `${role}:${usuarioId}`;
    const mudouContexto = this.contextoAtual !== contexto;

    if (mudouContexto) {
      // trocou de usuário/role -> cache antigo não serve mais
      this.contextoAtual = contexto;
      this.ultimaSincronizacao.set(null);
      this.agendamentos.set([]);
    }

    const ultimaSync = this.ultimaSincronizacao();

    // mesmo contexto + cache ainda fresco -> não bate na API
    if (!forcar && !mudouContexto && ultimaSync) {
      const idadeMs = Date.now() - new Date(ultimaSync).getTime();
      if (idadeMs < this.CACHE_TTL_MS) return;
    }

    // ==========================================
    // NOVA LÓGICA DE PARÂMETROS
    // ==========================================
    let paramsBase: any = {};

    if (role === 'admin') {
      paramsBase = {};
    } else if (role === 'funcionario') {
      // 1. Pega a data selecionada no filtro da tela, ou usa o dia de hoje
      // O 'T12:00:00' evita bugs de fuso horário onde o JS volta 1 dia para trás
      const dataAlvo = this.filtroData() ? new Date(this.filtroData() + 'T12:00:00') : new Date();

      // 2. Define 00:00:00 e 23:59:59 daquele dia
      const inicioDia = new Date(dataAlvo);
      inicioDia.setHours(0, 0, 0, 0);

      const fimDia = new Date(dataAlvo);
      fimDia.setHours(23, 59, 59, 999);

      paramsBase = {
        barbeiro_id: usuarioId,
        data_inicio: inicioDia.toISOString(),
        data_fim: fimDia.toISOString(),
        limite: 100 // Força um limite alto para garantir que cabem todos os cortes do dia
      };
    } else {
      // Cliente: Traz apenas o histórico dos últimos 3
      paramsBase = {
        cliente_id: usuarioId,
        limite: 3
      };
    }
    // ==========================================

    const incremental = !mudouContexto && !!ultimaSync;
    const params = incremental ? { ...paramsBase, atualizado_apos: ultimaSync } : paramsBase;

    this.carregando.set(!incremental); // loading visual só na carga cheia, não no refresh incremental

    this.api.listarAgendamentos(params).subscribe({
      next: (dados) => {
        if (incremental) {
          const mapa = new Map(this.agendamentos().map(a => [a.id, a]));
          for (const ag of dados) mapa.set(ag.id, ag);
          this.agendamentos.set(Array.from(mapa.values()));
        } else {
          this.agendamentos.set(dados);
        }
        this.ultimaSincronizacao.set(new Date().toISOString());
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });

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

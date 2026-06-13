import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from '@core/api-service';
import { Navbar } from '@shared/components/navbar/navbar';
import { Agendamento } from '@shared/models/agendamento-model';

interface DiaCalendario {
  chave: string;          // 'YYYY-MM-DD'
  dia: number;            // número do dia
  dentroDoMes: boolean;   // pertence ao mês exibido
  hoje: boolean;
  quantidade: number;     // agendamentos no dia
}

interface SlotHora {
  hora: string;              // 'HH:MM'
  itens: Agendamento[];      // agendamentos nessa hora (lado a lado se > 1)
}

interface DiaSemana {
  chave: string;
  nome: string;           // Dom, Seg...
  numero: number;
  hoje: boolean;
  slots: SlotHora[];
}

type Visao = 'mes' | 'semana' | 'dia';

@Component({
  selector: 'app-calendario',
  imports: [CommonModule, Navbar],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Calendario implements OnInit {
  private apiService = inject(ApiService);

  // estado do usuário
  isAdmin = computed(() => this.apiService.hasRole('admin'));
  isFuncionario = computed(() => this.apiService.hasRole('funcionario'));
  usuario = computed(() => this.apiService.getUsuarioLogado());

  agendamentos = signal<Agendamento[]>([]);
  carregando = signal(true);

  // mês exibido (ano e mês 0-11)
  private hoje = new Date();
  ano = signal(this.hoje.getFullYear());
  mes = signal(this.hoje.getMonth());

  // dia selecionado no mês ('YYYY-MM-DD' ou '')
  diaSelecionado = signal('');

  // visão atual e dia de referência (para semana/dia)
  visao = signal<Visao>('mes');
  diaRef = signal(this.chaveData(this.hoje));

  readonly diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    const u = this.usuario();
    if (!u) return;

    let filtros: { barbeiro_id?: string; cliente_id?: string } | undefined;
    if (this.apiService.hasRole('admin')) {
      filtros = undefined;                       // admin vê todos
    } else if (this.apiService.hasRole('funcionario')) {
      filtros = { barbeiro_id: u.id };           // funcionário vê os dele como barbeiro
    } else {
      filtros = { cliente_id: u.id };            // cliente vê os seus
    }

    this.apiService.listarAgendamentos(filtros).subscribe({
      next: (dados) => { this.agendamentos.set(dados); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
  }

  // agrupa agendamentos por dia local 'YYYY-MM-DD'
  private agendamentosPorDia = computed(() => {
    const mapa = new Map<string, Agendamento[]>();
    for (const ag of this.agendamentos()) {
      if (ag.status === 'Cancelado') continue;
      const chave = this.chaveData(new Date(ag.data_hora));
      const lista = mapa.get(chave) ?? [];
      lista.push(ag);
      mapa.set(chave, lista);
    }
    return mapa;
  });

  // grade do mês exibido (com dias vizinhos para completar as semanas)
  dias = computed<DiaCalendario[]>(() => {
    const ano = this.ano();
    const mes = this.mes();
    const porDia = this.agendamentosPorDia();
    const hojeChave = this.chaveData(new Date());

    const primeiroDia = new Date(ano, mes, 1);
    const offset = primeiroDia.getDay();              // quantos dias em branco antes
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const diasMesAnterior = new Date(ano, mes, 0).getDate();

    const celulas: DiaCalendario[] = [];

    // dias do mês anterior (preenchimento)
    for (let i = offset - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      celulas.push(this.criarCelula(ano, mes - 1, dia, false, porDia, hojeChave));
    }
    // dias do mês atual
    for (let dia = 1; dia <= diasNoMes; dia++) {
      celulas.push(this.criarCelula(ano, mes, dia, true, porDia, hojeChave));
    }
    // dias do próximo mês até completar a última semana
    const resto = celulas.length % 7;
    if (resto !== 0) {
      const faltam = 7 - resto;
      for (let dia = 1; dia <= faltam; dia++) {
        celulas.push(this.criarCelula(ano, mes + 1, dia, false, porDia, hojeChave));
      }
    }
    return celulas;
  });

  // agendamentos do dia selecionado, ordenados por horário
  agendamentosDoDia = computed<Agendamento[]>(() => {
    const chave = this.diaSelecionado();
    if (!chave) return [];
    return [...(this.agendamentosPorDia().get(chave) ?? [])]
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
  });

  // mesmos agendamentos agrupados por horário (mesma hora fica lado a lado)
  slotsDoDia = computed<SlotHora[]>(() => this.agruparPorHora(this.agendamentosDoDia()));

  // ── Visão SEMANA: 7 colunas a partir do domingo da semana de referência ──
  diasDaSemana = computed<DiaSemana[]>(() => {
    const porDia = this.agendamentosPorDia();
    const hojeChave = this.chaveData(new Date());
    const ref = this.parseChave(this.diaRef());
    const inicio = this.addDias(ref, -ref.getDay()); // volta até domingo

    return Array.from({ length: 7 }, (_, i) => {
      const d = this.addDias(inicio, i);
      const chave = this.chaveData(d);
      const ags = [...(porDia.get(chave) ?? [])]
        .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
      return {
        chave,
        nome: this.diasSemana[i],
        numero: d.getDate(),
        hoje: chave === hojeChave,
        slots: this.agruparPorHora(ags),
      };
    });
  });

  // ── Visão DIA: reservas do dia de referência, agrupadas por horário ──
  agendamentosDoDiaRef = computed<Agendamento[]>(() => {
    return [...(this.agendamentosPorDia().get(this.diaRef()) ?? [])]
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
  });

  slotsDoDiaRef = computed<SlotHora[]>(() => this.agruparPorHora(this.agendamentosDoDiaRef()));

  rotuloMes = computed(() => {
    const texto = new Date(this.ano(), this.mes(), 1)
      .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  });

  // rótulo do período exibido na toolbar, conforme a visão
  rotuloPeriodo = computed(() => {
    const v = this.visao();
    if (v === 'mes') return this.rotuloMes();
    if (v === 'dia') {
      const d = this.parseChave(this.diaRef());
      const t = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
      return t.charAt(0).toUpperCase() + t.slice(1);
    }
    const dias = this.diasDaSemana();
    const fmt = (chave: string) =>
      this.parseChave(chave).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `${fmt(dias[0].chave)} – ${fmt(dias[6].chave)}`;
  });

  rotuloDiaSelecionado = computed(() => {
    const chave = this.diaSelecionado();
    if (!chave) return '';
    const [a, m, d] = chave.split('-').map(Number);
    return new Date(a, m - 1, d).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
  });

  setVisao(v: Visao): void {
    this.visao.set(v);
  }

  // navegação anterior/próximo conforme a visão atual
  anterior(): void {
    const v = this.visao();
    if (v === 'mes') this.mesAnterior();
    else this.deslocarDias(v === 'semana' ? -7 : -1);
  }

  proximo(): void {
    const v = this.visao();
    if (v === 'mes') this.proximoMes();
    else this.deslocarDias(v === 'semana' ? 7 : 1);
  }

  private mesAnterior(): void {
    this.diaSelecionado.set('');
    if (this.mes() === 0) { this.mes.set(11); this.ano.update(a => a - 1); }
    else { this.mes.update(m => m - 1); }
  }

  private proximoMes(): void {
    this.diaSelecionado.set('');
    if (this.mes() === 11) { this.mes.set(0); this.ano.update(a => a + 1); }
    else { this.mes.update(m => m + 1); }
  }

  private deslocarDias(n: number): void {
    this.diaRef.set(this.chaveData(this.addDias(this.parseChave(this.diaRef()), n)));
  }

  irParaHoje(): void {
    const h = new Date();
    this.ano.set(h.getFullYear());
    this.mes.set(h.getMonth());
    this.diaRef.set(this.chaveData(h));
    this.diaSelecionado.set(this.chaveData(h));
  }

  selecionarDia(dia: DiaCalendario): void {
    if (!dia.dentroDoMes) return;
    this.diaSelecionado.set(this.diaSelecionado() === dia.chave ? '' : dia.chave);
  }

  // rótulo da pessoa conforme o papel do usuário
  pessoaLabel(ag: Agendamento): string {
    if (this.isAdmin()) return `${ag.barbeiro_nome} → ${ag.cliente_nome}`;
    if (this.isFuncionario()) return ag.cliente_nome;
    return ag.barbeiro_nome;
  }

  formatarHora(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  formatarPreco(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

  private criarCelula(
    ano: number, mes: number, dia: number,
    dentroDoMes: boolean,
    porDia: Map<string, Agendamento[]>,
    hojeChave: string,
  ): DiaCalendario {
    // normaliza ano/mês (mes pode ser -1 ou 12)
    const data = new Date(ano, mes, dia);
    const chave = this.chaveData(data);
    return {
      chave,
      dia: data.getDate(),
      dentroDoMes,
      hoje: chave === hojeChave,
      quantidade: porDia.get(chave)?.length ?? 0,
    };
  }

  private chaveData(d: Date): string {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  // agrupa por horário (mesma hora de barbeiros diferentes fica lado a lado)
  private agruparPorHora(ags: Agendamento[]): SlotHora[] {
    const mapa = new Map<string, Agendamento[]>();
    for (const ag of ags) {
      const hora = this.formatarHora(ag.data_hora);
      const itens = mapa.get(hora) ?? [];
      itens.push(ag);
      mapa.set(hora, itens);
    }
    return Array.from(mapa, ([hora, itens]) => ({ hora, itens }));
  }

  private parseChave(chave: string): Date {
    const [a, m, d] = chave.split('-').map(Number);
    return new Date(a, m - 1, d);
  }

  private addDias(d: Date, n: number): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }
}

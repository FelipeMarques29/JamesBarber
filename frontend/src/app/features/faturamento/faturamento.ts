import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { ApiService } from '@core/api-service';
import { Navbar } from '@shared/components/navbar/navbar';
import { MiniCalendario } from '@shared/components/mini-calendario/mini-calendario';
import { Agendamento } from '@shared/models/agendamento-model';

interface LinhaDia {
  hora: string;
  servico: string;
  cliente: string;
  barbeiro: string;
  status: string;
  valor: number;
}

interface LinhaMes {
  chave: string;     // 'YYYY-MM-DD'
  dia: string;       // 'DD/MM'
  quantidade: number;
  total: number;
}

type VisaoFat = 'diario' | 'semanal' | 'mensal';

@Component({
  selector: 'app-faturamento',
  imports: [CommonModule, Navbar, MiniCalendario],
  templateUrl: './faturamento.html',
  styleUrl: './faturamento.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Faturamento implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  agendamentos = signal<Agendamento[]>([]);
  carregando = signal(true);

  visao = signal<VisaoFat>('diario');

  private hoje = new Date();
  diaRef = signal(this.chaveData(this.hoje));     // visão diária
  semanaRef = signal(this.chaveData(this.hoje));  // visão semanal (qualquer dia da semana)
  ano = signal(this.hoje.getFullYear());          // visão mensal
  mes = signal(this.hoje.getMonth());

  private readonly nomesSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  ngOnInit(): void {
    if (!this.apiService.hasRole('admin')) {
      this.router.navigate(['/home']);
      return;
    }
    this.apiService.listarAgendamentos().subscribe({
      next: (dados) => { this.agendamentos.set(dados); this.carregando.set(false); },
      error: () => this.carregando.set(false),
    });
  }

  // faturamento considera tudo que não foi cancelado (serviços prestados/agendados)
  private validos = computed(() =>
    this.agendamentos().filter(ag => ag.status !== 'Cancelado'));

  // agrupa por dia ('YYYY-MM-DD') -> quantidade e total
  private porDia = computed(() => {
    const mapa = new Map<string, { quantidade: number; total: number }>();
    for (const ag of this.validos()) {
      const chave = this.chaveData(new Date(ag.data_hora));
      const atual = mapa.get(chave) ?? { quantidade: 0, total: 0 };
      atual.quantidade += 1;
      atual.total += ag.valor_total ?? 0;
      mapa.set(chave, atual);
    }
    return mapa;
  });

  // ── Visão DIÁRIA ──
  linhasDia = computed<LinhaDia[]>(() => {
    const chave = this.diaRef();
    return this.validos()
      .filter(ag => this.chaveData(new Date(ag.data_hora)) === chave)
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
      .map(ag => ({
        hora: this.formatarHora(ag.data_hora),
        servico: ag.servico_nome,
        cliente: ag.cliente_nome,
        barbeiro: ag.barbeiro_nome,
        status: ag.status,
        valor: ag.valor_total ?? 0,
      }));
  });

  totalDia = computed(() => this.linhasDia().reduce((s, l) => s + l.valor, 0));

  rotuloDia = computed(() => {
    const [a, m, d] = this.diaRef().split('-').map(Number);
    const t = new Date(a, m - 1, d).toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    return t.charAt(0).toUpperCase() + t.slice(1);
  });

  // ── Visão SEMANAL (domingo a sábado da semana de referência) ──
  linhasSemana = computed<LinhaMes[]>(() => {
    const ref = this.parseChave(this.semanaRef());
    const inicio = this.addDias(ref, -ref.getDay());
    const porDia = this.porDia();

    return Array.from({ length: 7 }, (_, i) => {
      const d = this.addDias(inicio, i);
      const chave = this.chaveData(d);
      const v = porDia.get(chave) ?? { quantidade: 0, total: 0 };
      const [, m, dd] = chave.split('-');
      return { chave, dia: `${this.nomesSemana[i]} ${dd}/${m}`, quantidade: v.quantidade, total: v.total };
    });
  });

  totalSemana = computed(() => this.linhasSemana().reduce((s, l) => s + l.total, 0));
  servicosSemana = computed(() => this.linhasSemana().reduce((s, l) => s + l.quantidade, 0));

  rotuloSemana = computed(() => {
    const linhas = this.linhasSemana();
    const fmt = (chave: string) => {
      const [, m, dd] = chave.split('-');
      return `${dd}/${m}`;
    };
    return `${fmt(linhas[0].chave)} – ${fmt(linhas[6].chave)}`;
  });

  // ── Visão MENSAL ──
  linhasMes = computed<LinhaMes[]>(() => {
    const prefixo = `${this.ano()}-${String(this.mes() + 1).padStart(2, '0')}-`;
    return Array.from(this.porDia())
      .filter(([chave]) => chave.startsWith(prefixo))
      .map(([chave, v]) => {
        const [, m, dd] = chave.split('-');
        return { chave, dia: `${dd}/${m}`, quantidade: v.quantidade, total: v.total };
      })
      .sort((a, b) => (a.chave < b.chave ? -1 : 1));
  });

  totalMes = computed(() => this.linhasMes().reduce((s, l) => s + l.total, 0));
  servicosMes = computed(() => this.linhasMes().reduce((s, l) => s + l.quantidade, 0));

  rotuloMes = computed(() => {
    const t = new Date(this.ano(), this.mes(), 1)
      .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  });

  setVisao(v: VisaoFat): void {
    this.visao.set(v);
  }

  onDiaEscolhido(chave: string): void {
    this.diaRef.set(chave);
  }

  semanaAnterior(): void {
    this.semanaRef.set(this.chaveData(this.addDias(this.parseChave(this.semanaRef()), -7)));
  }

  proximaSemana(): void {
    this.semanaRef.set(this.chaveData(this.addDias(this.parseChave(this.semanaRef()), 7)));
  }

  mesAnterior(): void {
    if (this.mes() === 0) { this.mes.set(11); this.ano.update(a => a - 1); }
    else { this.mes.update(m => m - 1); }
  }

  proximoMes(): void {
    if (this.mes() === 11) { this.mes.set(0); this.ano.update(a => a + 1); }
    else { this.mes.update(m => m + 1); }
  }

  // ── Exportações ──
  exportarDia(): void {
    const linhas = this.linhasDia().map(l => [
      l.hora, l.servico, l.cliente, l.barbeiro, l.status, this.formatarPreco(l.valor),
    ]);
    this.baixarExcel(
      `faturamento-${this.diaRef()}.xls`,
      `Faturamento — ${this.rotuloDia()}`,
      ['Horário', 'Serviço', 'Cliente', 'Barbeiro', 'Status', 'Valor'],
      linhas,
      ['', '', '', '', 'Total do dia', this.formatarPreco(this.totalDia())],
    );
  }

  exportarSemana(): void {
    const linhas = this.linhasSemana().map(l => [
      l.dia, String(l.quantidade), this.formatarPreco(l.total),
    ]);
    this.baixarExcel(
      `faturamento-semana-${this.linhasSemana()[0].chave}.xls`,
      `Faturamento — Semana ${this.rotuloSemana()}`,
      ['Dia', 'Nº de serviços', 'Faturamento'],
      linhas,
      ['Total da semana', String(this.servicosSemana()), this.formatarPreco(this.totalSemana())],
    );
  }

  exportarMes(): void {
    const linhas = this.linhasMes().map(l => [
      l.dia, String(l.quantidade), this.formatarPreco(l.total),
    ]);
    this.baixarExcel(
      `faturamento-${this.ano()}-${String(this.mes() + 1).padStart(2, '0')}.xls`,
      `Faturamento — ${this.rotuloMes()}`,
      ['Dia', 'Nº de serviços', 'Faturamento'],
      linhas,
      ['Total do mês', String(this.servicosMes()), this.formatarPreco(this.totalMes())],
    );
  }

  formatarPreco(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  private formatarHora(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  private chaveData(d: Date): string {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private parseChave(chave: string): Date {
    const [a, m, d] = chave.split('-').map(Number);
    return new Date(a, m - 1, d);
  }

  private addDias(d: Date, n: number): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }

  // gera um arquivo .xls (tabela HTML) que o Excel abre como planilha
  private baixarExcel(
    arquivo: string, titulo: string,
    cabecalhos: string[], linhas: string[][], rodape?: string[],
  ): void {
    const esc = (v: string) =>
      v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    let tabela = '<table border="1" cellspacing="0" cellpadding="4"><thead>';
    tabela += `<tr><th colspan="${cabecalhos.length}" style="background:#C9A84C">${esc(titulo)}</th></tr><tr>`;
    cabecalhos.forEach(c => tabela += `<th style="background:#222;color:#fff">${esc(c)}</th>`);
    tabela += '</tr></thead><tbody>';
    for (const linha of linhas) {
      tabela += '<tr>';
      linha.forEach(c => tabela += `<td>${esc(c)}</td>`);
      tabela += '</tr>';
    }
    if (rodape) {
      tabela += '<tr>';
      rodape.forEach(c => tabela += `<td><b>${esc(c)}</b></td>`);
      tabela += '</tr>';
    }
    tabela += '</tbody></table>';

    const html = `<html><head><meta charset="utf-8"></head><body>${tabela}</body></html>`;
    const blob = new Blob(['﻿', html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = arquivo;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

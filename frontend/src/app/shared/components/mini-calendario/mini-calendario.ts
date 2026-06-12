import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';

interface DiaMini {
  chave: string;          // 'YYYY-MM-DD'
  dia: number;
  dentroDoMes: boolean;
  hoje: boolean;
  desabilitado: boolean;
}

@Component({
  selector: 'app-mini-calendario',
  imports: [],
  templateUrl: './mini-calendario.html',
  styleUrl: './mini-calendario.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniCalendario {
  // dia selecionado e menor data permitida (ambos 'YYYY-MM-DD')
  selecionado = input<string>('');
  minData = input<string>('');
  selecionar = output<string>();

  private hoje = new Date();
  ano = signal(this.hoje.getFullYear());
  mes = signal(this.hoje.getMonth());

  readonly diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  constructor() {
    // quando recebe um dia já selecionado, posiciona o calendário nesse mês
    effect(() => {
      const sel = this.selecionado();
      if (!sel) return;
      const [a, m] = sel.split('-').map(Number);
      this.ano.set(a);
      this.mes.set(m - 1);
    });
  }

  rotuloMes = computed(() => {
    const t = new Date(this.ano(), this.mes(), 1)
      .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  });

  dias = computed<DiaMini[]>(() => {
    const ano = this.ano();
    const mes = this.mes();
    const hojeChave = this.chaveData(new Date());
    const min = this.minData();

    const primeiro = new Date(ano, mes, 1);
    const offset = primeiro.getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const diasMesAnterior = new Date(ano, mes, 0).getDate();

    const celulas: DiaMini[] = [];
    for (let i = offset - 1; i >= 0; i--) {
      celulas.push(this.criarCelula(ano, mes - 1, diasMesAnterior - i, false, hojeChave, min));
    }
    for (let d = 1; d <= diasNoMes; d++) {
      celulas.push(this.criarCelula(ano, mes, d, true, hojeChave, min));
    }
    const resto = celulas.length % 7;
    if (resto !== 0) {
      for (let d = 1; d <= 7 - resto; d++) {
        celulas.push(this.criarCelula(ano, mes + 1, d, false, hojeChave, min));
      }
    }
    return celulas;
  });

  mesAnterior(): void {
    if (this.mes() === 0) { this.mes.set(11); this.ano.update(a => a - 1); }
    else { this.mes.update(m => m - 1); }
  }

  proximoMes(): void {
    if (this.mes() === 11) { this.mes.set(0); this.ano.update(a => a + 1); }
    else { this.mes.update(m => m + 1); }
  }

  escolher(d: DiaMini): void {
    if (!d.dentroDoMes || d.desabilitado) return;
    this.selecionar.emit(d.chave);
  }

  private criarCelula(
    ano: number, mes: number, dia: number,
    dentroDoMes: boolean, hojeChave: string, min: string,
  ): DiaMini {
    const data = new Date(ano, mes, dia);
    const chave = this.chaveData(data);
    return {
      chave,
      dia: data.getDate(),
      dentroDoMes,
      hoje: chave === hojeChave,
      desabilitado: !!min && chave < min,
    };
  }

  private chaveData(d: Date): string {
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}

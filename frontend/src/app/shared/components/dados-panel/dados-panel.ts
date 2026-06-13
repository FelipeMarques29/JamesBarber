import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { environment } from '../../../../environments/environment.development';

interface RegistroImportado {
  id: string;
  _origem?: string;
  _importado_em?: string;
  [key: string]: unknown;
}

interface ImportarResponse {
  status: string;
  total: number;
  itens: RegistroImportado[];
}

@Component({
  selector: 'app-dados-panel',
  imports: [CommonModule, FormsModule],
  templateUrl: './dados-panel.html',
  styleUrl: './dados-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DadosPanel implements OnInit {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly exportando = signal(false);
  readonly importando = signal(false);
  readonly urlImportar = signal('https://jsonplaceholder.typicode.com/users');
  readonly importados = signal<RegistroImportado[]>([]);
  readonly mensagem = signal<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  readonly colunas = computed<string[]>(() => {
    const lista = this.importados();
    if (lista.length === 0) return [];
    const chaves = new Set<string>();
    for (const item of lista) {
      for (const k of Object.keys(item)) {
        if (k === 'id' || k === '_origem' || k === '_importado_em') continue;
        chaves.add(k);
      }
    }
    return Array.from(chaves);
  });

  ngOnInit(): void {
    this.carregarImportados();
  }

  exportar(): void {
    this.exportando.set(true);
    this.mensagem.set(null);

    this.http.get(`${this.apiUrl}/admin/exportar`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        a.href = url;
        a.download = `jamesbarber-export-${ts}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        this.exportando.set(false);
        this.mensagem.set({ tipo: 'ok', texto: 'Exportação concluída.' });
      },
      error: () => {
        this.exportando.set(false);
        this.mensagem.set({ tipo: 'erro', texto: 'Falha ao exportar.' });
      }
    });
  }

  importar(): void {
    const url = this.urlImportar().trim();
    if (!url) {
      this.mensagem.set({ tipo: 'erro', texto: 'Informe uma URL.' });
      return;
    }

    this.importando.set(true);
    this.mensagem.set(null);

    this.http.post<ImportarResponse>(`${this.apiUrl}/admin/importar`, { url }).subscribe({
      next: (res) => {
        this.importando.set(false);
        this.mensagem.set({ tipo: 'ok', texto: `${res.total} registro(s) importado(s).` });
        this.carregarImportados();
      },
      error: (err: HttpErrorResponse) => {
        this.importando.set(false);
        this.mensagem.set({
          tipo: 'erro',
          texto: err.error?.detail ?? 'Falha ao importar dados.'
        });
      }
    });
  }

  limpar(): void {
    if (!confirm('Apagar todos os dados importados?')) return;
    this.http.delete(`${this.apiUrl}/admin/importados`).subscribe({
      next: () => {
        this.importados.set([]);
        this.mensagem.set({ tipo: 'ok', texto: 'Dados importados removidos.' });
      },
      error: () => this.mensagem.set({ tipo: 'erro', texto: 'Falha ao limpar.' })
    });
  }

  private carregarImportados(): void {
    this.http.get<RegistroImportado[]>(`${this.apiUrl}/admin/importados`).subscribe({
      next: (lista) => this.importados.set(lista),
      error: () => this.importados.set([])
    });
  }

  formatarValor(valor: unknown): string {
    if (valor === null || valor === undefined) return '—';
    if (typeof valor === 'object') return JSON.stringify(valor);
    return String(valor);
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Navbar } from '@shared/components/navbar/navbar';
import { ApiService } from '@core/api-service';
import { Servico, TipoServico } from '@shared/models/servicos-model';

@Component({
  selector: 'app-home',
  imports: [CommonModule, Navbar, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private apiService = inject(ApiService);

  readonly servicos = signal<Servico[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal(false);

  // Ícone (em /icons) usado para cada tipo de serviço cadastrado pelo admin.
  private static readonly ICONES: Record<TipoServico, string> = {
    corte: 'scissors.svg',
    barba: 'razor.svg',
    corte_barba: 'star.svg',
    hidratacao: 'bottle.svg',
    coloracao: 'barber-pole.svg',
    sobrancelha: 'eyebrow.svg',
  };

  // View-model pronto para o template: ícone e delay de animação já resolvidos.
  readonly cards = computed(() =>
    this.servicos().map((servico, i) => ({
      ...servico,
      icone: '/icons/' + (Home.ICONES[servico.tipo] ?? 'scissors.svg'),
      delay: (i * 0.08).toFixed(2) + 's',
    }))
  );

  ngOnInit() {
    this.apiService.listarServicos().subscribe({
      next: (servicos) => {
        this.servicos.set(servicos);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }
}

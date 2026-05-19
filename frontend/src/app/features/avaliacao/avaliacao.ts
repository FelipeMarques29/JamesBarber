import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../shared/components/navbar/navbar';

interface Review {
  id: number;
  autor: string;
  avatarUrl: string;
  rating: number;
  titulo: string;
  descricao: string;
  data: string;
}

type EstrelaTipo = 'full' | 'half' | 'empty';

@Component({
  selector: 'app-avaliacao',
  imports: [CommonModule, ReactiveFormsModule, Navbar],
  templateUrl: './avaliacao.html',
  styleUrl: './avaliacao.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Avaliacao {
  private fb = inject(FormBuilder);

  readonly modalAberto = signal(false);
  readonly hoverRating = signal(0);

  readonly reviews = signal<Review[]>([
    {
      id: 1,
      autor: 'Lucas Pereira',
      avatarUrl: 'https://randomuser.me/api/portraits/men/72.jpg',
      rating: 5,
      titulo: 'Melhor barbearia da cidade',
      descricao: 'Atendimento impecável, ambiente sofisticado e o corte ficou exatamente como pedi. Já virei cliente fiel.',
      data: 'há 2 dias',
    },
    {
      id: 2,
      autor: 'Felipe Marques',
      avatarUrl: 'https://randomuser.me/api/portraits/men/55.jpg',
      rating: 5,
      titulo: 'Combo Premium vale cada centavo',
      descricao: 'Saí da barbearia me sentindo outro homem. Barba, corte e sobrancelha alinhados na perfeição. Recomendo demais.',
      data: 'há 5 dias',
    },
    {
      id: 3,
      autor: 'Gustavo Lima',
      avatarUrl: 'https://randomuser.me/api/portraits/men/41.jpg',
      rating: 4.5,
      titulo: 'Profissionais muito atentos',
      descricao: 'Marquei pelo whatsapp e fui atendido no horário marcado. Único detalhe é a fila no sábado à tarde, fora isso top.',
      data: 'há 1 semana',
    },
    {
      id: 4,
      autor: 'Rafael Vieira',
      avatarUrl: 'https://randomuser.me/api/portraits/men/19.jpg',
      rating: 5,
      titulo: 'Pigmentação ficou natural',
      descricao: 'Estava com fios brancos e o Diego mandou super bem na pigmentação. Resultado natural, sem aspecto pintado.',
      data: 'há 2 semanas',
    },
    {
      id: 5,
      autor: 'André Santos',
      avatarUrl: 'https://randomuser.me/api/portraits/men/85.jpg',
      rating: 4.5,
      titulo: 'Ambiente diferenciado',
      descricao: 'Decoração premium, café gratuito enquanto espera e profissionais educados. Cuidam de cada detalhe.',
      data: 'há 3 semanas',
    },
    {
      id: 6,
      autor: 'Diego Almeida',
      avatarUrl: 'https://randomuser.me/api/portraits/men/63.jpg',
      rating: 5,
      titulo: 'Hidratação salvou meu cabelo',
      descricao: 'Meu cabelo estava ressecado demais e a hidratação com produtos premium mudou completamente. Saí brilhando.',
      data: 'há 1 mês',
    },
  ]);

  readonly mediaRating = computed(() => {
    const list = this.reviews();
    if (list.length === 0) return 0;
    const soma = list.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((soma / list.length) * 10) / 10;
  });

  readonly form = this.fb.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    titulo: ['', [Validators.required, Validators.minLength(4)]],
    descricao: ['', [Validators.required, Validators.minLength(15)]],
    autor: ['', [Validators.required, Validators.minLength(3)]],
  });

  estrelasDe(rating: number): EstrelaTipo[] {
    return Array.from({ length: 5 }, (_, i) => {
      const diff = rating - i;
      if (diff >= 1) return 'full';
      if (diff >= 0.5) return 'half';
      return 'empty';
    });
  }

  readonly estrelasInput = computed<EstrelaTipo[]>(() => {
    const hover = this.hoverRating();
    const valor = this.form.controls.rating.value ?? 0;
    return this.estrelasDe(hover || valor);
  });

  abrirModal(): void {
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.hoverRating.set(0);
    this.form.reset({ rating: 5, titulo: '', descricao: '', autor: '' });
  }

  selecionarEstrela(n: number): void {
    this.form.controls.rating.setValue(n);
  }

  hoverEstrela(n: number): void {
    this.hoverRating.set(n);
  }

  resetHover(): void {
    this.hoverRating.set(0);
  }

  enviarReview(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const novo: Review = {
      id: Date.now(),
      autor: v.autor!,
      avatarUrl: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 99)}.jpg`,
      rating: v.rating!,
      titulo: v.titulo!,
      descricao: v.descricao!,
      data: 'agora',
    };
    this.reviews.update((list) => [novo, ...list]);
    this.fecharModal();
  }
}

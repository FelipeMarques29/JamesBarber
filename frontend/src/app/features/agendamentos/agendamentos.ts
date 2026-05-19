import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Navbar } from '@shared/components/navbar/navbar';
import { Agendamento } from '@shared/models/agendamento-model';


@Component({
  selector: 'app-agendamentos',
  imports: [CommonModule, ReactiveFormsModule, Navbar],
  templateUrl: './agendamentos.html',
  styleUrl: './agendamentos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class Agendamentos {
  private fb = inject(FormBuilder);

  readonly servicos = [
    { nome: 'Corte Clássico', preco: 45 },
    { nome: 'Barba Completa', preco: 35 },
    { nome: 'Combo Premium', preco: 95 },
    { nome: 'Sobrancelha', preco: 20 },
    { nome: 'Pigmentação', preco: 60 },
    { nome: 'Hidratação', preco: 40 },
  ];

  readonly barbeiros = [
    'Marcos Silva',
    'Rafael Costa',
    'João Henrique',
    'Diego Almeida',
    'Pedro Martins',
    'Bruno Carvalho',
  ];

  readonly agendamentos = signal<Agendamento[]>([
    {
      id: 1,
      cliente: 'Lucas Pereira',
      servico: 'Combo Premium',
      barbeiro: 'Marcos Silva',
      data: '2026-05-15',
      hora: '14:30',
      preco: 95,
      status: 'confirmado',
    },
    {
      id: 2,
      cliente: 'Felipe Marques',
      servico: 'Corte Clássico',
      barbeiro: 'Rafael Costa',
      data: '2026-05-16',
      hora: '10:00',
      preco: 45,
      status: 'pendente',
    },
    {
      id: 3,
      cliente: 'Gustavo Lima',
      servico: 'Barba Completa',
      barbeiro: 'João Henrique',
      data: '2026-05-14',
      hora: '17:00',
      preco: 35,
      status: 'confirmado',
    },
    {
      id: 4,
      cliente: 'Rafael Vieira',
      servico: 'Pigmentação',
      barbeiro: 'Diego Almeida',
      data: '2026-05-13',
      hora: '09:30',
      preco: 60,
      status: 'concluido',
    },
  ]);

  readonly totalSemana = computed(() =>
    this.agendamentos()
      .filter((a) => a.status !== 'concluido')
      .reduce((acc, a) => acc + a.preco, 0),
  );

  readonly form = this.fb.group({
    cliente: ['', [Validators.required, Validators.minLength(3)]],
    servico: ['', Validators.required],
    barbeiro: ['', Validators.required],
    data: ['', Validators.required],
    hora: ['', Validators.required],
  });

  agendar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const servico = this.servicos.find((s) => s.nome === v.servico);
    const novo: Agendamento = {
      id: Date.now(),
      cliente: v.cliente!,
      servico: v.servico!,
      barbeiro: v.barbeiro!,
      data: v.data!,
      hora: v.hora!,
      preco: servico?.preco ?? 0,
      status: 'pendente',
    };
    this.agendamentos.update((list) => [novo, ...list]);
    this.form.reset();
  }

  cancelar(id: number): void {
    this.agendamentos.update((list) => list.filter((a) => a.id !== id));
  }

  confirmar(id: number): void {
    this.agendamentos.update((list) =>
      list.map((a) => (a.id === id ? { ...a, status: 'confirmado' } : a)),
    );
  }

  formatarData(data: string): string {
    const [y, m, d] = data.split('-');
    return `${d}/${m}/${y}`;
  }
}

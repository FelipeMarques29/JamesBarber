import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '@core/api-service';
import { RouterLink } from '@angular/router';
import { ClienteLista } from '@shared/models/cliente-model';

import { Navbar } from '@shared/components/navbar/navbar';
import { BarbeiroCard, MOCK_EXTRA, ESPECIALIDADES } from '@shared/models/funcionarios-model';

@Component({
  selector: 'app-funcionarios',
  imports: [CommonModule, Navbar, RouterLink],
  templateUrl: './funcionarios.html',
  styleUrl: './funcionarios.css',
})

export class Funcionarios implements OnInit {
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  barbeiros: BarbeiroCard[] = [];
  carregando = false;

  ngOnInit(): void {
    this.carregarBarbeiros();
  }

  carregarBarbeiros(): void {
    this.carregando = true;
    this.apiService.listarBarbeiros().subscribe({
      next: (res) => {
        const filtrados = res.filter(f => f.status === 'funcionario' && f.funcao === 'barbeiro');
        this.barbeiros = filtrados.map((b, i) => ({
          ...b,
          ...(MOCK_EXTRA[b.email] ?? {
            experiencia: 3 + i,
            especialidade: ESPECIALIDADES[i % ESPECIALIDADES.length],
            descricao: 'Profissional dedicado, com foco em qualidade e atenção aos detalhes.',
          }),
        }));
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('erro:', err);
        this.carregando = false;
        this.cdr.detectChanges();
      },
    });
  }
}

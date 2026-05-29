import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { ApiService } from '@core/api-service';

@Component({
  selector: 'app-recuperar-senha',
  imports: [CommonModule, FormsModule],
  templateUrl: './recuperar-senha.html',
  styleUrl: './recuperar-senha.css',
})
export class RecuperarSenha {
  private apiService = inject(ApiService);
  private router = inject(Router);

  readonly email = signal('');
  readonly enviando = signal(false);
  readonly senhaTemporaria = signal<string | null>(null);
  readonly erro = signal<string | null>(null);

  enviar() {
    const email = this.email().trim();
    if (!email) {
      this.erro.set('Informe um e-mail válido.');
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);
    this.senhaTemporaria.set(null);

    this.apiService.recuperarSenha({ email }).subscribe({
      next: (res) => {
        this.senhaTemporaria.set(res.senha_temporaria);
        this.enviando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.erro.set(
          err.status === 404 ? 'E-mail não cadastrado.' : 'Falha ao recuperar a senha.'
        );
        this.enviando.set(false);
      }
    });
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }
}

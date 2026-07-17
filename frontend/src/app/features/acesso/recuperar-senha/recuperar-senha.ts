import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '@core/auth-service';

@Component({
  selector: 'app-recuperar-senha',
  imports: [CommonModule, FormsModule],
  templateUrl: './recuperar-senha.html',
  styleUrl: './recuperar-senha.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecuperarSenha {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly email = signal('');
  readonly enviando = signal(false);
  readonly enviado = signal(false);
  readonly erro = signal<string | null>(null);

  async enviar() {
    const email = this.email().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.erro.set('Informe um e-mail válido.');
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);

    try {
      await this.authService.enviarEmailRedefinicaoSenha(email);
      this.enviado.set(true);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? '';
      this.erro.set(this.traduzirErro(code));
    } finally {
      this.enviando.set(false);
    }
  }

  private traduzirErro(code: string): string {
    const erros: Record<string, string> = {
      'auth/invalid-email': 'E-mail inválido.',
      'auth/user-not-found': 'E-mail não cadastrado.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    };
    return erros[code] ?? 'Não foi possível enviar o e-mail. Tente novamente.';
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }
}

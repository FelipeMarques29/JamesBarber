import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { ApiService } from '@core/api-service';

@Component({
  selector: 'app-definir-senha',
  imports: [CommonModule, FormsModule],
  templateUrl: './definir-senha.html',
  styleUrl: './definir-senha.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefinirSenha {
  private apiService = inject(ApiService);
  private router = inject(Router);

  private readonly MIN_SENHA = 6;

  readonly novaSenha = signal('');
  readonly confirmarSenha = signal('');
  readonly enviando = signal(false);
  readonly erro = signal<string | null>(null);

  salvar() {
    const nova = this.novaSenha();
    const confirmar = this.confirmarSenha();

    if (nova.length < this.MIN_SENHA) {
      this.erro.set(`A senha deve ter pelo menos ${this.MIN_SENHA} caracteres.`);
      return;
    }
    if (nova !== confirmar) {
      this.erro.set('As senhas não coincidem.');
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);

    this.apiService.redefinirSenha({ nova_senha: nova }).subscribe({
      next: () => {
        this.limparFlagLocal();
        this.enviando.set(false);
        this.router.navigate(['/home']);
      },
      error: (err: HttpErrorResponse) => {
        this.erro.set(
          err.status === 401
            ? 'Sua sessão expirou. Entre novamente para redefinir a senha.'
            : 'Não foi possível redefinir a senha. Tente novamente.'
        );
        this.enviando.set(false);
      },
    });
  }

  // Remove a marcação de senha temporária do perfil em cache (localStorage).
  private limparFlagLocal() {
    try {
      const bruto = localStorage.getItem('usuario');
      if (!bruto) return;
      const usuario = JSON.parse(bruto);
      usuario.deve_trocar_senha = false;
      localStorage.setItem('usuario', JSON.stringify(usuario));
    } catch {
      // cache local não é crítico para o fluxo.
    }
  }
}
